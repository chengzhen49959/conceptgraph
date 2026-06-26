"""RAG answer generation — citation parsing + the empty-context define-away.

`parse_citations` maps an answer's inline `[n]` markers back to passage indices; the
ask router unions the concept ids of the cited passages into the graph-highlight set.
`stream_answer` with no passages must yield the fixed no-context reply and make no
model call. Both are pure (no LLM, no DB), so they run with no environment.
"""

import pytest

from app.ai.answer import NO_CONTEXT_REPLY, parse_citations, stream_answer


def test_single_citation():
    assert parse_citations("Transformers drop recurrence [2].") == {2}


def test_adjacent_and_grouped_citations():
    # [1][3] adjacent and [1, 2] / [4; 5] grouped all parse to their integers.
    assert parse_citations("a [1][3] b [1, 2] c [4; 5]") == {1, 2, 3, 4, 5}


def test_dedup_across_repeats():
    assert parse_citations("[1] then again [1] and [1]") == {1}


def test_no_citations_is_empty():
    assert parse_citations("An answer with no sources at all.") == set()
    assert parse_citations("") == set()


def test_non_citation_brackets_ignored():
    # Bracketed non-digits (e.g. a stray "[note]") aren't citations.
    assert parse_citations("see [note] and array[0] but cite [3]") == {3}


def test_multi_digit_indices():
    assert parse_citations("deep in the list [10] and [12, 13]") == {10, 12, 13}


async def _collect(agen):
    return [chunk async for chunk in agen]


@pytest.mark.asyncio
async def test_empty_passages_yields_fixed_reply_no_model_call():
    # No passages → the deterministic no-context reply, as a single delta, with no
    # OpenAI client touched (get_client would raise without a key — proving no call).
    out = await _collect(stream_answer("anything?", []))
    assert out == [NO_CONTEXT_REPLY]
