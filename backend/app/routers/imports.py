"""Web clip ingestion — the Chrome clipper extension's entrypoint.

The extension extracts a page's clean main text as Markdown client-side (Readability
→ turndown) and POSTs it here in one request. Unlike file upload (``documents.py``),
the backend writes the text to S3 itself (server-side ``put_object``) instead of
handing the browser a presigned URL, so the extension never talks to S3. The page URL
and scraped page metadata are recorded on the document for provenance.

From there a clip joins the *exact same* ingest pipeline as an uploaded file —
parse → chunk → embed → extract → merge/dedup → cluster — so its concepts merge into
the workspace graph. Re-clipping a page already in the workspace is de-duped by
canonical URL (the existing document is returned; nothing re-ingests); a *related*
page still merges its concepts in, bumping mention counts rather than duplicating nodes.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.config import get_settings
from app.db import get_session
from app.models import Document
from app.routers.documents import persist_and_enqueue_document
from app.services.storage import put_object
from app.services.urls import normalize_url
from app.services.workspaces import (
    can_edit_graph,
    ensure_personal_workspace,
    require_workspace_role,
)

router = APIRouter(prefix="/api/imports", tags=["imports"])


class ClipRequest(BaseModel):
    title: str
    content: str  # clean main text as Markdown (Readability → turndown); never raw HTML
    source_url: str
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace
    metadata: dict | None = None  # page metadata scraped client-side (author/date/site/image)


class ClipResponse(BaseModel):
    document_id: uuid.UUID
    job_id: str | None
    duplicate: bool = False  # page already clipped into this workspace → existing doc returned


@router.post("/clip", response_model=ClipResponse)
async def clip(
    body: ClipRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ClipResponse:
    # Reject an oversized clip before any work: each ~512-token chunk costs one
    # extraction LLM call, so an unbounded body fans out to a slow, expensive job.
    settings = get_settings()
    if len(body.content) > settings.clip_max_chars:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Clipped text is too large ({len(body.content):,} chars, limit "
            f"{settings.clip_max_chars:,}). Try clipping just a selection.",
        )

    # Same access rule as file upload: personal workspace by default, else the
    # caller must be an owner/editor of the target workspace.
    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
    else:
        workspace, role = await require_workspace_role(
            session, user.id, body.workspace_id
        )
        if not can_edit_graph(role):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "only an editor or owner can clip into this workspace",
            )

    # De-dup: a page already clipped into this workspace returns its existing
    # document instead of ingesting a duplicate. Re-clipping isn't an error — it's
    # an idempotent no-op pointing back at the original (no S3 write, no job).
    canonical = normalize_url(body.source_url)
    if canonical:
        existing = (
            await session.execute(
                select(Document).where(
                    Document.workspace_id == workspace.id,
                    Document.source_url_canonical == canonical,
                )
            )
        ).scalars().first()
        if existing is not None:
            return ClipResponse(document_id=existing.id, job_id=None, duplicate=True)

    arq = request.app.state.arq
    if arq is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "ingestion queue unavailable (REDIS_URL not configured)",
        )

    # Empty content is allowed: the extension's "save link only" fallback (when
    # extraction fails) clips with no body. The worker short-circuits an empty
    # parse to status=done, leaving a document that records source_url but adds
    # no concepts — provenance kept without polluting the graph.
    document_id = uuid.uuid4()
    s3_key = f"{workspace.id}/{document_id}/clip.md"
    # Write the clipped Markdown ourselves, before persisting the row, so an S3
    # misconfig fails before we orphan a row (mirrors the presign-first ordering in
    # create_document). "markdown" source_type → utf-8 decode + reference-strip in
    # the parser (parse.py); the chunker is structure-agnostic.
    await put_object(s3_key, body.content.encode("utf-8"), "text/markdown")

    # A "save link only" clip (empty body, extraction failed) records provenance but
    # does NOT claim the canonical key, so a later successful clip of the same page
    # still ingests its content instead of de-duping into the empty stub.
    stored_canonical = canonical if body.content.strip() else None

    job_id = await persist_and_enqueue_document(
        session,
        arq,
        document_id=document_id,
        workspace_id=workspace.id,
        title=body.title or body.source_url,
        source_type="markdown",
        s3_key=s3_key,
        source_url=body.source_url,
        source_url_canonical=stored_canonical,
        doc_metadata=body.metadata,
    )
    return ClipResponse(document_id=document_id, job_id=job_id)
