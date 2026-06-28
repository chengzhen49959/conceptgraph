"""In-product conversational research agent (the web app's first-party agent).

The external MCP path lets a Claude client drive retrieval over a workspace; this
is the *in-product* equivalent for the student who never sets up MCP. It runs a
bounded, multi-step tool loop on ``agent_model``: the model plans, calls tools to
search the library and walk the concept graph, then answers grounded in what it
found, citing passages inline as ``[n]``.

Layering: this lives in ``services`` (not ``ai``) because it orchestrates the
retrieval *services* (``search``, ``concept_read``, ``graph_read``) as tools —
``services → ai`` is the one-way dependency, so an agent in ``ai`` would invert it.

The loop streams :class:`AgentEvent`s (text deltas, tool activity, incremental
sources, a final citation set); the chat router turns those into SSE frames and
persists the turn. Retrieval quality (concept-first expansion, honesty threshold,
hybrid lexical) is layered onto the *tools* in later phases without touching this
loop.
"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator, Sequence
from dataclasses import dataclass

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.answer import parse_citations
from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings
from app.services.concept_read import get_concept_detail, get_concept_passages
from app.services.graph_read import get_concept_neighbors, read_overview
from app.services.search import (
    EmbeddingUnavailable,
    concept_first_retrieve,
    hybrid_passages,
)

# --- Streamed events (what the chat router relays as SSE) ---------------------


@dataclass
class TextDelta:
    """A chunk of the assistant's answer as it streams."""

    text: str


@dataclass
class ToolStarted:
    """The model began a tool call (drives the "Searching…" activity line)."""

    name: str


@dataclass
class ToolFinished:
    """A tool call returned."""

    name: str


@dataclass
class Sources:
    """Passages newly gathered by the last tool call (display-ready, with ``n``)."""

    passages: list[dict]


@dataclass
class Done:
    """End of turn: the cited concept ids (for graph highlight) + full answer."""

    cited_concept_ids: list[str]
    text: str


AgentEvent = TextDelta | ToolStarted | ToolFinished | Sources | Done


# --- Citation registry -------------------------------------------------------
# A multi-step turn accumulates passages across many tool calls, so the single
# ``concepts_by_n`` map ``retrieve_for_answer`` builds for one retrieval is not
# enough. The registry assigns a STABLE global ``[n]`` across the whole turn
# (deduped by chunk), and maps a set of cited ``n`` back to concept ids — the same
# id-based highlight contract the single-shot /api/ask uses.

_SNIPPET_CHARS = 220  # display snippet length, matches the ask `context` event


@dataclass
class _RegPassage:
    n: int
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    content: str
    concept_ids: list[uuid.UUID]


class CitationRegistry:
    """Stable ``[n]`` assignment across all of a turn's tool calls."""

    def __init__(self, max_passages: int) -> None:
        self._max = max_passages
        self.passages: list[_RegPassage] = []
        self._by_chunk: dict[uuid.UUID, int] = {}

    def register(
        self,
        chunk_id: uuid.UUID,
        document_id: uuid.UUID,
        document_title: str,
        content: str,
        concept_ids: Sequence[uuid.UUID],
    ) -> int | None:
        """Return this chunk's citation index, assigning one on first sight.

        Re-registering the same chunk returns its existing ``n`` (so the model
        sees one stable index for a passage it meets twice). Past the cap, returns
        ``None`` — the caller then omits the ``[n]`` marker for that passage rather
        than letting the turn's context grow without bound.
        """
        existing = self._by_chunk.get(chunk_id)
        if existing is not None:
            return existing
        if len(self.passages) >= self._max:
            return None
        n = len(self.passages) + 1
        self.passages.append(
            _RegPassage(n, chunk_id, document_id, document_title, content, list(concept_ids))
        )
        self._by_chunk[chunk_id] = n
        return n

    def mark(self) -> int:
        """A cursor into the passage list, for :meth:`since`."""
        return len(self.passages)

    def since(self, marker: int) -> list[_RegPassage]:
        """Passages registered after ``marker`` (i.e. by the last tool call)."""
        return self.passages[marker:]

    def concept_ids_for(self, ns: set[int]) -> list[uuid.UUID]:
        """Union of concept ids behind the cited indices, in citation order.

        Indices outside the registered range are ignored (a model that invents
        ``[99]`` contributes nothing rather than erroring), mirroring
        ``parse_citations``' contract.
        """
        cited: list[uuid.UUID] = []
        seen: set[uuid.UUID] = set()
        for n in sorted(ns):
            if 1 <= n <= len(self.passages):
                for cid in self.passages[n - 1].concept_ids:
                    if cid not in seen:
                        seen.add(cid)
                        cited.append(cid)
        return cited


