"""Semantic search (F7) — embed the query, return nearest concepts + passages.

The search palette already does instant substring matching over the loaded graph
client-side; this adds the part the client can't: vector recall. One query
embedding is matched (pgvector cosine, HNSW) against two corpora in the
workspace — `concepts` (named nodes, map straight onto the graph) and `chunks`
(source passages, the richer text the concept names compress). Concept hits feed
the graph's existing select-node path; passage hits carry the concept ids they
mention so the client can route a click to the most prominent of them.

Workspace-scoped exactly like the graph read API: no `workspace_id` → the
caller's personal workspace.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import embed_text
from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Chunk, Concept, ConceptMention, Document
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/search", tags=["search"])

# Snippet length for a passage hit — enough to recognise the match, not the whole
# chunk (chunks can be ~1k chars; the palette row is one line).
_SNIPPET_CHARS = 200
_DEFAULT_LIMIT = 10
_MAX_LIMIT = 50


class SearchConcept(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_id: uuid.UUID | None
    mentions: int  # provenance count — same field the graph nodes carry
    score: float  # cosine similarity (1 − distance), 0..1, for ranking/display


class SearchPassage(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    snippet: str  # leading slice of the chunk text
    score: float
    # Concepts this passage mentions. A passage isn't a graph node, so a click
    # routes to one of these; the client picks the most prominent by mention
    # count (data it already has). Empty if every concept here was gated out.
    concept_ids: list[uuid.UUID]


class SearchOut(BaseModel):
    concepts: list[SearchConcept]
    passages: list[SearchPassage]


@router.get("", response_model=SearchOut)
async def search(
    q: str = Query(..., description="natural-language query"),
    workspace_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=_DEFAULT_LIMIT, ge=1, le=_MAX_LIMIT),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SearchOut:
    """Embed `q` and return the nearest concepts and source passages."""
    query = q.strip()
    if not query:
        return SearchOut(concepts=[], passages=[])

    if workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
        await session.commit()
        workspace_id = workspace.id
    else:
        await require_workspace(session, user.id, workspace_id)

    # Embedding needs OpenAI; surface its absence as 503 (a clean CORS-safe error)
    # rather than letting it bubble to an unhandled 500.
    try:
        qvec = await embed_text(query)
    except Exception as exc:  # noqa: BLE001 — any embed failure is "search down"
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "search unavailable (embedding failed)"
        ) from exc

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
            select(
                Chunk.id,
                Document.id,
                Document.title,
                Chunk.content,
                pdist.label("dist"),
            )
            .join(Document, Document.id == Chunk.document_id)
            .where(Document.workspace_id == workspace_id, Chunk.embedding.isnot(None))
            .order_by(pdist)
            .limit(limit)
        )
    ).all()

    # Concepts mentioned in the returned chunks, in one round-trip. Per-chunk each
    # concept appears at most once (the mention natural key), so ordering here is
    # arbitrary — the client ranks by its loaded mention counts to pick a landing.
    chunk_ids = [r[0] for r in chunk_rows]
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
