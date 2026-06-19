"""Cluster delete — the only write the frontend makes against clusters.

Clusters are otherwise a derived, read-only projection of the graph (see
graph.py); they have no create/list endpoints of their own. Deleting one here is
destructive by request: it removes the cluster's concept nodes and their edges
too, not just the grouping. The source documents and chunks are left intact.
"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Cluster, Concept
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/clusters", tags=["clusters"])


class DeleteClustersRequest(BaseModel):
    ids: list[uuid.UUID]
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace


class DeleteClustersResponse(BaseModel):
    deleted_clusters: int
    deleted_concepts: int


@router.post("/delete", response_model=DeleteClustersResponse)
async def delete_clusters(
    body: DeleteClustersRequest,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeleteClustersResponse:
    """Delete clusters along with every concept (and edge) they contained.

    Deleting the concepts cascades to their edges, aliases, and mentions; the
    documents and chunks those mentions pointed at survive. Workspace ownership is
    enforced by the WHERE clause; missing ids are skipped, so a repeat delete is a
    no-op success.
    """
    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
    else:
        workspace = await require_workspace(session, user.id, body.workspace_id)

    if not body.ids:
        return DeleteClustersResponse(deleted_clusters=0, deleted_concepts=0)

    # Concepts first (cascade strips their edges/aliases/mentions)...
    concept_result = await session.execute(
        delete(Concept).where(
            Concept.workspace_id == workspace.id,
            Concept.cluster_id.in_(body.ids),
        )
    )
    # ...then the now-empty cluster rows themselves.
    cluster_result = await session.execute(
        delete(Cluster).where(
            Cluster.workspace_id == workspace.id,
            Cluster.id.in_(body.ids),
        )
    )
    await session.commit()

    return DeleteClustersResponse(
        deleted_clusters=cluster_result.rowcount or 0,
        deleted_concepts=concept_result.rowcount or 0,
    )
