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

from app.ai import RELATION_TYPES
from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Cluster, Concept, ConceptMention, Edge
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/graph", tags=["graph"])

# Vocabulary precedence for collapsing competing relation types on one pair (lower =
# wins a weight tie). Unknown/legacy free-text relations sort last.
_REL_PRIORITY = {t: i for i, t in enumerate(RELATION_TYPES)}


class GraphNode(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_id: uuid.UUID | None
    mentions: int  # number of distinct papers that mention it — drives node size


class GraphLink(BaseModel):
    id: uuid.UUID  # edge id — lets the UI edit/delete a specific relation
    source: uuid.UUID
    target: uuid.UUID
    relation: str
    weight: int  # times this relation was seen — drives link thickness


class GraphCluster(BaseModel):
    id: uuid.UUID
    label: str | None
    parent_id: uuid.UUID | None = None  # hierarchy: leaf clusters point at a parent


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

    # Distinct-paper count per concept, folded into the node query so size is one
    # round-trip. Counting distinct documents (not raw mention rows) is the signal the
    # use case wants — "appears in N papers" — and is stable under the provenance
    # re-link, where one paper contributes several chunk mentions per concept.
    mentions = (
        select(
            ConceptMention.concept_id.label("cid"),
            func.count(func.distinct(ConceptMention.document_id)).label("n"),
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
            ).where(Edge.workspace_id == workspace_id, Edge.kind == "relation")
        )
    ).all()

    # Collapse competing relation types on one ordered pair into a single link: its
    # dominant type (most papers assert it; ties broken by vocabulary precedence), with
    # thickness = total assertions across all types on the pair. Keeps the map legible
    # (one labelled edge per pair) while edge weights still mean "papers that agree".
    collapsed: dict[tuple[uuid.UUID, uuid.UUID], dict] = {}
    for eid, s, t, rel, w in link_rows:
        cur = collapsed.get((s, t))
        if cur is None:
            collapsed[(s, t)] = {"id": eid, "relation": rel, "win": w, "total": w}
            continue
        cur["total"] += w
        if w > cur["win"] or (
            w == cur["win"]
            and _REL_PRIORITY.get(rel, 99) < _REL_PRIORITY.get(cur["relation"], 99)
        ):
            cur["id"], cur["relation"], cur["win"] = eid, rel, w

    # Only LEAF clusters (the ones concepts actually attach to) drive the flat
    # topic list + node colouring; parent clusters exist for the hierarchy and are
    # reachable via `parent_id`, but listing them here would clutter the UI with
    # empty topics. The whole tree is fetched separately when a UI needs it.
    leaf_ids = (
        select(Concept.cluster_id)
        .where(Concept.workspace_id == workspace_id, Concept.cluster_id.isnot(None))
        .distinct()
        .scalar_subquery()
    )
    cluster_rows = (
        await session.execute(
            select(Cluster.id, Cluster.label, Cluster.parent_id).where(
                Cluster.workspace_id == workspace_id,
                Cluster.id.in_(leaf_ids),
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
            GraphLink(
                id=v["id"], source=s, target=t, relation=v["relation"], weight=v["total"]
            )
            for (s, t), v in collapsed.items()
        ],
        clusters=[
            GraphCluster(id=r[0], label=r[1], parent_id=r[2]) for r in cluster_rows
        ],
    )
