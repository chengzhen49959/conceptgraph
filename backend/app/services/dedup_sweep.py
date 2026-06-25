"""Global entity-resolution sweep — the repair pass for incremental merge.

``services/concepts.resolve_concept`` merges greedily and order-dependently: it
only ever compares an incoming concept against what already exists, and its
embedding block (cosine sim ≥ ``block_distance``) can miss a synonym whose vector
sits just past the floor. Those misses are never revisited, so near-duplicate
nodes accumulate as a workspace grows.

This sweep re-blocks every concept against every other (exact cosine, not the HNSW
approximation — a repair pass should be more thorough than the live blocker),
re-runs the SAME LLM judge (``ai.match_concept``) on the candidates, and MERGES the
confirmed duplicates. Merging is the "fold two existing nodes into one" operation
the incremental path never performs — it resolves *before* insert, so it never has
two nodes to reconcile. A merge re-points the loser's mentions, edges, and aliases
onto the survivor, folds the descriptions, then deletes the loser.

Idempotent: a second run finds no new duplicates and is a no-op. Runs under the
same per-workspace merge lock as ingestion so it can't interleave with a
document's merge phase. ``dry_run`` (default) judges but writes nothing, so the
LLM's precision can be spot-checked before any destructive merge.
"""

import uuid
from dataclasses import dataclass, field

from sqlalchemy import delete, func, literal, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.ai import embed_text, match_concept, merge_descriptions
from app.config import get_settings
from app.models import Concept, ConceptAlias, ConceptMention, Edge
from app.services.clustering import recompute_clusters
from app.services.concepts import add_alias, upsert_edge


@dataclass
class _Node:
    id: uuid.UUID
    name: str
    description: str | None
    embedding: list[float]
    mentions: int


@dataclass
class SweepResult:
    """Outcome of one sweep. `merges` lists (survivor, loser, reason); in dry-run
    they are the merges that WOULD happen."""

    workspace_id: uuid.UUID
    dry_run: bool
    concepts: int
    candidate_pairs: int
    merges: list[tuple[str, str, str]] = field(default_factory=list)


async def _load_nodes(
    sessionmaker: async_sessionmaker, workspace_id: uuid.UUID
) -> list[_Node]:
    """Load every embedded concept in the workspace with its mention count.

    Manual nodes carry no embedding and are never extraction duplicates, so they
    are excluded — they can be neither candidate nor survivor here.
    """
    async with sessionmaker() as session:
        rows = (
            await session.execute(
                select(
                    Concept.id,
                    Concept.name,
                    Concept.description,
                    Concept.embedding,
                    func.count(ConceptMention.concept_id).label("mentions"),
                )
                .outerjoin(ConceptMention, ConceptMention.concept_id == Concept.id)
                .where(
                    Concept.workspace_id == workspace_id,
                    Concept.embedding.isnot(None),
                )
                .group_by(Concept.id)
            )
        ).all()
    return [_Node(r.id, r.name, r.description, r.embedding, r.mentions) for r in rows]


def _candidate_pairs(nodes: list[_Node], sim_floor: float) -> list[tuple[int, int]]:
    """All concept index pairs (i < j) with cosine similarity ≥ sim_floor.

    Exact all-pairs cosine in numpy — at hundreds–thousands of concepts this is a
    few MB and one matmul, and it catches near-duplicates the live HNSW block can
    miss. Ordered by descending similarity so the most obvious duplicates are
    judged (and merged) first, which makes the union-find roots stable.
    """
    import numpy as np

    mat = np.asarray([n.embedding for n in nodes], dtype=np.float32)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    unit = mat / norms
    sims = unit @ unit.T
    iu, ju = np.triu_indices(len(nodes), k=1)  # i < j, no diagonal
    mask = sims[iu, ju] >= sim_floor
    pairs = [(int(i), int(j), float(s)) for i, j, s in zip(iu[mask], ju[mask], sims[iu, ju][mask])]
    pairs.sort(key=lambda p: -p[2])
    return [(i, j) for i, j, _ in pairs]


async def _already_linked(
    sessionmaker: async_sessionmaker, a: uuid.UUID, b: uuid.UUID
) -> bool:
    """True if `a`'s name is already an alias of `b` or vice versa — a merge the
    judge confirmed before, so don't re-judge it."""
    async with sessionmaker() as session:
        names = (
            await session.execute(
                select(Concept.id, Concept.name).where(Concept.id.in_([a, b]))
            )
        ).all()
        name_by_id = {r.id: r.name for r in names}
        hit = (
            await session.execute(
                select(ConceptAlias.concept_id, ConceptAlias.alias).where(
                    ConceptAlias.concept_id.in_([a, b])
                )
            )
        ).all()
    for cid, alias in hit:
        other = b if cid == a else a
        if alias.strip().lower() == name_by_id.get(other, "").strip().lower():
            return True
    return False


