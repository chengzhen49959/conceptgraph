"""Topic clustering (F9) — Leiden community detection over the concept graph.

Runs on the actual edges (relations), so clusters are densely-connected concept
communities — the semantically right grouping for graph colouring. Concepts with
NO relation edge would otherwise fall out as singleton clusters; we rescue them
by linking each to its nearest embedding neighbour (spec's kNN substrate), so an
orphan joins a real topic instead of cluttering the legend. Cheap at hundreds of
nodes, so the worker recomputes the whole workspace after each ingest, keeping
clusters fresh as documents arrive.
"""

import asyncio
import uuid

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.ai import label_cluster
from app.models import Cluster, Concept, Edge


def _partition(n: int, edges: list[tuple[int, int]], weights: list[int]) -> list[list[int]]:
    """Leiden partition over a weighted graph. Pure CPU — run in a thread.

    Returns groups of vertex indices. Isolated vertices come back as singleton
    communities. Falls back to networkx Louvain if igraph/leidenalg are
    unavailable (same return shape), per the plan's cut-line.
    """
    try:
        import igraph as ig
        import leidenalg

        graph = ig.Graph(n=n)
        if edges:
            graph.add_edges(edges)
        partition = leidenalg.find_partition(
            graph,
            leidenalg.ModularityVertexPartition,
            weights=weights or None,
            seed=42,
        )
        return [list(community) for community in partition]
    except ImportError:  # pragma: no cover — emergency fallback
        import networkx as nx

        graph = nx.Graph()
        graph.add_nodes_from(range(n))
        for (u, v), w in zip(edges, weights):
            graph.add_edge(u, v, weight=w)
        communities = nx.community.louvain_communities(graph, weight="weight", seed=42)
        return [list(c) for c in communities]


# An orphan concept (no relation edge) attaches to at most this many nearest
# embedding neighbours, and only if similar enough — below the floor it stays a
# genuine singleton rather than being forced into an unrelated topic.
_ISOLATED_KNN_K = 3
_ISOLATED_KNN_MIN_SIM = 0.25


def _isolated_knn_edges(
    vectors: list[list[float] | None],
    isolated: set[int],
    k: int = _ISOLATED_KNN_K,
    min_sim: float = _ISOLATED_KNN_MIN_SIM,
) -> list[tuple[int, int]]:
    """Link each isolated vertex to its nearest embedding neighbours.

    `vectors[i]` is concept i's embedding (or None for a manual node, which has
    none). Only vertices in `isolated` (zero relation edges) get new links, so a
    well-connected community is never reshaped — this can only rescue singletons,
    not blob existing clusters. Cosine similarity below `min_sim` is skipped, so a
    truly unrelated orphan stays on its own. Returns undirected (i, j) index pairs.
    """
    import numpy as np

    present = [i for i, v in enumerate(vectors) if v is not None]
    if len(present) < 2:
        return []
    mat = np.asarray([vectors[i] for i in present], dtype=np.float32)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    unit = mat / norms
    sims = unit @ unit.T
    np.fill_diagonal(sims, -1.0)

    edges: list[tuple[int, int]] = []
    for row, src in enumerate(present):
        if src not in isolated:
            continue
        for col in np.argsort(sims[row])[::-1][:k]:
            if sims[row][int(col)] < min_sim:
                break  # sorted desc — nothing further qualifies
            edges.append((src, present[int(col)]))
    return edges


# A community smaller than this isn't worth splitting into sub-topics.
_MIN_SPLIT = 8


def _subpartition(
    members: list[int],
    edges: list[tuple[int, int]],
    weights: list[int],
) -> list[list[int]]:
    """Leiden over the subgraph induced by `members`, returned in GLOBAL indices."""
    member_set = set(members)
    local = {g: i for i, g in enumerate(members)}
    sub_edges: list[tuple[int, int]] = []
    sub_weights: list[int] = []
    for (u, v), w in zip(edges, weights):
        if u in member_set and v in member_set:
            sub_edges.append((local[u], local[v]))
            sub_weights.append(w)
    parts = _partition(len(members), sub_edges, sub_weights)
    return [[members[i] for i in part] for part in parts]


