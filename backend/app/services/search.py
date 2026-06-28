"""Semantic retrieval over a workspace's concepts and passages.

Shared by the HTTP search/ask routers and the MCP memory tools. One query
embedding is matched (pgvector cosine, HNSW) against the workspace's ``concepts``
(named nodes) and ``chunks`` (source passages). Manual concepts have no embedding
and are invisible to search by construction.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.answer import AnswerPassage
from app.ai.embeddings import embed_text
from app.models import Chunk, Concept, ConceptMention, Document

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


async def retrieve_for_answer(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    question: str,
    top_k: int = ANSWER_TOP_K,
) -> RetrievedContext:
    """Retrieve the top-k passages for ``question`` plus the concept provenance.
    An empty question retrieves nothing (the caller answers "no context"). Raises
    :class:`EmbeddingUnavailable` on embed failure."""
    ctx = RetrievedContext()
    question = question.strip()
    if not question:
        return ctx
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
    concepts_by_chunk = await _concept_ids_by_chunk(session, [r[0] for r in chunk_rows])

    mentioned = {cid for ids in concepts_by_chunk.values() for cid in ids}
    if mentioned:
        for cid, name in (
            await session.execute(
                select(Concept.id, Concept.name).where(Concept.id.in_(mentioned))
            )
        ).all():
            ctx.concept_id_to_name[cid] = name

    for i, r in enumerate(chunk_rows, start=1):
        chunk_id, document_id, title, content = r
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
