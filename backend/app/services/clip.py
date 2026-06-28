"""Ingest a piece of text (a web clip, or an AI-written note) into a workspace.

Shared by the HTTP ``/api/imports/clip`` route and the MCP ``memory_write`` tool.
Writes the Markdown to S3 server-side, de-dups by canonical URL, and enqueues the
*same* ``ingest_document`` pipeline as file upload, so the text's concepts merge
into the workspace graph. The arq pool is passed in (the HTTP route uses
``request.app.state.arq``; the MCP tool uses ``app.mcp.runtime.get_arq``).
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Document
from app.routers.documents import persist_and_enqueue_document
from app.services.storage import put_object
from app.services.urls import normalize_url
from app.services.workspaces import (
    can_edit_graph,
    ensure_personal_workspace,
    require_workspace_role,
)


@dataclass
class ClipResult:
    document_id: uuid.UUID
    job_id: str | None
    duplicate: bool  # source URL already ingested → existing document returned


async def clip_document(
    session: AsyncSession,
    arq: Any,
    *,
    user_id: str,
    title: str,
    content: str,
    source_url: str | None = None,
    workspace_id: uuid.UUID | None = None,
    metadata: dict | None = None,
) -> ClipResult:
    """Persist + enqueue a Markdown document. Raises ``HTTPException`` on an
    oversized body (413), missing write access (403), or no queue (503)."""
    settings = get_settings()
    # Reject an oversized body before any work: each ~512-token chunk costs one
    # extraction LLM call, so an unbounded body fans out to a slow, expensive job.
    if len(content) > settings.clip_max_chars:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Text is too large ({len(content):,} chars, limit "
            f"{settings.clip_max_chars:,}). Save a shorter excerpt.",
        )

    # Personal workspace by default; else the caller must be an owner/editor.
    if workspace_id is None:
        workspace = await ensure_personal_workspace(session, user_id)
    else:
        workspace, role = await require_workspace_role(session, user_id, workspace_id)
        if not can_edit_graph(role):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "only an editor or owner can write into this workspace",
            )

    # De-dup by canonical URL: re-saving a page already in the workspace is an
    # idempotent no-op pointing back at the original (no S3 write, no job).
    canonical = normalize_url(source_url) if source_url else None
    if canonical:
        existing = (
            (
                await session.execute(
                    select(Document).where(
                        Document.workspace_id == workspace.id,
                        Document.source_url_canonical == canonical,
                    )
                )
            )
            .scalars()
            .first()
        )
        if existing is not None:
            return ClipResult(document_id=existing.id, job_id=None, duplicate=True)

    if arq is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "ingestion queue unavailable (REDIS_URL not configured)",
        )

    document_id = uuid.uuid4()
    s3_key = f"{workspace.id}/{document_id}/clip.md"
    # Write the Markdown ourselves before persisting the row, so an S3 misconfig
    # fails before we orphan a row. "markdown" source_type → utf-8 decode +
    # reference-strip in the parser; the chunker is structure-agnostic.
    await put_object(s3_key, content.encode("utf-8"), "text/markdown")

    # An empty body (e.g. "save link only") records provenance but does NOT claim
    # the canonical key, so a later non-empty save of the same URL still ingests.
    stored_canonical = canonical if content.strip() else None

    job_id = await persist_and_enqueue_document(
        session,
        arq,
        document_id=document_id,
        workspace_id=workspace.id,
        title=title or (source_url or "Untitled note"),
        source_type="markdown",
        s3_key=s3_key,
        source_url=source_url or None,
        source_url_canonical=stored_canonical,
        doc_metadata=metadata,
    )
    return ClipResult(document_id=document_id, job_id=job_id, duplicate=False)