def _source_dict(p: _RegPassage) -> dict:
    """Display-ready source for a `sources` SSE frame (same shape as ask `context`)."""
    return {
        "n": p.n,
        "chunk_id": str(p.chunk_id),
        "document_id": str(p.document_id),
        "document_title": p.document_title,
        "snippet": p.content[:_SNIPPET_CHARS].strip(),
        "concept_ids": [str(c) for c in p.concept_ids],
    }


# --- Tool context + the tool set --------------------------------------------
# Each tool is an in-process async callable wrapping an existing retrieval service
# (reuse over new). Retrieval tools register their passages BEFORE returning, so
# the ``[n]`` the model sees equals the registry's ``n``.

_PER_CONCEPT_PASSAGES = 6
_SEARCH_LIMIT = 8
_MAX_TOPICS = 12
_TOP_CONCEPTS_PER_TOPIC = 5


@dataclass
class ToolContext:
    session: AsyncSession
    workspace_id: uuid.UUID
    owner_id: str  # Cognito sub — for the workspace-access checks the read services do
    registry: CitationRegistry


async def _tool_get_overview(ctx: ToolContext) -> dict:
    """Research map: topics (clusters) + their biggest concepts. The lost-student
    orientation tool — a light projection (no edge load) for "where do I start?"."""
    ov = await read_overview(
        ctx.session,
        ctx.workspace_id,
        max_topics=_MAX_TOPICS,
        top_concepts_per_topic=_TOP_CONCEPTS_PER_TOPIC,
    )
    return {
        "total_concepts": ov.total_concepts,
        "total_topics": ov.total_topics,
        "topics": [
            {
                "topic": t.label or "Untitled topic",
                "size": t.size,
                "top_concepts": [
                    {"concept_id": str(c.concept_id), "name": c.name, "papers": c.papers}
                    for c in t.top_concepts
                ],
            }
            for t in ov.topics
        ],
    }


async def _tool_find_concept(ctx: ToolContext, query: str) -> dict:
    """Concept-first retrieval: find the concept the query names, gather its
    cross-paper evidence + graph neighbours, or report honestly that it's absent.

    On a miss returns ``found: false`` with the closest concept (so the agent can
    say so plainly); on a hit returns the focus concept(s), related concepts to
    walk to, and numbered passages registered for [n] citation."""
    res = await concept_first_retrieve(ctx.session, ctx.workspace_id, query)
    if not res.hit:
        out: dict = {"found": False}
        if res.closest is not None:
            out["closest_concept"] = {
                "concept_id": str(res.closest.concept_id),
                "name": res.closest.name,
                "score": res.closest.score,
            }
        return out

    passages: list[dict] = []
    for p in res.passages:
        n = ctx.registry.register(
            p.chunk_id, p.document_id, p.document_title, p.content, p.concept_ids
        )
        entry: dict = {"document_title": p.document_title, "content": p.content}
        if p.via:
            entry["about"] = p.via  # which focus/related concepts this passage covers
        if n is not None:
            entry["n"] = n
        passages.append(entry)
    return {
        "found": True,
        "concepts": [
            {
                "concept_id": str(s.concept_id),
                "name": s.name,
                "description": s.description,
                "aliases": s.aliases,
                "papers": s.papers,
                "score": s.score,
            }
            for s in res.seeds
        ],
        "related_concepts": [
            {"concept_id": str(r.concept_id), "name": r.name, "relation": r.relation}
            for r in res.related
        ],
        "passages": passages,
    }


async def _tool_search_passages(ctx: ToolContext, query: str) -> dict:
    """Most relevant source passages across all papers, full text, registered for [n].

    Hybrid lexical+vector retrieval, MMR-diversified across papers (search.py), so
    exact terms aren't lost and the set isn't near-duplicates from one paper."""
    rc = await hybrid_passages(ctx.session, ctx.workspace_id, query, final_k=_SEARCH_LIMIT)
    passages: list[dict] = []
    # `passages` (full content) and `ctx_passages` (ids/provenance) run parallel by n.
    for ap, cp in zip(rc.passages, rc.ctx_passages):
        cids = [uuid.UUID(c) for c in cp["concept_ids"]]
        n = ctx.registry.register(
            uuid.UUID(cp["chunk_id"]),
            uuid.UUID(cp["document_id"]),
            ap.document_title,
            ap.content,
            cids,
        )
        entry: dict = {"document_title": ap.document_title, "content": ap.content}
        if n is not None:
            entry["n"] = n
        passages.append(entry)
    return {"passages": passages}


