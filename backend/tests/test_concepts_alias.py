"""P1 — alias-aware fast path in `resolve_concept`.

A surface form that exactly matches a canonical name OR a known alias must reuse
that node and short-circuit BEFORE any embedding / ANN / LLM judge runs. We prove
the short-circuit by pointing `embed_text` and `match_concept` at a function that
raises: if the fast path ever falls through on a hit, the test fails loudly.

Sync tests drive the coroutine with `asyncio.run`, so they don't depend on the
project's pytest-asyncio configuration. The DB is a tiny scripted fake — the
queries themselves are exercised end-to-end by the e2e smoke, not here.
"""

import asyncio
import uuid

import app.services.concepts as cc
from app.services.concepts import resolve_concept


class _Result:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class _Session:
    """Returns the next scripted result per `execute`, in call order."""

    def __init__(self, results_iter):
        self._results = results_iter

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def execute(self, *_args, **_kwargs):
        return _Result(next(self._results))

    async def commit(self):
        pass


class _Sessionmaker:
    def __init__(self, results):
        self._results = iter(results)

    def __call__(self):
        return _Session(self._results)


def _boom(*_args, **_kwargs):
    raise AssertionError("a fast-path hit must not embed / call the LLM")


def test_alias_hit_reuses_concept_and_skips_ann_and_llm(monkeypatch):
    monkeypatch.setattr(cc, "embed_text", _boom)
    monkeypatch.setattr(cc, "match_concept", _boom)

    concept_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    # One fast-path session: exact-name lookup misses (None), alias lookup hits.
    maker = _Sessionmaker([None, concept_id])
    cache: dict[str, uuid.UUID] = {}

    out = asyncio.run(
        resolve_concept(maker, workspace_id, "ML", "machine learning", [0.1, 0.2], cache)
    )

    assert out == concept_id
    assert cache["ml"] == concept_id  # cached by lowercased key for the rest of the doc


def test_name_hit_short_circuits_before_alias_lookup(monkeypatch):
    monkeypatch.setattr(cc, "embed_text", _boom)
    monkeypatch.setattr(cc, "match_concept", _boom)

    concept_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    # Only the exact-name lookup is consumed; alias lookup is never reached.
    maker = _Sessionmaker([concept_id])
    cache: dict[str, uuid.UUID] = {}

    out = asyncio.run(
        resolve_concept(maker, workspace_id, "Machine Learning", None, [0.0], cache)
    )

    assert out == concept_id


def test_cache_hit_returns_without_touching_db(monkeypatch):
    monkeypatch.setattr(cc, "embed_text", _boom)
    monkeypatch.setattr(cc, "match_concept", _boom)

    concept_id = uuid.uuid4()
    workspace_id = uuid.uuid4()
    maker = _Sessionmaker([])  # any DB access would StopIteration
    cache = {"ml": concept_id}

    out = asyncio.run(resolve_concept(maker, workspace_id, "ML", "d", [0.0], cache))

    assert out == concept_id
