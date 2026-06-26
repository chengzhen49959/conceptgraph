"""RAG Q&A (F8 §5.3) — embed the question, retrieve passages, stream a cited answer.

The retrieval half mirrors `/api/search` exactly (one query embedding matched by
pgvector cosine ANN against the workspace's `chunks`); the generation half streams
a citation-backed answer over Server-Sent Events. Each retrieved passage carries the
concept ids it mentions, so when the model cites a passage `[n]` the router lights
the concepts that passage covers — the graph highlights what an answer relied on
*by concept id*, never by fuzzy-matching the answer text.

Workspace-scoped exactly like the graph read API: no `workspace_id` → the caller's
personal workspace.

SSE event stream (one JSON object per `data:` line):
  - `context` — `{passages:[{n,chunk_id,document_id,document_title,snippet,concept_ids}], concepts:[{id,name}]}`
    the evidence + a concept id→name map, sent once before the answer.
  - `delta`   — `{text}` repeated; the answer streamed token-by-token.
  - `done`    — `{cited_concept_ids}` the union of concept ids from the passages the
    answer actually cited (the authoritative highlight set).
  - `error`   — `{detail}` if generation fails mid-stream.

Embedding failure (before any stream byte) is a clean 503, like `/api/search`.
"""

import json
import logging
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.answer import AnswerPassage, parse_citations, stream_answer
from app.ai.embeddings import embed_text
from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Chunk, Concept, ConceptMention, Document
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/ask", tags=["ask"])
logger = logging.getLogger("ask")

# Passages fed to the model as context. Small enough that the full chunk texts fit
# comfortably in the prompt and the answer stays grounded in a handful of sources
# rather than diluted across many weak matches.
_TOP_K = 8
# Snippet length for the `context` event (palette display only — the model gets the
# full chunk content). Matches the search palette's passage rows.
_SNIPPET_CHARS = 220


class AskIn(BaseModel):
    q: str = Field(..., description="natural-language question")
    workspace_id: uuid.UUID | None = None


def _sse(event: str, data: dict) -> str:
    """One SSE frame. `data` is JSON so newlines/brackets in the answer survive."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("")
async def ask(
    body: AskIn,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """Answer `body.q` from the workspace library; stream the cited answer over SSE."""
    question = body.q.strip()
    workspace_id = body.workspace_id

    if workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
        await session.commit()
        workspace_id = workspace.id
    else:
        await require_workspace(session, user.id, workspace_id)

    # Retrieval happens up front (inside the request, not the stream) so an embedding
    # failure surfaces as a clean 503 before any stream byte — a half-open SSE
    # connection can't carry an HTTP status. An empty question or an empty library
    # both legitimately retrieve nothing; the generator handles that (define-away).
    passages: list[AnswerPassage] = []
    ctx_passages: list[dict] = []
    concept_id_to_name: dict[uuid.UUID, str] = {}
    # n (1-based citation index) → that passage's concept ids, for mapping the
    # answer's `[n]` citations back to concepts once the stream finishes.
    concepts_by_n: dict[int, list[uuid.UUID]] = {}

    if question:
        try:
            qvec = await embed_text(question)
        except Exception as exc:  # noqa: BLE001 — any embed failure is "ask is down"
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "ask unavailable (embedding failed)",
            ) from exc

        pdist = Chunk.embedding.cosine_distance(qvec)
        chunk_rows = (
            await session.execute(
                select(
                    Chunk.id,
                    Document.id,
                    Document.title,
                    Chunk.content,
                )
                .join(Document, Document.id == Chunk.document_id)
                .where(
                    Document.workspace_id == workspace_id,
                    Chunk.embedding.isnot(None),
                )
                .order_by(pdist)
                .limit(_TOP_K)
            )
        ).all()

        chunk_ids = [r[0] for r in chunk_rows]

        # Concept ids per retrieved chunk, in one round-trip — the same join the
        # search router uses for passage provenance.
        concepts_by_chunk: dict[uuid.UUID, list[uuid.UUID]] = {
            cid: [] for cid in chunk_ids
        }
        if chunk_ids:
            for chunk_id, concept_id in (
                await session.execute(
                    select(ConceptMention.chunk_id, ConceptMention.concept_id).where(
                        ConceptMention.chunk_id.in_(chunk_ids)
                    )
                )
            ).all():
                concepts_by_chunk[chunk_id].append(concept_id)

        # Names for every concept surfaced, so the client can render chips without a
        # second request.
        mentioned_ids = {cid for ids in concepts_by_chunk.values() for cid in ids}
        if mentioned_ids:
            for cid, name in (
                await session.execute(
                    select(Concept.id, Concept.name).where(
                        Concept.id.in_(mentioned_ids)
                    )
                )
            ).all():
                concept_id_to_name[cid] = name

        for i, r in enumerate(chunk_rows, start=1):
            chunk_id, document_id, title, content = r
            cids = concepts_by_chunk[chunk_id]
            concepts_by_n[i] = cids
            passages.append(
                AnswerPassage(n=i, content=content, document_title=title)
            )
            ctx_passages.append(
                {
                    "n": i,
                    "chunk_id": str(chunk_id),
                    "document_id": str(document_id),
                    "document_title": title,
                    "snippet": content[:_SNIPPET_CHARS].strip(),
                    "concept_ids": [str(c) for c in cids],
                }
            )

    async def event_stream() -> AsyncIterator[str]:
        # Evidence first: the client renders sources + readies the id→name chip map
        # before the answer starts arriving.
        yield _sse(
            "context",
            {
                "passages": ctx_passages,
                "concepts": [
                    {"id": str(cid), "name": name}
                    for cid, name in concept_id_to_name.items()
                ],
            },
        )

        answer_parts: list[str] = []
        try:
            async for delta in stream_answer(question, passages):
                answer_parts.append(delta)
                yield _sse("delta", {"text": delta})
        except Exception:  # noqa: BLE001 — mid-stream failure can't be a 5xx
            # Log the real cause server-side; send the client a generic message —
            # the raw exception can carry provider/model/request internals (mirrors
            # the fixed-message 503 on the embedding path above).
            logger.exception("answer generation failed")
            yield _sse("error", {"detail": "answer generation failed"})
            return

        # Cited concepts = union over the passages the answer actually cited. Indices
        # the model invents beyond the passage range simply contribute nothing.
        cited_n = parse_citations("".join(answer_parts))
        cited: list[uuid.UUID] = []
        seen: set[uuid.UUID] = set()
        for n in sorted(cited_n):
            for cid in concepts_by_n.get(n, []):
                if cid not in seen:
                    seen.add(cid)
                    cited.append(cid)
        yield _sse("done", {"cited_concept_ids": [str(c) for c in cited]})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering so deltas flush live
        },
    )