async def _tool_get_concept(ctx: ToolContext, concept_id: str) -> dict:
    """One concept: definition, aliases, papers, graph neighbours, and cite-able passages."""
    cid = uuid.UUID(concept_id)  # ValueError → _dispatch turns it into a tool error
    detail = await get_concept_detail(ctx.session, ctx.owner_id, cid)
    neighbors = await get_concept_neighbors(ctx.session, ctx.workspace_id, cid)
    cp = await get_concept_passages(ctx.session, ctx.owner_id, cid)
    passages: list[dict] = []
    for p in cp.passages[:_PER_CONCEPT_PASSAGES]:
        n = ctx.registry.register(p.chunk_id, p.document_id, p.document_title, p.content, [cid])
        entry: dict = {"document_title": p.document_title, "content": p.content}
        if n is not None:
            entry["n"] = n
        passages.append(entry)
    return {
        "concept_id": str(detail.id),
        "name": detail.name,
        "description": detail.description,
        "aliases": detail.aliases,
        "documents": [
            {"document_id": str(d.document_id), "title": d.title} for d in detail.documents
        ],
        "papers": len(detail.documents),
        "mentions": detail.mentions,
        "degree": detail.degree,
        "neighbors": [
            {
                "concept_id": str(nb.neighbor_id),
                "name": nb.name,
                "relation": nb.relation,
                "direction": nb.direction,
            }
            for nb in neighbors
        ],
        "passages": passages,
    }


_DISPATCH = {
    "get_overview": _tool_get_overview,
    "find_concept": _tool_find_concept,
    "search_passages": _tool_search_passages,
    "get_concept": _tool_get_concept,
}


async def _dispatch(name: str, args: dict, ctx: ToolContext) -> dict:
    """Run a tool, turning every failure into a tool RESULT the model can recover
    from — never a 500. A bad concept id, an inaccessible workspace, or a down
    embedder come back as ``{"error": ...}`` so the agent degrades gracefully."""
    fn = _DISPATCH.get(name)
    if fn is None:
        return {"error": f"unknown tool: {name}"}
    try:
        return await fn(ctx, **args)
    except EmbeddingUnavailable:
        return {"error": "retrieval unavailable (embedding failed)"}
    except HTTPException as exc:
        return {"error": str(exc.detail)}
    except (ValueError, TypeError) as exc:
        return {"error": str(exc)}


# Flat Responses-API function schemas. Params are minimal + all-required so the
# schema is strict; tuning knobs (limits) live in the tools, not the interface.
TOOL_SCHEMAS: list[dict] = [
    {
        "type": "function",
        "name": "get_overview",
        "description": (
            "Get a research map of the student's library: its topics (concept "
            "clusters) and the biggest concepts in each, plus totals. Call this "
            "FIRST when the student is vague, overwhelmed, or asks where to start — "
            "it orients them before any narrow search. Takes no arguments."
        ),
        "parameters": {"type": "object", "properties": {}, "required": [], "additionalProperties": False},
        "strict": True,
    },
    {
        "type": "function",
        "name": "find_concept",
        "description": (
            "THE main tool for a question about an idea. Give it the student's phrase; "
            "it finds the best-matching concept(s) in the library, gathers numbered "
            "source passages for them AND their closely-related concepts across ALL "
            "papers (cite as [n]), and lists related concepts to explore next. If the "
            "library does not cover it, returns found=false with the closest concept — "
            "say so honestly and do NOT invent an answer (you may then try "
            "search_passages for looser textual evidence)."
        ),
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "A concept name or phrase the student is asking about."}},
            "required": ["query"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "search_passages",
        "description": (
            "Find the most relevant source passages across ALL the student's papers "
            "for a phrase, by meaning AND exact terms. Returns numbered passages with "
            "full text — cite them inline as [n]. Use for general textual evidence, or "
            "when find_concept reports the idea isn't a named concept in the library."
        ),
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "What to find evidence about."}},
            "required": ["query"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_concept",
        "description": (
            "Open one concept by its concept_id (from find_concept or get_overview): "
            "its definition, aliases (merged synonyms), the papers it appears in, "
            "mention/edge counts, its directly-related concepts (neighbours, with the "
            "relation and direction — use these to walk the graph), and a few numbered "
            "source passages to cite as [n]. Use to go deep on a specific idea."
        ),
        "parameters": {
            "type": "object",
            "properties": {"concept_id": {"type": "string", "description": "A concept id (UUID)."}},
            "required": ["concept_id"],
            "additionalProperties": False,
        },
        "strict": True,
    },
]


