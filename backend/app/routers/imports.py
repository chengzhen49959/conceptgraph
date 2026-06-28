"""Web clip ingestion — the Chrome clipper extension's entrypoint.

The extension extracts a page's clean main text as Markdown client-side (Readability
→ turndown) and POSTs it here in one request. The shared ingest logic (server-side
S3 write, canonical-URL de-dup, enqueue the same pipeline as file upload) lives in
``app.services.clip`` and is reused by the MCP ``memory_write`` tool.
"""

import uuid

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.services.clip import clip_document

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
    result = await clip_document(
        session,
        request.app.state.arq,
        user_id=user.id,
        title=body.title,
        content=body.content,
        source_url=body.source_url,
        workspace_id=body.workspace_id,
        metadata=body.metadata,
    )
    return ClipResponse(
        document_id=result.document_id, job_id=result.job_id, duplicate=result.duplicate
    )
