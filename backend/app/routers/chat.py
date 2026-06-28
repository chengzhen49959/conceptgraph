"""In-product conversational research agent (web app's first-party chat).

Multi-turn chat over a workspace's library, driven by the multi-step tool agent in
``app.services.agent``. Conversations are PRIVATE to the user who started them
(scoped by ``owner_id``), unlike the shared graph. The retrieval surface is the
agent's tools — the same services ``/api/search`` and the MCP tools use — so this
adds no new retrieval, only the conversation + streaming layer.

The answer is streamed over SSE. Because the agent calls tools (DB reads) WHILE
streaming, the turn runs on its own ``session_scope`` session inside the stream
generator, not the request-scoped dependency (whose lifetime around a streaming
body is subtle). Access checks + the user message are handled up front on the
request session so a 404/403 is a clean HTTP error before any stream byte.

SSE event stream (one JSON object per ``data:`` line):
  - ``tool``    — ``{name, status}`` the agent started/finished a tool call.
  - ``sources`` — ``{passages:[{n,chunk_id,document_id,document_title,snippet,concept_ids}]}``
    passages newly gathered, repeated as the agent works.
  - ``delta``   — ``{text}`` repeated; the answer streamed token-by-token.
  - ``done``    — ``{cited_concept_ids, message_id}`` the concepts the answer cited.
  - ``error``   — ``{detail}`` if the turn fails mid-stream.
"""

import json
import logging
import uuid
from collections.abc import AsyncIterator
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session, session_scope
from app.models import Conversation, Message
from app.services.agent import (
    Done,
    Sources,
    TextDelta,
    ToolFinished,
    ToolStarted,
    history_to_input,
    run_agent,
)
from app.services.workspaces import (
    ensure_personal_workspace,
    require_workspace,
    touch_workspace,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger("chat")

_TITLE_CHARS = 80  # a conversation's title is the leading slice of its first message


def _sse(event: str, data: dict) -> str:
    """One SSE frame. ``data`` is JSON so newlines/brackets in the answer survive."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# --- DTOs --------------------------------------------------------------------


class ConversationIn(BaseModel):
    workspace_id: uuid.UUID | None = None


class MessageIn(BaseModel):
    content: str = Field(..., description="the user's message")


class ConversationOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str | None
    created_at: datetime
    updated_at: datetime


class MessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str | None
    tool_calls: list | None
    cited_concept_ids: list | None
    created_at: datetime


class ConversationDetailOut(BaseModel):
    conversation: ConversationOut
    messages: list[MessageOut]


# --- Helpers -----------------------------------------------------------------


async def _resolve_workspace(
    session: AsyncSession, user: CurrentUser, workspace_id: uuid.UUID | None
) -> uuid.UUID:
    """Default to the caller's personal workspace; else require membership (same
    rule as ``/api/ask``)."""
    if workspace_id is None:
        ws = await ensure_personal_workspace(session, user.id)
        await session.commit()
        return ws.id
    await require_workspace(session, user.id, workspace_id)
    return workspace_id


async def _load_owned_conversation(
    session: AsyncSession, user: CurrentUser, conversation_id: uuid.UUID
) -> Conversation:
    """A conversation the caller owns, else 404. Uses 404 (not 403) for a
    conversation owned by someone else so existence isn't leaked. Also re-checks
    workspace membership so a revoked member can't keep chatting."""
    conv = await session.get(Conversation, conversation_id)
    if conv is None or conv.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "conversation not found")
    await require_workspace(session, user.id, conv.workspace_id)
    return conv