_SYSTEM_PROMPT = """You are a research librarian for an undergraduate who is \
overwhelmed by a large, messy personal library of papers and does not yet know \
where ideas live or how they connect.

You have tools to: get a research-map overview of the library's topics \
(get_overview), find a concept with its cross-paper evidence and related concepts \
(find_concept), search source passages by meaning and exact terms (search_passages), \
and open one concept in depth including its graph neighbours (get_concept).

How to work:
- Plan, then act. Call tools to gather evidence BEFORE answering; do not answer \
from your own knowledge.
- For a question about an idea, start with find_concept. Then walk the concept graph: \
open a returned concept with get_concept or follow its related concepts / neighbours — \
go a hop or two deeper rather than relying on a single search.
- When the student is vague, overwhelmed, or asks where to start, CALL get_overview \
FIRST and orient them: name the main topics, the biggest concepts, and 2-3 concrete \
places to start.
- Ground every claim in retrieved passages and cite them inline with their bracketed \
index, e.g. "Transformers drop recurrence entirely [2]." Cite every passage you rely \
on; never invent a citation or an index you were not given.
- Be honest. If find_concept returns found=false (or the evidence is thin), say \
plainly that the library doesn't cover it, name the closest thing it does, and do NOT \
pad with outside knowledge.
- Be concise, direct, and encouraging; you are helping someone find their footing. \
Answer in the student's language."""


def history_to_input(messages: Sequence) -> list[dict]:
    """Prior turns → Responses ``input`` role messages.

    Only user/assistant text is replayed as conversation context; the assistant's
    tool trace is for display, not re-sent (the model re-plans each turn from the
    text). Accepts anything with ``.role`` / ``.content`` (ORM ``Message`` rows).
    """
    items: list[dict] = []
    for m in messages:
        if m.role == "user" and m.content:
            items.append({"role": "user", "content": m.content})
        elif m.role == "assistant" and m.content:
            items.append({"role": "assistant", "content": m.content})
    return items


async def run_agent(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    owner_id: str,
    history_input: list[dict],
    user_msg: str,
) -> AsyncIterator[AgentEvent]:
    """Drive one turn: plan → call tools → answer, streaming events throughout.

    ``history_input`` is the prior turns already in Responses ``input`` form (the
    router builds it with :func:`history_to_input` before streaming, so no ORM rows
    are touched mid-stream). Bounded by ``agent_max_tool_iters``; if the cap is hit
    while the model still wants tools, a final ``tool_choice="none"`` pass forces an
    answer so the turn always ends with a reply. Yields a closing :class:`Done` with
    the cited concept ids and the full answer text for the router to persist.
    """
    settings = get_settings()
    client = get_client()
    registry = CitationRegistry(settings.agent_max_passages)
    ctx = ToolContext(session, workspace_id, owner_id, registry)

    input_items: list = [*history_input, {"role": "user", "content": user_msg}]
    answer_parts: list[str] = []
    max_iters = settings.agent_max_tool_iters

    for i in range(max_iters + 1):
        # The extra final iteration forbids tools, forcing the model to answer.
        tool_choice = "auto" if i < max_iters else "none"
        final = None
        async with LLM_SEMAPHORE:
            # `async with` the stream so a client disconnect (GeneratorExit at a
            # yield) closes the httpx connection deterministically — same reason as
            # ai/answer.stream_answer.
            async with await client.responses.create(
                model=settings.agent_model,
                instructions=_SYSTEM_PROMPT,
                input=input_items,
                tools=TOOL_SCHEMAS,
                tool_choice=tool_choice,
                reasoning={"effort": "low"},
                stream=True,
            ) as stream:
                async for ev in stream:
                    etype = getattr(ev, "type", "")
                    if etype == "response.output_text.delta":
                        delta = getattr(ev, "delta", "")
                        if delta:
                            answer_parts.append(delta)
                            yield TextDelta(delta)
                    elif etype == "response.output_item.added":
                        item = getattr(ev, "item", None)
                        if item is not None and getattr(item, "type", "") == "function_call":
                            yield ToolStarted(getattr(item, "name", "tool"))
                    elif etype == "response.completed":
                        final = getattr(ev, "response", None)

        if final is None:
            break
        # Re-send the model's own output (reasoning items + tool calls) next turn so
        # a reasoning model stays coherent across tool rounds. (Plan B if the SDK
        # ever rejects replayed reasoning: switch to previous_response_id chaining.)
        input_items += list(final.output)
        calls = [it for it in final.output if getattr(it, "type", "") == "function_call"]
        if not calls or tool_choice == "none":
            break
        for it in calls:
            try:
                args = json.loads(it.arguments) if it.arguments else {}
            except (json.JSONDecodeError, TypeError):
                args = {}
            marker = registry.mark()
            result = await _dispatch(it.name, args, ctx)
            yield ToolFinished(it.name)
            new = registry.since(marker)
            if new:
                yield Sources([_source_dict(p) for p in new])
            input_items.append(
                {
                    "type": "function_call_output",
                    "call_id": it.call_id,
                    "output": json.dumps(result, ensure_ascii=False),
                }
            )

    text = "".join(answer_parts)
    cited = registry.concept_ids_for(parse_citations(text))
    yield Done([str(c) for c in cited], text)
