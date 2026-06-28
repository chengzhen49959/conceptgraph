"""Semantic retrieval over a workspace's concepts and passages.

Shared by the HTTP search/ask routers and the MCP memory tools. One query
embedding is matched (pgvector cosine, HNSW) against the workspace's ``concepts``
(named nodes) and ``chunks`` (source passages). Manual concepts have no embedding
and are invisible to search by construction.
"""

from __future__ import annotations

import uuid
from collections.abc import Hashable, Sequence
from dataclasses import dataclass, field

import numpy as np
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.answer import AnswerPassage
from app.ai.embeddings import embed_text
from app.config import get_settings
from app.models import Chunk, Concept, ConceptAlias, ConceptMention, Document, Edge

# Snippet length for a passage hit — enough to recognise the match, not the whole
# chunk. The search palette uses 200; the ask `context` event uses 220.
_SNIPPET_CHARS = 200
_ASK_SNIPPET_CHARS = 220
DEFAULT_LIMIT = 10
MAX_LIMIT = 50
ANSWER_TOP_K = 8


class EmbeddingUnavailable(RuntimeError):
    """Query embedding could not be produced (OpenAI unset/unreachable). Callers
    map this to a 503 (HTTP) or a tool error (MCP)."""


class SearchConcept(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_id: uuid.UUID | None
    mentions: int  # provenance count — same field the graph nodes carry
    score: float  # cosine similarity (1 − distance), 0..1


class SearchPassage(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    snippet: str  # leading slice of the chunk text
    score: float
    # Concepts this passage mentions, so a click can route to a graph node.
    concept_ids: list[uuid.UUID]


class SearchOut(BaseModel):
    concepts: list[SearchConcept]
    passages: list[SearchPassage]


async def _embed(text: str) -> list[float]:
    try:
        return await embed_text(text)
    except Exception as exc:  # noqa: BLE001 — any embed failure is "retrieval down"
        raise EmbeddingUnavailable("embedding failed") from exc


async def _concept_ids_by_chunk(
    session: AsyncSession, chunk_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[uuid.UUID]]:
    """Concept ids mentioned in each chunk, in one round-trip."""
    by_chunk: dict[uuid.UUID, list[uuid.UUID]] = {cid: [] for cid in chunk_ids}
    if chunk_ids:
        for chunk_id, concept_id in (
            await session.execute(
                select(ConceptMention.chunk_id, ConceptMention.concept_id).where(
                    ConceptMention.chunk_id.in_(chunk_ids)
                )
            )
        ).all():
            by_chunk[chunk_id].append(concept_id)
    return by_chunk


async def semantic_search(
    session: AsyncSession, workspace_id: uuid.UUID, query: str, limit: int
) -> SearchOut:
    """Embed ``query`` and return the nearest concepts + source passages in the
    workspace. Raises :class:`EmbeddingUnavailable` if embedding fails."""
    query = query.strip()
    if not query:
        return SearchOut(concepts=[], passages=[])
    qvec = await _embed(query)

    # --- Concepts: cosine ANN over named nodes (manual nodes have no embedding) ---
    mentions = (
        select(ConceptMention.concept_id.label("cid"), func.count().label("n"))
        .group_by(ConceptMention.concept_id)
        .subquery()
    )
    cdist = Concept.embedding.cosine_distance(qvec)
    concept_rows = (
        await session.execute(
            select(
                Concept.id,
                Concept.name,
                Concept.description,
                Concept.cluster_id,
                func.coalesce(mentions.c.n, 0),
                cdist.label("dist"),
            )
            .outerjoin(mentions, mentions.c.cid == Concept.id)
            .where(Concept.workspace_id == workspace_id, Concept.embedding.isnot(None))
            .order_by(cdist)
            .limit(limit)
        )
    ).all()

    # --- Passages: cosine ANN over chunks (scoped via their document) ---
    pdist = Chunk.embedding.cosine_distance(qvec)
    chunk_rows = (
        await session.execute(
            select(Chunk.id, Document.id, Document.title, Chunk.content, pdist.label("dist"))
            .join(Document, Document.id == Chunk.document_id)
            .where(Document.workspace_id == workspace_id, Chunk.embedding.isnot(None))
            .order_by(pdist)
            .limit(limit)
        )
    ).all()

    by_chunk = await _concept_ids_by_chunk(session, [r[0] for r in chunk_rows])

    return SearchOut(
        concepts=[
            SearchConcept(
                id=r[0],
                name=r[1],
                description=r[2],
                cluster_id=r[3],
                mentions=r[4],
                score=round(1.0 - r[5], 4),
            )
            for r in concept_rows
        ],
        passages=[
            SearchPassage(
                chunk_id=r[0],
                document_id=r[1],
                document_title=r[2],
                snippet=r[3][:_SNIPPET_CHARS].strip(),
                score=round(1.0 - r[4], 4),
                concept_ids=by_chunk.get(r[0], []),
            )
            for r in chunk_rows
        ],
    )


@dataclass
class RetrievedContext:
    """Everything an answer needs: the passages fed to the model, the display
    sources, the concept id→name map, and the citation-index → concept-ids map
    used to turn ``[n]`` citations back into graph-highlight concept ids."""

    passages: list[AnswerPassage] = field(default_factory=list)
    ctx_passages: list[dict] = field(default_factory=list)
    concept_id_to_name: dict[uuid.UUID, str] = field(default_factory=dict)
    concepts_by_n: dict[int, list[uuid.UUID]] = field(default_factory=dict)


async def _build_retrieved_context(
    session: AsyncSession,
    ordered: list[tuple[uuid.UUID, uuid.UUID, str, str]],
) -> RetrievedContext:
    """Assemble a :class:`RetrievedContext` from passages already in final order.

    ``ordered`` is ``(chunk_id, document_id, document_title, content)`` tuples; the
    citation index ``n`` is the 1-based position, so callers control ranking by the
    order they pass. Shared by every retrieval path (pure-vector, hybrid,
    concept-first) so the ``[n]`` ↔ concept-id contract is built in exactly one place.
    """
    ctx = RetrievedContext()
    concepts_by_chunk = await _concept_ids_by_chunk(session, [c[0] for c in ordered])

    mentioned = {cid for ids in concepts_by_chunk.values() for cid in ids}
    if mentioned:
        for cid, name in (
            await session.execute(
                select(Concept.id, Concept.name).where(Concept.id.in_(mentioned))
            )
        ).all():
            ctx.concept_id_to_name[cid] = name

    for i, (chunk_id, document_id, title, content) in enumerate(ordered, start=1):
        cids = concepts_by_chunk[chunk_id]
        ctx.concepts_by_n[i] = cids
        ctx.passages.append(AnswerPassage(n=i, content=content, document_title=title))
        ctx.ctx_passages.append(
            {
                "n": i,
                "chunk_id": str(chunk_id),
                "document_id": str(document_id),
                "document_title": title,
                "snippet": content[:_ASK_SNIPPET_CHARS].strip(),
                "concept_ids": [str(c) for c in cids],
            }
        )
    return ctx


async def retrieve_for_answer(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    question: str,
    top_k: int = ANSWER_TOP_K,
) -> RetrievedContext:
    """Retrieve the top-k passages for ``question`` plus the concept provenance.
    An empty question retrieves nothing (the caller answers "no context"). Raises
    :class:`EmbeddingUnavailable` on embed failure.

    Pure-vector ANN — the original single-shot ``/api/ask`` path, unchanged. The
    conversational agent uses :func:`hybrid_passages` (lexical+vector+MMR) instead."""
    question = question.strip()
    if not question:
        return RetrievedContext()
    qvec = await _embed(question)

    pdist = Chunk.embedding.cosine_distance(qvec)
    chunk_rows = (
        await session.execute(
            select(Chunk.id, Document.id, Document.title, Chunk.content)
            .join(Document, Document.id == Chunk.document_id)
            .where(Document.workspace_id == workspace_id, Chunk.embedding.isnot(None))
            .order_by(pdist)
            .limit(top_k)
        )
    ).all()
    return await _build_retrieved_context(
        session, [(r[0], r[1], r[2], r[3]) for r in chunk_rows]
    )


# --- Hybrid retrieval: lexical + vector, RRF-fused, MMR-diversified -----------
# Pure semantic ANN misses exact terms (acronyms, method names) and returns
# near-duplicate chunks from one paper. Hybrid retrieval fuses a lexical (Postgres
# full-text) ranking with the vector ranking via Reciprocal Rank Fusion, then MMR
# trims to a relevant-but-diverse final set spread across papers. rrf_fuse and
# mmr_select are PURE (no DB) so they're unit-tested directly.


def rrf_fuse(*ranked: Sequence[Hashable], k: int = 60) -> list[Hashable]:
    """Reciprocal Rank Fusion of several ranked id lists into one ranking.

    Each input is keys in rank order (rank 0 = best). An item's fused score is
    ``Σ 1/(k + rank + 1)`` over the lists it appears in, so an item ranked highly by
    several rankers beats one ranked highly by just one. ``k`` damps the weight of
    low ranks (the standard RRF constant, 60). Returns keys by fused score, best
    first; ties keep first-seen order."""
    scores: dict[Hashable, float] = {}
    order: dict[Hashable, int] = {}
    for lst in ranked:
        for rank, key in enumerate(lst):
            scores[key] = scores.get(key, 0.0) + 1.0 / (k + rank + 1)
            order.setdefault(key, len(order))
    return sorted(scores, key=lambda key: (-scores[key], order[key]))


def mmr_select(
    query_vec: Sequence[float],
    candidates: Sequence[tuple[Hashable, Sequence[float]]],
    k: int,
    lambda_: float,
) -> list[Hashable]:
    """Maximal Marginal Relevance: pick ``k`` keys balancing query relevance against
    novelty versus what's already picked.

    ``candidates`` is ``(key, vector)`` pairs. Each step adds the key maximising
    ``λ·sim(query) − (1−λ)·max sim(already-picked)``; ``λ=1`` is pure relevance,
    ``λ=0`` pure diversity. Vectors are L2-normalised once so similarity is a dot
    product. Returns up to ``k`` keys in selection order (most valuable first)."""
    if not candidates or k <= 0:
        return []
    keys = [key for key, _ in candidates]
    mat = np.asarray([vec for _, vec in candidates], dtype=np.float32)
    q = np.asarray(query_vec, dtype=np.float32)
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    mat = mat / np.where(norms == 0, 1.0, norms)
    qn = np.linalg.norm(q)
    q = q / (qn if qn else 1.0)
    rel = mat @ q  # cosine similarity to the query, per candidate

    selected: list[int] = []
    remaining = list(range(len(keys)))  # a list (not set) so max() breaks ties stably
    while remaining and len(selected) < k:
        if not selected:
            best = max(remaining, key=lambda i: rel[i])
        else:
            picked = mat[selected]  # (s, dim)
            best = max(
                remaining,
                key=lambda i: lambda_ * rel[i]
                - (1.0 - lambda_) * float(np.max(picked @ mat[i])),
            )
        selected.append(best)
        remaining.remove(best)
    return [keys[i] for i in selected]


async def _lexical_chunks(
    session: AsyncSession, workspace_id: uuid.UUID, query: str, limit: int
) -> list[uuid.UUID]:
    """Chunk ids best matching ``query`` by Postgres full-text rank (ts_rank_cd).

    Uses ``websearch_to_tsquery`` (forgiving user-syntax: bare words, quotes, OR),
    which yields an empty query — and thus no rows — for blank/garbage input, so the
    caller needs no special-casing."""
    tsq = func.websearch_to_tsquery("english", query)
    rows = (
        await session.execute(
            select(Chunk.id)
            .join(Document, Document.id == Chunk.document_id)
            .where(
                Document.workspace_id == workspace_id,
                Chunk.content_tsv.op("@@")(tsq),
            )
            .order_by(func.ts_rank_cd(Chunk.content_tsv, tsq).desc())
            .limit(limit)
        )
    ).scalars().all()
    return list(rows)


async def hybrid_passages(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    question: str,
    *,
    final_k: int = ANSWER_TOP_K,
) -> RetrievedContext:
    """Hybrid lexical+vector retrieval with MMR diversification.

    Over-fetches ``retrieval_candidate_k`` from a vector ANN and a full-text search,
    fuses them with :func:`rrf_fuse`, then MMR-selects ``final_k`` passages that are
    both relevant and spread across papers. Returns the same
    :class:`RetrievedContext` shape as :func:`retrieve_for_answer`, so it is a
    drop-in for the agent's passage tool. Raises :class:`EmbeddingUnavailable` on
    embed failure."""
    question = question.strip()
    if not question:
        return RetrievedContext()
    settings = get_settings()
    cand_k = max(settings.retrieval_candidate_k, final_k)
    qvec = await _embed(question)

    pdist = Chunk.embedding.cosine_distance(qvec)
    vec_ids = (
        await session.execute(
            select(Chunk.id)
            .join(Document, Document.id == Chunk.document_id)
            .where(Document.workspace_id == workspace_id, Chunk.embedding.isnot(None))
            .order_by(pdist)
            .limit(cand_k)
        )
    ).scalars().all()
    lex_ids = await _lexical_chunks(session, workspace_id, question, cand_k)

    fused = rrf_fuse(list(vec_ids), lex_ids)[:cand_k]
    if not fused:
        return RetrievedContext()

    # Hydrate the fused pool (content + embedding) and MMR-pick the final set.
    pool = {
        r[0]: (r[1], r[2], r[3], r[4])
        for r in (
            await session.execute(
                select(
                    Chunk.id, Document.id, Document.title, Chunk.content, Chunk.embedding
                )
                .join(Document, Document.id == Chunk.document_id)
                .where(Chunk.id.in_(fused))
            )
        ).all()
    }
    mmr_cands = [
        (cid, pool[cid][3]) for cid in fused if cid in pool and pool[cid][3] is not None
    ]
    chosen = mmr_select(qvec, mmr_cands, final_k, settings.mmr_lambda)
    # Backfill from fused order if MMR came up short (chunks lacking an embedding).
    if len(chosen) < final_k:
        chosen += [c for c in fused if c in pool and c not in set(chosen)][
            : final_k - len(chosen)
        ]

    ordered = [(cid, pool[cid][0], pool[cid][1], pool[cid][2]) for cid in chosen]
    return await _build_retrieved_context(session, ordered)


# --- Concept-first retrieval: find the idea, walk its graph neighbourhood ------
# The persona's core need: "find this concept across my whole pile of papers." A
# plain passage search is content-centric and ignores the graph. This is
# concept-centric: locate the best-matching concept node, refuse honestly if the
# library doesn't cover it, expand along the graph (same-topic siblings + typed-edge
# neighbours), then gather mention passages across ALL papers and MMR-trim them.


class ClosestConcept(BaseModel):
    concept_id: uuid.UUID
    name: str
    score: float  # cosine similarity (0..1) of the best match to the query


class CFConcept(BaseModel):
    """A focus concept the query matched (the answer is grounded in these)."""

    concept_id: uuid.UUID
    name: str
    description: str | None
    aliases: list[str]
    papers: int  # distinct documents mentioning it
    score: float  # cosine similarity to the query


class CFRelated(BaseModel):
    """A neighbouring concept to explore next (navigation hint, not grounding)."""

    concept_id: uuid.UUID
    name: str
    relation: str  # the edge verb (with direction), or "same topic" for siblings


class CFPassage(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    content: str
    concept_ids: list[uuid.UUID]  # ALL concepts in the chunk (the highlight contract)
    via: list[str]  # focus/related concept names that pulled this passage in


class ConceptFirstResult(BaseModel):
    hit: bool  # did the library cover the query above the honesty floor?
    closest: ClosestConcept | None  # best match (always set when any concept exists)
    seeds: list[CFConcept]  # the matched focus concepts
    related: list[CFRelated]  # graph neighbours to walk to next
    passages: list[CFPassage]  # cross-paper evidence, MMR-diversified


_CF_MAX_RELATED = 6  # graph neighbours surfaced for navigation + passage gather


async def concept_first_retrieve(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    query: str,
    *,
    max_concepts: int = 3,
    final_passages: int = 10,
) -> ConceptFirstResult:
    """Locate the concept(s) ``query`` names, then gather their cross-paper evidence
    plus graph neighbours to explore. Raises :class:`EmbeddingUnavailable` on embed
    failure.

    Honesty floor: if the best concept scores below ``retrieval_min_score``, returns
    ``hit=False`` with the ``closest`` match and no passages, so the agent can say
    "the library doesn't cover this; the nearest thing is X" instead of grounding an
    answer in noise."""
    empty = ConceptFirstResult(hit=False, closest=None, seeds=[], related=[], passages=[])
    query = query.strip()
    if not query:
        return empty
    settings = get_settings()
    qvec = await _embed(query)

    cdist = Concept.embedding.cosine_distance(qvec)
    concept_rows = (
        await session.execute(
            select(
                Concept.id,
                Concept.name,
                Concept.description,
                Concept.cluster_id,
                cdist.label("dist"),
            )
            .where(Concept.workspace_id == workspace_id, Concept.embedding.isnot(None))
            .order_by(cdist)
            .limit(max_concepts)
        )
    ).all()
    if not concept_rows:
        return empty  # empty (or fully-manual) library

    best = concept_rows[0]
    closest = ClosestConcept(
        concept_id=best.id, name=best.name, score=round(1.0 - best.dist, 4)
    )
    if (1.0 - best.dist) < settings.retrieval_min_score:
        return ConceptFirstResult(
            hit=False, closest=closest, seeds=[], related=[], passages=[]
        )

    seed_rows = [r for r in concept_rows if (1.0 - r.dist) >= settings.retrieval_min_score]
    seed_ids = [r.id for r in seed_rows]
    seed_set = set(seed_ids)

    # --- Expand along the graph: typed-edge neighbours, then same-topic siblings ---
    related: dict[uuid.UUID, tuple[str, int]] = {}  # id -> (relation label, rank weight)
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
                    Edge.source_concept_id.in_(seed_ids),
                    Edge.target_concept_id.in_(seed_ids),
                ),
            )
        )
    ).all()
    for sc, tc, rel, w in edge_rows:
        if sc in seed_set and tc not in seed_set:
            nid, label = tc, f"{rel} (→)"
        elif tc in seed_set and sc not in seed_set:
            nid, label = sc, f"{rel} (←)"
        else:
            continue
        cur = related.get(nid)
        if cur is None or w > cur[1]:
            related[nid] = (label, w)

    seed_clusters = {r.cluster_id for r in seed_rows if r.cluster_id is not None}
    if seed_clusters:
        for sib_id in (
            await session.execute(
                select(Concept.id).where(
                    Concept.workspace_id == workspace_id,
                    Concept.cluster_id.in_(seed_clusters),
                )
            )
        ).scalars().all():
            if sib_id not in seed_set:
                related.setdefault(sib_id, ("same topic", 0))

    # Keep the strongest-linked neighbours (edge weight; siblings sort last at 0).
    related_ids = [
        nid
        for nid, _ in sorted(related.items(), key=lambda kv: kv[1][1], reverse=True)
    ][:_CF_MAX_RELATED]

    # --- Gather candidate passages mentioning any focus/related concept ----------
    expanded = seed_ids + related_ids
    via_by_chunk: dict[uuid.UUID, set[uuid.UUID]] = {}
    for chunk_id, concept_id in (
        await session.execute(
            select(ConceptMention.chunk_id, ConceptMention.concept_id).where(
                ConceptMention.concept_id.in_(expanded)
            )
        )
    ).all():
        via_by_chunk.setdefault(chunk_id, set()).add(concept_id)

    # Cap the pool to the over-fetch width, preferring chunks that tie several of the
    # expanded concepts together (more central to the neighbourhood).
    pool_ids = sorted(
        via_by_chunk, key=lambda c: len(via_by_chunk[c]), reverse=True
    )[: settings.retrieval_candidate_k]

    # Names for focus + related concepts (used by passage `via` and the nav list).
    name_by_id = {r.id: r.name for r in seed_rows}
    if related_ids:
        for rid, rname in (
            await session.execute(
                select(Concept.id, Concept.name).where(Concept.id.in_(related_ids))
            )
        ).all():
            name_by_id[rid] = rname

    passages: list[CFPassage] = []
    if pool_ids:
        pool = {
            r[0]: (r[1], r[2], r[3], r[4])
            for r in (
                await session.execute(
                    select(
                        Chunk.id,
                        Document.id,
                        Document.title,
                        Chunk.content,
                        Chunk.embedding,
                    )
                    .join(Document, Document.id == Chunk.document_id)
                    .where(Chunk.id.in_(pool_ids))
                )
            ).all()
        }
        mmr_cands = [
            (cid, pool[cid][3])
            for cid in pool_ids
            if cid in pool and pool[cid][3] is not None
        ]
        chosen = mmr_select(qvec, mmr_cands, final_passages, settings.mmr_lambda)
        if len(chosen) < final_passages:
            chosen += [c for c in pool_ids if c in pool and c not in set(chosen)][
                : final_passages - len(chosen)
            ]

        concepts_by_chunk = await _concept_ids_by_chunk(session, chosen)
        for cid in chosen:
            did, title, content, _ = pool[cid]
            via = [name_by_id[v] for v in via_by_chunk.get(cid, set()) if v in name_by_id]
            passages.append(
                CFPassage(
                    chunk_id=cid,
                    document_id=did,
                    document_title=title,
                    content=content,
                    concept_ids=concepts_by_chunk.get(cid, []),
                    via=sorted(via),
                )
            )

    # --- Build the focus + navigation payloads -----------------------------------
    aliases_by_seed: dict[uuid.UUID, list[str]] = {sid: [] for sid in seed_ids}
    for cid, alias in (
        await session.execute(
            select(ConceptAlias.concept_id, ConceptAlias.alias).where(
                ConceptAlias.concept_id.in_(seed_ids)
            )
        )
    ).all():
        aliases_by_seed[cid].append(alias)

    papers_by_seed = dict(
        (
            await session.execute(
                select(
                    ConceptMention.concept_id,
                    func.count(func.distinct(ConceptMention.document_id)),
                )
                .where(ConceptMention.concept_id.in_(seed_ids))
                .group_by(ConceptMention.concept_id)
            )
        ).all()
    )

    seeds = [
        CFConcept(
            concept_id=r.id,
            name=r.name,
            description=r.description,
            aliases=sorted(aliases_by_seed.get(r.id, [])),
            papers=papers_by_seed.get(r.id, 0),
            score=round(1.0 - r.dist, 4),
        )
        for r in seed_rows
    ]
    related_out = [
        CFRelated(concept_id=nid, name=name_by_id[nid], relation=related[nid][0])
        for nid in related_ids
        if nid in name_by_id
    ]

    return ConceptFirstResult(
        hit=True, closest=closest, seeds=seeds, related=related_out, passages=passages
    )
