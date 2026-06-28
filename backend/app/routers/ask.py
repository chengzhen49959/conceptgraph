"""RAG Q&A (F8 §5.3) — embed the question, retrieve passages, stream a cited answer.

Retrieval (shared with `/api/search` and the MCP memory tools) lives in
``app.services.search.retrieve_for_answer``; this router adds the SSE generation
half. Each retrieved passage carries the concept ids it mentions, so when the
model cites a passage `[n]` the graph highlights what the answer relied on *by
concept id*, never by fuzzy-matching the answer text.

Workspace-scoped like the graph read API: no `workspace_id` → caller's personal.

SSE event stream (one JSON object per `data:` line):
  - `context` — `{passages:[{n,chunk_id,document_id,document_title,snippet,concept_ids}], concepts:[{id,name}]}`
    the evidence + a concept id→name map, sent once before the answer.
  - `delta`   — `{text}` repeated; the answer streamed token-by-token.
  - `done`    — `{cited_concept_ids}` the union of concept ids from the cited passages.
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
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.answer import parse_citations, stream_answer
from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.services.search import EmbeddingUnavailable, retrieve_for_answer
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/ask", tags=["ask"])
logger = logging.getLogger("ask")


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

    # Retrieval up front (inside the request, not the stream) so an embedding
    # failure surfaces as a clean 503 before any stream byte.
    try:
        ctx = await retrieve_for_answer(session, workspace_id, question)
    except EmbeddingUnavailable as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "ask unavailable (embedding failed)"
        ) from exc

    async def event_stream() -> AsyncIterator[str]:
        # Evidence first: the client renders sources + the id→name chip map before
        # the answer starts arriving.
        yield _sse(
            "context",
            {
                "passages": ctx.ctx_passages,
                "concepts": [
                    {"id": str(cid), "name": name}
                    for cid, name in ctx.concept_id_to_name.items()
                ],
            },
        )

        answer_parts: list[str] = []
        try:
            async for delta in stream_answer(question, ctx.passages):
                answer_parts.append(delta)
                yield _sse("delta", {"text": delta})
        except Exception:  # noqa: BLE001 — mid-stream failure can't be a 5xx
            logger.exception("answer generation failed")
            yield _sse("error", {"detail": "answer generation failed"})
            return

        # Cited concepts = union over the passages the answer actually cited.
        cited: list[uuid.UUID] = []
        seen: set[uuid.UUID] = set()
        for n in sorted(parse_citations("".join(answer_parts))):
            for cid in ctx.concepts_by_n.get(n, []):
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