async def _merge_pair(
    sessionmaker: async_sessionmaker,
    workspace_id: uuid.UUID,
    survivor: _Node,
    loser: _Node,
) -> None:
    """Fold `loser` into `survivor`: re-point provenance + edges + aliases, fold the
    description, then delete the loser (cascades its now-copied rows).

    Edges are re-pointed by kind: a directed 'relation' keeps its direction
    (survivor takes the loser's endpoint in place); an undirected 'cooccur' is
    re-canonicalised to (min,max) id. Both reuse ``upsert_edge`` so a collision with
    a survivor edge sums weights instead of violating the unique key. Edges that
    would become self-loops (the other endpoint IS the survivor) are dropped.
    """
    # Fold descriptions + re-embed OUTSIDE any session (LLM + embedding network
    # calls), mirroring resolve_concept's discipline.
    merged_desc = survivor.description
    if loser.description and survivor.description and loser.description != survivor.description:
        merged_desc = await merge_descriptions(
            survivor.name, survivor.description, loser.description
        )
    elif loser.description and not survivor.description:
        merged_desc = loser.description
    new_vec = (
        await embed_text(f"{survivor.name}: {merged_desc}")
        if merged_desc and merged_desc != survivor.description
        else None
    )

    # Read the loser's edges, then re-point them, then move provenance/aliases and
    # delete the loser — all in one short session (pure DB, no network call held).
    async with sessionmaker() as session:
        loser_edges = (
            await session.execute(
                select(
                    Edge.source_concept_id,
                    Edge.target_concept_id,
                    Edge.relation,
                    Edge.kind,
                    Edge.weight,
                ).where(
                    (Edge.source_concept_id == loser.id)
                    | (Edge.target_concept_id == loser.id)
                )
            )
        ).all()
        for e in loser_edges:
            other = e.target_concept_id if e.source_concept_id == loser.id else e.source_concept_id
            if other == survivor.id:
                continue  # would be a self-loop on the survivor
            if e.kind == "cooccur":
                s, t = sorted((survivor.id, other))
            else:
                s = survivor.id if e.source_concept_id == loser.id else e.source_concept_id
                t = survivor.id if e.target_concept_id == loser.id else e.target_concept_id
            await upsert_edge(session, workspace_id, s, t, e.relation, kind=e.kind, weight=e.weight)

        # Move provenance: copy the loser's mentions onto the survivor (ON CONFLICT
        # skips chunks the survivor already cites); the loser's own rows vanish with
        # it via ON DELETE CASCADE.
        await session.execute(
            pg_insert(ConceptMention)
            .from_select(
                ["concept_id", "chunk_id", "document_id"],
                select(
                    literal(survivor.id),
                    ConceptMention.chunk_id,
                    ConceptMention.document_id,
                ).where(ConceptMention.concept_id == loser.id),
            )
            .on_conflict_do_nothing()
        )
        # Move aliases, and record the loser's own name as a survivor alias so the
        # folded surface form resolves for free next time (the alias fast-path).
        loser_aliases = (
            await session.execute(
                select(ConceptAlias.alias).where(ConceptAlias.concept_id == loser.id)
            )
        ).scalars().all()
        for alias in [*loser_aliases, loser.name]:
            await add_alias(session, survivor.id, alias)

        if new_vec is not None:
            await session.execute(
                update(Concept)
                .where(Concept.id == survivor.id)
                .values(description=merged_desc, embedding=new_vec)
            )
        # Delete the loser — cascades its remaining mentions, aliases, and any edges
        # still pointing at it (we already re-pointed their weight onto the survivor).
        await session.execute(delete(Concept).where(Concept.id == loser.id))
        await session.commit()


async def sweep_workspace(
    sessionmaker: async_sessionmaker,
    workspace_id: uuid.UUID,
    *,
    dry_run: bool = True,
) -> SweepResult:
    """Find and (unless dry_run) merge near-duplicate concepts across the workspace.

    Candidate pairs come from exact cosine ≥ (1 − block_distance); each is confirmed
    by ``match_concept`` (the same judge the live merge uses). Confirmed pairs are
    unioned (transitively, via a merged-into map) so A≡B and B≡C collapse A,B,C into
    one node. Re-runs are no-ops. After real merges the cluster hierarchy is
    recomputed (node ids changed). The caller holds the per-workspace merge lock.
    """
    settings = get_settings()
    nodes = await _load_nodes(sessionmaker, workspace_id)
    by_id = {n.id: n for n in nodes}
    index_pairs = _candidate_pairs(nodes, sim_floor=1.0 - settings.block_distance)

    result = SweepResult(
        workspace_id=workspace_id,
        dry_run=dry_run,
        concepts=len(nodes),
        candidate_pairs=len(index_pairs),
    )

    # Union-find over ids: each loser points at the survivor it folded into, so a
    # later pair naming a folded node resolves to its survivor instead of a ghost.
    merged_into: dict[uuid.UUID, uuid.UUID] = {}

    def root(cid: uuid.UUID) -> uuid.UUID:
        while cid in merged_into:
            cid = merged_into[cid]
        return cid

    for i, j in index_pairs:
        a, b = root(nodes[i].id), root(nodes[j].id)
        if a == b:
            continue  # already the same node after an earlier merge
        na, nb = by_id[a], by_id[b]
        if await _already_linked(sessionmaker, a, b):
            continue
        # Pairwise judge: reuse match_concept with a single candidate (index 0).
        verdict = await match_concept(
            na.name, na.description, [{"name": nb.name, "description": nb.description}]
        )
        if verdict.match_index != 0:
            continue
        # Survivor = more mentions, ties broken by smaller id for determinism.
        survivor, loser = (
            (na, nb) if (na.mentions, nb.id) >= (nb.mentions, na.id) else (nb, na)
        )
        result.merges.append((survivor.name, loser.name, verdict.reason))
        if not dry_run:
            await _merge_pair(sessionmaker, workspace_id, survivor, loser)
            merged_into[loser.id] = survivor.id

    if result.merges and not dry_run:
        await recompute_clusters(sessionmaker, workspace_id)
    return result
