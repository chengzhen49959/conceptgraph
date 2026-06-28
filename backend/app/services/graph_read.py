"""Read the whole concept graph for a workspace (nodes, links, clusters).

Shared by the HTTP graph router and the MCP graph tools. The graph is a plain
projection of the tables; node positions are computed by the client. Competing
relation types on one ordered pair collapse to a single dominant link.
"""

from __future__ import annotations

import uuid

from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import RELATION_TYPES
from app.models import Cluster, Concept, ConceptMention, Edge

# Vocabulary precedence for collapsing competing relation types on one pair (lower
# wins a weight tie). Unknown/legacy free-text relations sort last.
_REL_PRIORITY = {t: i for i, t in enumerate(RELATION_TYPES)}


class GraphNode(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_id: uuid.UUID | None
    mentions: int  # distinct documents that mention it — drives node size


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


async def read_graph(session: AsyncSession, workspace_id: uuid.UUID) -> GraphOut:
    """Return the full concept graph for a workspace."""
    # Distinct-paper count per concept, folded into the node query so size is one
    # round-trip ("appears in N papers", stable under the provenance re-link).
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

    # Collapse competing relation types on one ordered pair into a single dominant
    # link (most papers assert it; ties broken by vocabulary precedence); thickness
    # = total assertions across all types on the pair.
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

    # Only LEAF clusters (the ones concepts actually attach to) drive the topic
    # list + node colouring; parents are reachable via parent_id.
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
            GraphNode(id=r[0], name=r[1], description=r[2], cluster_id=r[3], mentions=r[4])
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


# --- Single-concept neighbours (for graph-walking retrieval) ------------------
# read_graph returns the WHOLE link set; the agent needs one concept's direct
# relations to walk the graph hop by hop. This is that targeted query, kept here
# next to the graph projection it complements.


class ConceptNeighbor(BaseModel):
    neighbor_id: uuid.UUID
    name: str
    relation: str  # the directed relation verb (e.g. "extends", "uses")
    direction: str  # "out" = concept→neighbour, "in" = neighbour→concept
    weight: int  # papers asserting it — how strong the link is


async def get_concept_neighbors(
    session: AsyncSession, workspace_id: uuid.UUID, concept_id: uuid.UUID
) -> list[ConceptNeighbor]:
    """Concepts directly linked to ``concept_id`` by a typed relation edge, with
    the verb, direction, and weight (strongest first).

    Only ``kind='relation'`` edges (the human-meaningful, view-visible relations)
    are returned; the ``cooccur`` clustering substrate is excluded. A concept with
    no relations returns ``[]`` — never an error — so a leaf node is just a short
    walk, not a failure the agent has to handle.
    """
    edge_rows = (
        await session.execute(
            select(
                Edge.source_concept_id,
                Edge.target_concept_id,
                Edge.relation,
                Edge.weight,
            ).where(
                Edge.workspace_id == workspace_id,
                Edge.kind == "relation",
                or_(
                    Edge.source_concept_id == concept_id,
                    Edge.target_concept_id == concept_id,
                ),
            )
        )
    ).all()
    if not edge_rows:
        return []

    neighbor_ids = {(t if s == concept_id else s) for s, t, _, _ in edge_rows}
    names = dict(
        (
            await session.execute(
                select(Concept.id, Concept.name).where(Concept.id.in_(neighbor_ids))
            )
        ).all()
    )

    out: list[ConceptNeighbor] = []
    for s, t, rel, w in edge_rows:
        nid, direction = (t, "out") if s == concept_id else (s, "in")
        name = names.get(nid)
        if name is None:  # endpoint GC'd mid-read — skip rather than emit a blank
            continue
        out.append(
            ConceptNeighbor(
                neighbor_id=nid, name=name, relation=rel, direction=direction, weight=w
            )
        )
    out.sort(key=lambda n: n.weight, reverse=True)
    return out


# --- Research-map overview (the lost-student orientation projection) ----------
# A lighter cousin of read_graph: topics + their biggest concepts, with NO edge
# load and no link collapse — the overview never needs links, and skipping them
# keeps orientation cheap on a large library.


class OverviewConcept(BaseModel):
    concept_id: uuid.UUID
    name: str
    papers: int  # distinct documents mentioning it — drives "biggest concept"


class OverviewTopic(BaseModel):
    cluster_id: uuid.UUID
    label: str | None
    size: int  # concepts in this topic
    top_concepts: list[OverviewConcept]


class OverviewOut(BaseModel):
    total_concepts: int
    total_topics: int
    topics: list[OverviewTopic]


async def read_overview(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    *,
    max_topics: int = 12,
    top_concepts_per_topic: int = 5,
) -> OverviewOut:
    """Topics (leaf clusters) and their biggest concepts — the orientation map.

    Topics are ranked by concept count and capped at ``max_topics``; within each,
    concepts are ranked by distinct-paper count and capped at
    ``top_concepts_per_topic``. Unclustered concepts count toward the total but
    form no topic. No edges are loaded (unlike :func:`read_graph`)."""
    mentions = (
        select(
            ConceptMention.concept_id.label("cid"),
            func.count(func.distinct(ConceptMention.document_id)).label("n"),
        )
        .group_by(ConceptMention.concept_id)
        .subquery()
    )
    rows = (
        await session.execute(
            select(
                Concept.id,
                Concept.name,
                Concept.cluster_id,
                func.coalesce(mentions.c.n, 0),
            )
            .outerjoin(mentions, mentions.c.cid == Concept.id)
            .where(Concept.workspace_id == workspace_id)
        )
    ).all()
    labels = dict(
        (
            await session.execute(
                select(Cluster.id, Cluster.label).where(
                    Cluster.workspace_id == workspace_id
                )
            )
        ).all()
    )

    by_cluster: dict[uuid.UUID, list[OverviewConcept]] = {}
    for cid, name, cluster_id, n in rows:
        if cluster_id is None:
            continue
        by_cluster.setdefault(cluster_id, []).append(
            OverviewConcept(concept_id=cid, name=name, papers=n)
        )

    topics: list[OverviewTopic] = []
    for cluster_id, concepts in by_cluster.items():
        concepts.sort(key=lambda c: c.papers, reverse=True)
        topics.append(
            OverviewTopic(
                cluster_id=cluster_id,
                label=labels.get(cluster_id),
                size=len(concepts),
                top_concepts=concepts[:top_concepts_per_topic],
            )
        )
    topics.sort(key=lambda t: t.size, reverse=True)
    return OverviewOut(
        total_concepts=len(rows),
        total_topics=len(topics),
        topics=topics[:max_topics],
    )
