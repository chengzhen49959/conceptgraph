"""Topic clustering (F9) — Leiden community detection over the concept graph.

Runs on the actual edges (not embeddings), so clusters are densely-connected
concept communities — the semantically right grouping for graph colouring. Cheap
at hundreds of nodes, so the worker recomputes the whole workspace after each
ingest, keeping clusters fresh as documents arrive.
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


async def recompute_clusters(
    sessionmaker: async_sessionmaker, workspace_id: uuid.UUID
) -> int:
    """Recompute and persist topic clusters for the whole workspace.

    Takes the session *factory*: the read, the per-cluster LLM labelling, and the
    write each happen in their own phase so no DB connection is held across the
    `label_cluster` network calls (which would let Aurora drop it mid-job).
    Returns the number of clusters. No-op (0) for an empty workspace.
    """
    # Read phase (short session).
    async with sessionmaker() as session:
        concepts = (
            await session.execute(
                select(Concept.id, Concept.name).where(
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
    for e in edge_rows:
        if e.source_concept_id in index and e.target_concept_id in index:
            ig_edges.append((index[e.source_concept_id], index[e.target_concept_id]))
            weights.append(e.weight)

    communities = await asyncio.to_thread(_partition, len(ids), ig_edges, weights)

    # Label phase — all LLM calls concurrently, NO session held.
    labels = await asyncio.gather(
        *(label_cluster([names[ids[i]] for i in community]) for community in communities)
    )

    # Write phase (short session). Replace old clusters; the FK is ON DELETE SET
    # NULL, so concept.cluster_id clears automatically before reassignment.
    async with sessionmaker() as session:
        await session.execute(
            delete(Cluster).where(Cluster.workspace_id == workspace_id)
        )
        for community, label in zip(communities, labels):
            member_ids = [ids[i] for i in community]
            cluster = Cluster(workspace_id=workspace_id, label=label)
            session.add(cluster)
            await session.flush()  # populate cluster.id
            await session.execute(
                update(Concept)
                .where(Concept.id.in_(member_ids))
                .values(cluster_id=cluster.id)
            )
        await session.commit()
    return len(communities)
