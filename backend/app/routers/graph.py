"""Concept-graph read API — the frontend's force-graph data source.

The read logic and response models live in ``app.services.graph_read`` (shared
with the MCP graph tools). One call returns the whole workspace graph: concept
nodes (sized by mention count), relation edges (links), and clusters (colouring).
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.services.graph_read import (
    GraphCluster,  # noqa: F401 — re-exported for importers of this router
    GraphLink,  # noqa: F401
    GraphNode,  # noqa: F401
    GraphOut,
    read_graph,
)
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("", response_model=GraphOut)
async def get_graph(
    workspace_id: uuid.UUID | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> GraphOut:
    """Return the full concept graph for a workspace (default: caller's personal)."""
    if workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
        await session.commit()
        workspace_id = workspace.id
    else:
        await require_workspace(session, user.id, workspace_id)
    return await read_graph(session, workspace_id)
