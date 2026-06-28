"""Conversational agent — the pure pieces + the tool loop with a mocked model.

``CitationRegistry`` and ``history_to_input`` are pure (no LLM, no DB). ``run_agent``
is exercised against a scripted fake OpenAI stream (no network, no env): the model
asks for one tool, then answers citing the passage that tool registered — so the
loop must run the tool, stream the answer, and end with the right cited concept id.
"""

import types
import uuid

from app.services import agent
from app.services.agent import (
    CitationRegistry,
    Done,
    Sources,
    TextDelta,
    ToolFinished,
    ToolStarted,
    history_to_input,
    run_agent,
)


# --- CitationRegistry --------------------------------------------------------


def test_registry_assigns_sequential_indices():
    reg = CitationRegistry(max_passages=10)
    c1, c2 = uuid.uuid4(), uuid.uuid4()
    assert reg.register(uuid.uuid4(), uuid.uuid4(), "Doc A", "x", [c1]) == 1
    assert reg.register(uuid.uuid4(), uuid.uuid4(), "Doc B", "y", [c2]) == 2


def test_registry_dedupes_by_chunk():
    reg = CitationRegistry(max_passages=10)
    chunk = uuid.uuid4()
    n1 = reg.register(chunk, uuid.uuid4(), "Doc", "x", [uuid.uuid4()])
    n2 = reg.register(chunk, uuid.uuid4(), "Doc", "x", [uuid.uuid4()])
    assert n1 == n2 == 1
    assert len(reg.passages) == 1  # the second sighting added nothing


def test_registry_cap_returns_none_past_limit():
    reg = CitationRegistry(max_passages=2)
    assert reg.register(uuid.uuid4(), uuid.uuid4(), "d", "a", []) == 1
    assert reg.register(uuid.uuid4(), uuid.uuid4(), "d", "b", []) == 2
    assert reg.register(uuid.uuid4(), uuid.uuid4(), "d", "c", []) is None  # over cap


def test_registry_concept_ids_for_unions_in_citation_order():
    reg = CitationRegistry(max_passages=10)
    a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    reg.register(uuid.uuid4(), uuid.uuid4(), "d", "1", [a, b])  # n=1
    reg.register(uuid.uuid4(), uuid.uuid4(), "d", "2", [b, c])  # n=2 (b repeats)
    # cited [2] then [1]: ordered by n, deduped → a,b (from 1) then c (new from 2)
    assert reg.concept_ids_for({2, 1}) == [a, b, c]


def test_registry_concept_ids_for_ignores_out_of_range():
    reg = CitationRegistry(max_passages=10)
    a = uuid.uuid4()
    reg.register(uuid.uuid4(), uuid.uuid4(), "d", "1", [a])
    # [9] was never registered (a hallucinated index) → contributes nothing.
    assert reg.concept_ids_for({9}) == []
    assert reg.concept_ids_for({1, 9}) == [a]


# --- history_to_input --------------------------------------------------------


def test_history_to_input_keeps_user_and_assistant_text():
    msgs = [
        types.SimpleNamespace(role="user", content="hi"),
        types.SimpleNamespace(role="assistant", content="hello"),
        types.SimpleNamespace(role="tool", content="{...}"),  # dropped
        types.SimpleNamespace(role="assistant", content=None),  # dropped (no text)
        types.SimpleNamespace(role="user", content="next"),
    ]
    assert history_to_input(msgs) == [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
        {"role": "user", "content": "next"},
    ]


# --- run_agent loop (mocked model) -------------------------------------------


class _Item:
    def __init__(self, type, **kw):
        self.type = type
        for k, v in kw.items():
            setattr(self, k, v)


class _Ev:
    def __init__(self, type, **kw):
        self.type = type
        for k, v in kw.items():
            setattr(self, k, v)


class _Resp:
    def __init__(self, output):
        self.output = output


class _FakeStream:
    """Async-iterable context manager over a fixed list of stream events."""

    def __init__(self, events):
        self._events = events

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def __aiter__(self):
        for e in self._events:
            yield e


class _FakeResponses:
    def __init__(self, scripted):
        self._scripted = scripted
        self._i = 0

    async def create(self, **kwargs):
        events = self._scripted[self._i]
        self._i += 1
        return _FakeStream(events)


class _FakeClient:
    def __init__(self, scripted):
        self.responses = _FakeResponses(scripted)


async def _collect(agen):
    return [ev async for ev in agen]


async def test_run_agent_runs_tool_then_answers(monkeypatch):
    concept_id = uuid.uuid4()

    # Turn 1: the model asks for a tool. Turn 2: it answers, citing [1].
    fc = _Item("function_call", name="search_passages", arguments='{"query":"x"}', call_id="c1")
    turn1 = [
        _Ev("response.output_item.added", item=fc),
        _Ev("response.completed", response=_Resp([fc])),
    ]
    turn2 = [
        _Ev("response.output_text.delta", delta="Recurrence is dropped "),
        _Ev("response.output_text.delta", delta="[1]."),
        _Ev("response.completed", response=_Resp([_Item("message")])),
    ]

    async def fake_dispatch(name, args, ctx):
        # Whatever the model "searched", register one passage so [1] resolves.
        ctx.registry.register(uuid.uuid4(), uuid.uuid4(), "A Paper", "body", [concept_id])
        return {"passages": [{"n": 1, "document_title": "A Paper", "content": "body"}]}

    monkeypatch.setattr(agent, "get_client", lambda: _FakeClient([turn1, turn2]))
    monkeypatch.setattr(
        agent,
        "get_settings",
        lambda: types.SimpleNamespace(
            agent_model="test", agent_max_tool_iters=6, agent_max_passages=30
        ),
    )
    monkeypatch.setattr(agent, "_dispatch", fake_dispatch)

    events = await _collect(
        run_agent(None, uuid.uuid4(), "user-sub", [], "why no recurrence?")
    )

    # The tool ran, surfaced sources, then the answer streamed.
    assert any(isinstance(e, ToolStarted) and e.name == "search_passages" for e in events)
    assert any(isinstance(e, ToolFinished) for e in events)
    assert any(isinstance(e, Sources) for e in events)
    text = "".join(e.text for e in events if isinstance(e, TextDelta))
    assert text == "Recurrence is dropped [1]."

    # The turn ends with exactly the cited concept, mapped from [1].
    done = [e for e in events if isinstance(e, Done)]
    assert len(done) == 1
    assert done[0].cited_concept_ids == [str(concept_id)]
    assert done[0].text == "Recurrence is dropped [1]."
