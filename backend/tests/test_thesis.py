"""Thesis anchor — positional slicing + the in-framing grounding prior.

The anchor feeds the core-concept gate (`app.ai.select_core`): it is the document's
own framing, taken as fixed front/tail windows rather than parsed sections, so it
always returns SOME text and never raises. These tests pin the slicing contract and
the grounding match, both pure (no LLM, no DB), so they run with no environment.
"""

from app.services.thesis import _GAP, grounds_in, thesis_anchor


def test_short_document_returned_whole_no_elision():
    body = "A compact abstract.\n\nA short body.\n\nA brief conclusion."
    out = thesis_anchor(body)
    assert out == body
    assert _GAP not in out  # nothing elided when the body fits in the two windows


def test_long_document_keeps_front_and_tail_elides_middle():
    body = "HEAD" + ("x" * 20_000) + "TAIL"
    out = thesis_anchor(body, front=100, tail=100)
    assert out.startswith("HEAD")
    assert out.endswith("TAIL")
    assert _GAP in out
    # The elided middle is gone — the anchor is far shorter than the body.
    assert len(out) < 300


def test_title_is_prepended_and_grounds():
    out = thesis_anchor("Body about widgets.", title="A Study of Frobnication")
    assert out.startswith("TITLE: A Study of Frobnication")
    # A concept named only in the title still grounds (the title is part of the anchor).
    assert grounds_in(out, "Frobnication") is True


def test_grounding_is_case_insensitive_and_matches_aliases():
    anchor = "TITLE: On Self-Attention\n\nWe study scaled dot-product attention."
    assert grounds_in(anchor, "Self-Attention") is True           # canonical name, any case
    assert grounds_in(anchor, "intra-attention", "self-attention") is True  # via a surface form
    assert grounds_in(anchor, "recurrence") is False              # absent → not grounded


def test_grounding_is_literal_so_goes_quiet_across_languages():
    # grounds_in is a literal substring match. Concept names are normalised to
    # English upstream (extract.py), but the anchor keeps the document's source
    # language — so for a non-English paper the prior fires for nothing and the
    # gate leans on the model's reading of the framing alone. Pin that documented
    # limitation here so it can't silently change into a half-broken match.
    cn_anchor = "TITLE: 一种全新的序列转换模型\n\n本文提出注意力机制，完全取代循环结构。"
    assert grounds_in(cn_anchor, "self-attention", "attention mechanism") is False


def test_grounding_on_empty_anchor_is_false():
    # Empty anchor (degenerate doc) → never grounded; the gate fail-opens elsewhere.
    assert grounds_in("", "anything") is False


def test_empty_input_yields_empty_anchor():
    assert thesis_anchor("") == ""
    assert thesis_anchor("   \n  ") == ""
