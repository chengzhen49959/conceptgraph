"""Document parsing — PDFs via PyMuPDF's text layer (``page.get_text``); Markdown/text
decoded directly. Text-layer extraction reads the glyphs the PDF already stores, with no
page rendering and no layout model, so memory stays flat where the old layout-aware
Markdown path (PyMuPDF4LLM) OOM-killed a small worker on long papers. The raw text loses
heading/table structure, which the worker restores with an LLM cleanup pass
(``app.ai.cleanup``). A paper's reference list is stripped before extraction reaches the
concept extractor, where it would otherwise yield dozens of junk concept nodes."""

import re
import unicodedata

# A line that is *only* a references/bibliography heading — optionally as a Markdown
# heading (`#`), bold (`**`), or numbered ("8 References"). Anchored to a whole line
# (`^…$`, MULTILINE) so the word inside a sentence never matches. Papers put this once, at
# the end, so the first hit is the end of substantive content.
_REFERENCES_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:\d+\.?\s*)?(?:references|bibliography|参考文献)\s*(?:\*\*)?\s*:?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


def _strip_references(text: str) -> str:
    """Drop everything from the first References/Bibliography heading onward.

    The reference list is bibliographic noise — feeding it to extraction produces a junk
    concept per cited title. If no such heading exists, returns the input unchanged: this
    only ever trims a recognised tail, never raises or over-cuts.
    """
    match = _REFERENCES_RE.search(text)
    return text[: match.start()].rstrip() if match else text


# A typesetter line-break hyphenation ("bidirec-\ntional"). Joins the halves; requires a
# letter before and a lowercase letter after, so it never touches an em-dash, a list dash,
# or a genuine trailing hyphen (a real compound like "fine-tuning" has no newline and is
# left alone).
_HYPHEN_BREAK_RE = re.compile(r"([A-Za-z])-\n[ \t]*([a-z])")

# A bare page-number line: nothing but 1–4 digits (the running page numbers between pages).
# Whole-line anchored, so a number inside prose is never matched.
_PAGE_NUMBER_RE = re.compile(r"^[ \t]*\d{1,4}[ \t]*$\n?", re.MULTILINE)

# 3+ consecutive newlines → one paragraph break. Reference/page-number removal leaves blank
# holes, and the chunker splits on blank lines, so stray runs would fragment paragraphs.
_BLANK_RUN_RE = re.compile(r"\n{3,}")


def _clean_extraction_noise(text: str) -> str:
    """Normalise text-layer extraction artefacts.

    Rejoins line-break hyphenation, drops bare running-page-number lines, normalises
    Unicode to NFC, and collapses blank-line runs (reference/page-number removal leaves
    holes the chunker would otherwise split on). Conservative by construction: every pattern
    is whole-line- or boundary-anchored, so it removes only extraction noise, never
    substantive text.
    """
    text = unicodedata.normalize("NFC", text)
    text = _HYPHEN_BREAK_RE.sub(r"\1\2", text)
    text = _PAGE_NUMBER_RE.sub("", text)
    text = _BLANK_RUN_RE.sub("\n\n", text)
    return text.strip()


def _pdf_to_text(data: bytes) -> str:
    """Extract a PDF's text layer page by page, in the PDF's native content order.

    ``page.get_text()`` returns the glyphs already stored in the page content stream — no
    rendering to a bitmap, no layout/table analysis — so memory stays flat regardless of
    page count (a 100-page paper holds only its accumulated text, not a rendered document,
    which is what let the old layout path exceed a 512MB worker). For LaTeX-produced papers
    (most of arXiv) the content stream is already in reading order, so columns come out
    correctly without explicit column detection; any residual disorder is repaired by the
    LLM cleanup pass downstream (``app.ai.cleanup``).
    """
    import fitz  # PyMuPDF

    pages: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            pages.append(page.get_text())
    return "\n\n".join(pages)


def parse_document(data: bytes, source_type: str) -> str:
    """Extract text from raw document bytes — the memory-light, LLM-free first stage.

    PDFs are read via the text layer (``_pdf_to_text``) and lightly de-noised; the worker
    then hands the result to ``app.ai.cleanup.clean_markdown`` for LLM reformatting into
    structured Markdown. Markdown and plain-text uploads are decoded directly. CPU-bound
    (text-layer decode), so the worker calls this via ``asyncio.to_thread`` to keep the
    event loop free.
    """
    if source_type == "pdf":
        text = _pdf_to_text(data)
        return _clean_extraction_noise(_strip_references(text))
    # markdown | text — decode, replacing any undecodable bytes rather than failing.
    text = data.decode("utf-8", errors="replace")
    # Markdown uploads are documents too; strip a trailing reference section. Plain text is
    # left intact (no reliable heading structure to anchor on).
    return _strip_references(text) if source_type == "markdown" else text
