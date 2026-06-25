"""Thesis anchor — the document's own framing, for the core-concept gate.

Per-chunk extraction is blind to the whole document, so the reduce-pass gate
(`app.ai.select_core`) needs an authoritative statement of what the document is
ABOUT to judge each candidate's centrality against. The authors already wrote
that statement: the title + abstract + introduction at the front and the
conclusion at the back. This module returns that thesis-bearing region.

Why centrality is judged here and not from the document summary: the summary
(`app.ai.summarize`) folds together every passage, so it reflects incidental
machinery — an optimizer, a normalization trick — as if it were the subject. The
authors' framing does not; it names only what the work contributes. Anchoring the
gate on the framing instead of the summary is what keeps "uses dropout" from
reading as "is about dropout".

It does NOT parse the document into sections — heading detection on arbitrary
PDF-to-Markdown output is unreliable. It slices POSITIONALLY: a front window
holds the title/abstract/intro, a tail window holds the conclusion (the reference
list is stripped upstream in `services.parse`, so the tail is substantive text,
not bibliography). A fixed-size slice has no failure mode that a heading regex
does — it always returns SOME anchor, even for a document with no detectable
structure.
"""

# Window sizes in characters (≈4 chars/token → ~1500 tokens each). The front
# reliably spans title + abstract + the start of the introduction; the tail spans
# the conclusion. Kept as module constants, not config: a fixed sensible default
# beats a knob no operator would tune (and beats a config import this otherwise
# pure, trivially testable function would carry). Override via the params in tests.
_FRONT_CHARS = 6000
_TAIL_CHARS = 4000

# Marks the elided middle between the two windows, so the gate model reads the
# front and tail as one document with a gap rather than two abutting fragments.
_GAP = "\n\n[...]\n\n"


def thesis_anchor(
    text: str, title: str = "", front: int = _FRONT_CHARS, tail: int = _TAIL_CHARS
) -> str:
    """Return the document's thesis-bearing text: the title, the opening (abstract +
    introduction) and the conclusion, as one string.

    The `title` is prepended verbatim — it is the single strongest, always-present
    statement of subject (a web clip has no abstract but always has a title), and
    folding it in here means `grounds_in` covers a concept named in the title for
    free. A document body shorter than the two windows combined is kept whole —
    there is nothing to elide. Never raises; empty input yields an empty anchor, on
    which the gate fail-opens (keeps every candidate) rather than emptying the graph.
    """
    body = text.strip()
    head = f"TITLE: {title.strip()}\n\n" if title.strip() else ""
    if len(body) <= front + tail:
        return (head + body).rstrip()
    return head + body[:front].rstrip() + _GAP + body[-tail:].lstrip()


def grounds_in(anchor: str, *surface_forms: str) -> bool:
    """Whether any of a concept's surface forms (its canonical name or an alias)
    appears in the thesis anchor — a strong, cheap prior that the concept is core,
    since the authors named it in their own framing.

    Case-insensitive substring match. Best-effort by design: it silently returns
    False when the anchor and the names are in different languages (concept names
    are normalised to English, the anchor stays in the source language), in which
    case the gate simply falls back to the model's reading of the framing text.
    The result is a *hint* the gate weighs, never a rule, so an occasional loose
    substring match (e.g. "encoder" inside "encoder-decoder") is harmless.
    """
    if not anchor:
        return False
    hay = anchor.lower()
    return any(sf and sf.strip().lower() in hay for sf in surface_forms)
