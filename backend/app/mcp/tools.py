"""Model-facing MCP tools over the concept-graph knowledge base.

Each tool resolves the caller's Cognito ``sub`` from the verified access token,
opens a DB session, and calls the shared service layer directly (no HTTP
self-call, no token forwarding). Tools default to the caller's personal
workspace and accept an optional ``workspace_id``.
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException
from mcp.server.auth.middleware.auth_context import get_access_token
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.answer import parse_citations, stream_answer
from app.config import get_settings
from app.db import session_scope
from app.mcp.runtime import get_arq
from app.mcp.server import mcp_server
from app.services.clip import clip_document
from app.services.concept_read import get_concept_detail, get_concept_passages
from app.services.graph_read import GraphOut, read_graph
from app.services.search import (
    MAX_LIMIT,
    EmbeddingUnavailable,
    SearchOut,
    retrieve_for_answer,
    semantic_search,
)
from app.services.workspaces import ensure_personal_workspace, require_workspace


def _require_sub() -> str:
    """The caller's Cognito ``sub`` from the verified token, or error."""
    token = get_access_token()
    if token is None or not token.subject:
        raise ValueError("unauthenticated")
    return token.subject


def _uuid(value: str, field: str = "id") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"invalid {field}: {value!r}") from exc


async def _resolve_workspace(
    session: AsyncSession, sub: str, workspace_id: str | None
) -> uuid.UUID:
    """Default to the caller's personal workspace; else require membership."""
    if workspace_id is None:
        ws = await ensure_personal_workspace(session, sub)
        await session.commit()
        return ws.id
    wid = _uuid(workspace_id, "workspace_id")
    try:
        await require_workspace(session, sub, wid)
    except HTTPException as exc:
        raise ValueError(f"workspace not accessible: {exc.detail}") from exc
    return wid


@mcp_server.tool()
async def memory_search(
    query: str, workspace_id: str | None = None, limit: int = 10
) -> SearchOut:
    """Semantic search over the user's saved knowledge. Returns the nearest
    concepts (graph nodes) and source passages by meaning, each with a relevance
    score (0..1). Use it to recall relevant material before answering, or to find
    where a topic appears in the user's library. `limit` is clamped to 1..50."""
    sub = _require_sub()
    limit = max(1, min(limit, MAX_LIMIT))
    async with session_scope() as session:
        ws_id = await _resolve_workspace(session, sub, workspace_id)
        try:
            return await semantic_search(session, ws_id, query, limit)
        except EmbeddingUnavailable as exc:
            raise ValueError("search unavailable (embedding failed)") from exc


@mcp_server.tool()
async def memory_ask(question: str, workspace_id: str | None = None) -> dict:
    """Answer a question grounded ONLY in the user's saved library, with inline
    [n] citations referencing the returned sources. Returns
    {answer, sources, cited_concept_ids}; cited_concept_ids are the concepts the
    answer relied on (for highlighting in the graph). If nothing relevant is
    saved, the answer says so. Prefer this when the user wants a direct answer."""
    sub = _require_sub()
    question = question.strip()
    async with session_scope() as session:
        ws_id = await _resolve_workspace(session, sub, workspace_id)
        try:
            ctx = await retrieve_for_answer(session, ws_id, question)
        except EmbeddingUnavailable as exc:
            raise ValueError("ask unavailable (embedding failed)") from exc

    # Generation needs no DB — stream to completion and collect (no SSE on MCP).
    parts: list[str] = []
    async for delta in stream_answer(question, ctx.passages):
        parts.append(delta)
    answer = "".join(parts)

    cited: list[str] = []
    seen: set[uuid.UUID] = set()
    for n in sorted(parse_citations(answer)):
        for cid in ctx.concepts_by_n.get(n, []):
            if cid not in seen:
                seen.add(cid)
                cited.append(str(cid))
    return {"answer": answer, "sources": ctx.ctx_passages, "cited_concept_ids": cited}


@mcp_server.tool()
async def graph_get(workspace_id: str | None = None) -> GraphOut:
    """Return the user's whole concept graph: nodes (concepts, sized by how many
    documents mention them), links (typed relations between concepts), and
    clusters (topics). Use for an overview of the structure of what the user
    knows. For one concept's detail, call concept_get."""
    sub = _require_sub()
    async with session_scope() as session:
        ws_id = await _resolve_workspace(session, sub, workspace_id)
        return await read_graph(session, ws_id)


@mcp_server.tool()
async def concept_get(concept_id: str, include_passages: bool = True) -> dict:
    """Get one concept's detail: description, aliases (merged synonyms), the
    documents that mention it, total mentions, and degree (incident edges). With
    include_passages=true, also returns the full source passages it appears in.
    Use to drill into a node returned by memory_search or graph_get."""
    sub = _require_sub()
    cid = _uuid(concept_id, "concept_id")
    async with session_scope() as session:
        try:
            detail = await get_concept_detail(session, sub, cid)
            out = detail.model_dump(mode="json")
            if include_passages:
                passages = await get_concept_passages(session, sub, cid)
                out["passages"] = passages.model_dump(mode="json")["passages"]
        except HTTPException as exc:
            raise ValueError(str(exc.detail)) from exc
    return out


@mcp_server.tool()
async def memory_write(
    title: str,
    content: str,
    source_url: str | None = None,
    workspace_id: str | None = None,
) -> dict:
    """Save a new note into the user's knowledge base so it becomes searchable.
    `content` is Markdown (a note, summary, or excerpt). Ingestion is ASYNC: the
    text is queued for parsing/embedding/concept-extraction, so its concepts
    appear in memory_search/graph_get only after processing finishes (seconds to
    a minute). Pass `source_url` when saving from a web page — re-saving the same
    URL is a no-op. Requires write access to the target workspace."""
    token = get_access_token()
    if token is None or not token.subject:
        raise ValueError("unauthenticated")
    _, write_scope = get_settings().mcp_scopes
    if write_scope not in (token.scopes or []):
        raise ValueError(
            "this connection lacks write permission (the 'write' scope was not granted)"
        )

    wid = None if workspace_id is None else _uuid(workspace_id, "workspace_id")
    async with session_scope() as session:
        try:
            result = await clip_document(
                session,
                get_arq(),
                user_id=token.subject,
                title=title,
                content=content,
                source_url=source_url,
                workspace_id=wid,
            )
        except HTTPException as exc:
            raise ValueError(str(exc.detail)) from exc
    return {
        "document_id": str(result.document_id),
        "job_id": result.job_id,
        "duplicate": result.duplicate,
        "status": "duplicate" if result.duplicate else "queued",
        "note": (
            "This source was already saved; nothing re-ingested."
            if result.duplicate
            else "Saved and queued for ingestion; concepts appear after processing."
        ),
    }
