"""Document parsing — PDF via PyMuPDF4LLM (layout-aware Markdown), Markdown/text
decoded directly. A paper's reference list is stripped before it reaches the
concept extractor, where it would otherwise yield dozens of junk nodes."""

import re

# A line that is *only* a references/bibliography heading — optionally as a
# Markdown heading (`#`), bold (`**`), or numbered ("8 References"). Anchored to a
# whole line (`^…$`, MULTILINE) so the word inside a sentence never matches. Papers
# put this once, at the end, so the first hit is the end of substantive content.
_REFERENCES_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:\d+\.?\s*)?(?:references|bibliography|参考文献)\s*(?:\*\*)?\s*:?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


def _strip_references(text: str) -> str:
    """Drop everything from the first References/Bibliography heading onward.

    The reference list is bibliographic noise — feeding it to extraction produces a
    junk concept per cited title. If no such heading exists, returns the input
    unchanged: this only ever trims a recognised tail, never raises or over-cuts.
    """
    match = _REFERENCES_RE.search(text)
    return text[: match.start()].rstrip() if match else text


def parse_document(data: bytes, source_type: str) -> str:
    """Extract text from raw document bytes.

    PDFs are rendered to Markdown with PyMuPDF4LLM, which reconstructs reading order
    for multi-column layouts (academic papers are two-column) and emits structural
    headings/tables — far cleaner extraction input than raw ``get_text()``, which
    interleaves columns and turns tables into noise. CPU-bound — call via
    ``asyncio.to_thread`` from the async worker so it doesn't block the event loop.
    """
    if source_type == "pdf":
        import fitz  # PyMuPDF
        import pymupdf4llm

        with fitz.open(stream=data, filetype="pdf") as doc:
            markdown = pymupdf4llm.to_markdown(doc, show_progress=False)
        return _strip_references(markdown)
    # markdown | text — decode, replacing any undecodable bytes rather than failing.
    text = data.decode("utf-8", errors="replace")
    # Markdown uploads are documents too; strip a trailing reference section. Plain
    # text is left intact (no reliable heading structure to anchor on).
    return _strip_references(text) if source_type == "markdown" else text
