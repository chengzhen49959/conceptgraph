"""Concept-graph read API — the frontend's force-graph data source.

One call returns the whole workspace graph: concept nodes (sized by mention
count), relation edges (links), and clusters (for node colouring). The frontend
renders it as an Obsidian-style force-directed graph; node positions are computed
client-side, so the server stays a plain projection of the tables.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Cluster, Concept, ConceptMention, Edge
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/graph", tags=["graph"])


class GraphNode(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_id: uuid.UUID | None
    mentions: int  # provenance count — drives node size in the UI


class GraphLink(BaseModel):
    id: uuid.UUID  # edge id — lets the UI edit/delete a specific relation
    source: uuid.UUID
    target: uuid.UUID
    relation: str
    weight: int  # times this relation was seen — drives link thickness


class GraphCluster(BaseModel):
    id: uuid.UUID
    label: str | None


class GraphOut(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]
    clusters: list[GraphCluster]


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

    # Mention count per concept, folded into the node query so size is one round-trip.
    mentions = (
        select(
            ConceptMention.concept_id.label("cid"),
            func.count().label("n"),
        )
        .group_by(ConceptMention.concept_id)
        .subquery()
    )
    node_rows = (
        await session.execute(
            select(
                Concept.id,
                Concept.name,
                Concept.description,
                Concept.cluster_id,
                func.coalesce(mentions.c.n, 0),
            )
            .outerjoin(mentions, mentions.c.cid == Concept.id)
            .where(Concept.workspace_id == workspace_id)
            .order_by(Concept.name)
        )
    ).all()

    link_rows = (
        await session.execute(
            select(
                Edge.id,
                Edge.source_concept_id,
                Edge.target_concept_id,
                Edge.relation,
                Edge.weight,
            ).where(Edge.workspace_id == workspace_id)
        )
    ).all()

    cluster_rows = (
        await session.execute(
            select(Cluster.id, Cluster.label).where(
                Cluster.workspace_id == workspace_id
            )
        )
    ).all()

    return GraphOut(
        nodes=[
            GraphNode(
                id=r[0], name=r[1], description=r[2], cluster_id=r[3], mentions=r[4]
            )
            for r in node_rows
        ],
        links=[
            GraphLink(id=r[0], source=r[1], target=r[2], relation=r[3], weight=r[4])
            for r in link_rows
        ],
        clusters=[GraphCluster(id=r[0], label=r[1]) for r in cluster_rows],
    )
