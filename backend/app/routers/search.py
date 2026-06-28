"""Semantic search (F7) — embed the query, return nearest concepts + passages.

The retrieval logic and response models live in ``app.services.search`` (shared
with the MCP memory tools); this router is the workspace-scoped HTTP surface.
Workspace-scoped like the graph read API: no ``workspace_id`` → the caller's
personal workspace.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.services.search import (
    DEFAULT_LIMIT,
    MAX_LIMIT,
    EmbeddingUnavailable,
    SearchConcept,  # noqa: F401 — re-exported for importers of this router
    SearchOut,
    SearchPassage,  # noqa: F401
    semantic_search,
)
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchOut)
async def search(
    q: str = Query(..., description="natural-language query"),
    workspace_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SearchOut:
    """Embed `q` and return the nearest concepts and source passages."""
    if workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
        await session.commit()
        workspace_id = workspace.id
    else:
        await require_workspace(session, user.id, workspace_id)

    # Embedding needs OpenAI; surface its absence as a clean 503 rather than a 500.
    try:
        return await semantic_search(session, workspace_id, q, limit)
    except EmbeddingUnavailable as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "search unavailable (embedding failed)"
        ) from exc