def _two_level(
    n: int,
    edges: list[tuple[int, int]],
    weights: list[int],
    min_split: int = _MIN_SPLIT,
) -> list[tuple[list[int] | None, list[list[int]]]]:
    """Two-level Leiden hierarchy.

    Top-level communities that are big enough are split once more into leaves.
    Returns (parent_members, leaves) per top community: `parent_members` is None
    when the community is small or doesn't split further (it's then a single leaf
    with no parent); otherwise the leaves share that parent. All indices are
    global (0..n-1). Concepts attach to LEAVES, so every entry yields one or more
    leaf clusters and at most one parent.
    """
    out: list[tuple[list[int] | None, list[list[int]]]] = []
    for community in _partition(n, edges, weights):
        if len(community) < min_split:
            out.append((None, [community]))
            continue
        leaves = _subpartition(community, edges, weights)
        out.append((None, [community]) if len(leaves) <= 1 else (community, leaves))
    return out


async def recompute_clusters(
    sessionmaker: async_sessionmaker, workspace_id: uuid.UUID
) -> int:
    """Recompute and persist the topic-cluster hierarchy for the whole workspace.

    Builds a two-level Leiden hierarchy over the concept graph: concepts attach to
    LEAF clusters, which group under PARENT clusters via `clusters.parent_id`.
    Takes the session *factory* so the read, the per-cluster LLM labelling, and the
    write each run in their own phase — no DB connection is held across a
    `label_cluster` network call (which would let Aurora drop it mid-job).
    Returns the number of LEAF clusters. No-op (0) for an empty workspace.
    """
    # Read phase (short session).
    async with sessionmaker() as session:
        concepts = (
            await session.execute(
                select(Concept.id, Concept.name, Concept.embedding).where(
                    Concept.workspace_id == workspace_id
                )
            )
        ).all()
        if not concepts:
            return 0
        edge_rows = (
            await session.execute(
                select(
                    Edge.source_concept_id, Edge.target_concept_id, Edge.weight
                ).where(Edge.workspace_id == workspace_id)
            )
        ).all()

    ids = [c.id for c in concepts]
    names = {c.id: c.name for c in concepts}
    index = {cid: i for i, cid in enumerate(ids)}

    ig_edges: list[tuple[int, int]] = []
    weights: list[int] = []
    connected: set[int] = set()
    for e in edge_rows:
        if e.source_concept_id in index and e.target_concept_id in index:
            u, v = index[e.source_concept_id], index[e.target_concept_id]
            ig_edges.append((u, v))
            weights.append(e.weight)
            connected.update((u, v))

    # Rescue orphan concepts (no relation edge) so they join a topic by semantic
    # similarity instead of each becoming its own singleton cluster.
    isolated = set(range(len(ids))) - connected
    if isolated:
        vectors = [c.embedding for c in concepts]
        for u, v in _isolated_knn_edges(vectors, isolated):
            ig_edges.append((u, v))
            weights.append(1)

    structure = await asyncio.to_thread(_two_level, len(ids), ig_edges, weights)

    def _member_names(members: list[int]) -> list[str]:
        return [names[ids[i]] for i in members]

    # Label phase — every cluster (parents + leaves) labelled concurrently, NO
    # session held. Each iterator is consumed in the same order the write loop
    # below visits parents / leaves, so labels line up without index bookkeeping.
    parent_labels = iter(
        await asyncio.gather(
            *(
                label_cluster(_member_names(parent_members))
                for parent_members, _ in structure
                if parent_members is not None
            )
        )
    )
    leaf_labels = iter(
        await asyncio.gather(
            *(
                label_cluster(_member_names(leaf))
                for _, leaves in structure
                for leaf in leaves
            )
        )
    )

    # Write phase (short session). Rebuild every cluster; concept.cluster_id (FK
    # ON DELETE SET NULL) clears as the old rows go, then reattaches to leaves.
    leaf_count = 0
    async with sessionmaker() as session:
        await session.execute(
            delete(Cluster).where(Cluster.workspace_id == workspace_id)
        )
        for parent_members, leaves in structure:
            parent_id = None
            if parent_members is not None:
                parent = Cluster(workspace_id=workspace_id, label=next(parent_labels))
                session.add(parent)
                await session.flush()  # populate parent.id
                parent_id = parent.id
            for leaf in leaves:
                leaf_cluster = Cluster(
                    workspace_id=workspace_id,
                    label=next(leaf_labels),
                    parent_id=parent_id,
                )
                session.add(leaf_cluster)
                await session.flush()  # populate leaf_cluster.id
                await session.execute(
                    update(Concept)
                    .where(Concept.id.in_([ids[i] for i in leaf]))
                    .values(cluster_id=leaf_cluster.id)
                )
                leaf_count += 1
        await session.commit()
    return leaf_count