def _conversation_out(conv: Conversation) -> ConversationOut:
    return ConversationOut(
        id=conv.id,
        workspace_id=conv.workspace_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


# --- Endpoints ---------------------------------------------------------------


@router.post("/conversations", response_model=ConversationOut)
async def create_conversation(
    body: ConversationIn,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConversationOut:
    """Start an empty conversation in a workspace (title set from the first message)."""
    workspace_id = await _resolve_workspace(session, user, body.workspace_id)
    conv = Conversation(workspace_id=workspace_id, owner_id=user.id)
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return _conversation_out(conv)


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    workspace_id: uuid.UUID | None = None,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConversationOut]:
    """The caller's conversations in a workspace, most recently active first."""
    ws_id = await _resolve_workspace(session, user, workspace_id)
    rows = (
        await session.execute(
            select(Conversation)
            .where(Conversation.workspace_id == ws_id, Conversation.owner_id == user.id)
            .order_by(Conversation.updated_at.desc())
        )
    ).scalars().all()
    return [_conversation_out(c) for c in rows]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
async def get_conversation(
    conversation_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConversationDetailOut:
    """A conversation plus its full message history, oldest first."""
    conv = await _load_owned_conversation(session, user, conversation_id)
    rows = (
        await session.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
        )
    ).scalars().all()
    return ConversationDetailOut(
        conversation=_conversation_out(conv),
        messages=[
            MessageOut(
                id=m.id,
                role=m.role,
                content=m.content,
                tool_calls=m.tool_calls,
                cited_concept_ids=m.cited_concept_ids,
                created_at=m.created_at,
            )
            for m in rows
        ],
    )


@router.post("/conversations/{conversation_id}/messages")
async def post_message(
    conversation_id: uuid.UUID,
    body: MessageIn,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """Send a message; stream the agent's grounded, cited answer over SSE."""
    content = body.content.strip()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "empty message")

    conv = await _load_owned_conversation(session, user, conversation_id)
    workspace_id = conv.workspace_id

    # History BEFORE this turn, converted to Responses input up front (no ORM rows
    # touched once the stream — and its own session — takes over).
    prior = (
        await session.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at)
        )
    ).scalars().all()
    history_input = history_to_input(prior)

    # Persist the user turn (and name the conversation on its first message).
    session.add(Message(conversation_id=conv.id, role="user", content=content))
    if conv.title is None:
        conv.title = content[:_TITLE_CHARS]
    await session.commit()

    conv_id = conv.id
    owner_id = user.id

    async def event_stream() -> AsyncIterator[str]:
        answer_parts: list[str] = []
        tool_trace: list[dict] = []
        cited_ids: list[str] = []
        persisted = False

        # Own session: the agent's tools read the DB while the answer streams.
        async with session_scope() as agent_session:

            async def persist() -> Message | None:
                nonlocal persisted
                if persisted:
                    return None
                persisted = True
                msg = Message(
                    conversation_id=conv_id,
                    role="assistant",
                    content="".join(answer_parts) or None,
                    tool_calls=tool_trace or None,
                    cited_concept_ids=cited_ids or None,
                )
                agent_session.add(msg)
                await agent_session.execute(
                    update(Conversation)
                    .where(Conversation.id == conv_id)
                    .values(updated_at=func.now())
                )
                await touch_workspace(agent_session, workspace_id)
                await agent_session.commit()
                await agent_session.refresh(msg)
                return msg

            try:
                async for ev in run_agent(
                    agent_session, workspace_id, owner_id, history_input, content
                ):
                    if isinstance(ev, TextDelta):
                        answer_parts.append(ev.text)
                        yield _sse("delta", {"text": ev.text})
                    elif isinstance(ev, ToolStarted):
                        tool_trace.append({"name": ev.name, "status": "started"})
                        yield _sse("tool", {"name": ev.name, "status": "started"})
                    elif isinstance(ev, ToolFinished):
                        tool_trace.append({"name": ev.name, "status": "finished"})
                        yield _sse("tool", {"name": ev.name, "status": "finished"})
                    elif isinstance(ev, Sources):
                        yield _sse("sources", {"passages": ev.passages})
                    elif isinstance(ev, Done):
                        cited_ids = ev.cited_concept_ids
                        msg = await persist()
                        yield _sse(
                            "done",
                            {
                                "cited_concept_ids": cited_ids,
                                "message_id": str(msg.id) if msg else None,
                            },
                        )
            except Exception:  # noqa: BLE001 — a mid-stream failure can't be a 5xx
                logger.exception("agent turn failed")
                yield _sse("error", {"detail": "the agent hit an error"})
            finally:
                # Client disconnected before `done` → save the partial answer so the
                # turn isn't lost. (GeneratorExit skips `except` but runs `finally`.)
                if not persisted and (answer_parts or tool_trace):
                    try:
                        await persist()
                    except Exception:
                        logger.exception("failed to persist partial assistant turn")

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering so deltas flush live
        },
    )
