"""Document parsing — PDF via PyMuPDF4LLM (layout-aware Markdown), Markdown/text
decoded directly. PDFs are rendered one column at a time so a two-column page split
by a table keeps its reading order (see ``_pdf_to_markdown``). A paper's reference
list is stripped before it reaches the concept extractor, where it would otherwise
yield dozens of junk nodes, and the layout engine's figure/formula noise is stripped
so it pollutes neither the embeddings nor the reading view."""

import re
import unicodedata

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


# PyMuPDF4LLM's layout engine emits fixed markers for image boxes it renders as a
# placeholder rather than text — a figure/formula it dropped, or the OCR'd glyphs
# of a chart's axes and legend ("C omput e", "nu m ber of parameters"). These carry
# no signal and actively harm retrieval (OCR'd chart text injects junk concepts and
# degrades embeddings — cf. OHRBench). No extractor flag suppresses them: the layout
# path silently ignores `ignore_images`/`ignore_graphics` (legacy-path-only), so the
# markers are stripped here instead. Patterns match the exact strings emitted by
# `pymupdf4llm/helpers/document_layout.py` (picture placeholder + picture-text block).

# A figure/formula placeholder line, e.g. `**==> picture [612 x 80] intentionally
# omitted <==**`. Whole-line anchored; the leading `\**` tolerates the bold wrapper.
_PICTURE_PLACEHOLDER_RE = re.compile(
    r"^[ \t]*\**==> picture \[[^\]]*\] intentionally omitted <==\**[ \t]*$\n?",
    re.MULTILINE,
)

# A picture-text block: the Start marker through the End marker, inclusive — the
# OCR'd/embedded glyphs from inside an image box, wrapped in `<br>` (and, for the
# table-fallback variant, a `| | |` pseudo-table). DOTALL so it spans lines; the End
# marker is *required*, so an unterminated Start marker leaves the text intact rather
# than eating the rest of the document. `\**`/`(?:<br>)?` tolerate the bold/`<br>`
# wrappers of the Markdown variant and their absence in the plain-text variant.
_PICTURE_TEXT_BLOCK_RE = re.compile(
    r"\**-{5} Start of picture text -{5}\**(?:<br>)?"
    r".*?"
    r"\**-{5} End of picture text -{5}\**(?:<br>)?\n?",
    re.DOTALL,
)

# An HTML line break the extractor injects for an in-cell or in-line break, e.g. a
# multi-line table-header cell ("SQuAD<br>1.1<br>dev"). The reader renders Markdown
# WITHOUT raw HTML (no rehype-raw, by design — untrusted-safe), so a literal `<br>`
# shows as text rather than a break; for embeddings/extraction it is line noise.
# Collapsed to a space — table-safe (a newline would break the table row). This runs
# after the picture-text block strip, so it only touches `<br>` in genuine content
# (a rendered table cell), never the block markers (already gone).
_HTML_BREAK_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)

# A typesetter line-break hyphenation ("bidirec-\ntional"). Joins the halves;
# requires a letter before and a lowercase letter after, so it never touches an
# em-dash, a list dash, or a genuine trailing hyphen (a real compound like
# "fine-tuning" has no newline and is left alone).
_HYPHEN_BREAK_RE = re.compile(r"([A-Za-z])-\n[ \t]*([a-z])")

# A bare page-number line: nothing but 1–4 digits (the running page numbers the
# extractor emits inline between pages). Whole-line anchored, so a number inside
# prose is never matched.
_PAGE_NUMBER_RE = re.compile(r"^[ \t]*\d{1,4}[ \t]*$\n?", re.MULTILINE)

# 3+ consecutive newlines → one paragraph break. Marker/page-number removal leaves
# blank holes, and the chunker splits on blank lines, so stray runs would otherwise
# fragment paragraphs.
_BLANK_RUN_RE = re.compile(r"\n{3,}")


def _clean_extraction_noise(text: str) -> str:
    """Strip PyMuPDF4LLM layout-extraction noise from Markdown.

    Removes the figure/formula placeholders and OCR'd in-figure text blocks the
    layout engine emits (pure noise that pollutes embeddings and yields junk
    concepts), collapses the `<br>` HTML breaks it injects into table cells (which
    the raw-HTML-free reader would otherwise show literally), rejoins line-break
    hyphenation, drops bare page-number lines, and normalises Unicode (NFC) and
    blank-line runs. Conservative by construction:
    every pattern is whole-line- or marker-anchored, and the picture-text block
    requires its closing marker, so it only ever removes extraction artefacts —
    never substantive text. The result is clean Markdown, safe both to show the
    reader and to feed chunking/embedding/extraction.
    """
    text = unicodedata.normalize("NFC", text)
    text = _PICTURE_TEXT_BLOCK_RE.sub("", text)
    text = _PICTURE_PLACEHOLDER_RE.sub("", text)
    text = _HTML_BREAK_RE.sub(" ", text)
    text = _HYPHEN_BREAK_RE.sub(r"\1\2", text)
    text = _PAGE_NUMBER_RE.sub("", text)
    text = _BLANK_RUN_RE.sub("\n\n", text)
    return text.strip()


# Two detected column boxes whose x-ranges overlap by more than this (PDF points)
# belong to the same visual column — a column split vertically by a figure yields two
# boxes — so they are merged rather than treated as separate columns.
_BAND_MERGE_SLACK = 2.0


def _tile_columns(
    spans: list[tuple[float, float]], page_x0: float, page_x1: float
) -> list[tuple[float, float]]:
    """Reduce detected column x-spans to gap-free column boundaries, left to right.

    ``spans`` is the ``(x0, x1)`` x-range of each column box on a page. Overlapping
    spans merge into one column; the columns are then made to *tile* the page — outer
    edges snap to the page margins and each gutter splits at its midpoint — so every
    x-coordinate falls inside exactly one column. Tiling is what guarantees no text (a
    full-width footer, a word straddling the gutter) is lost when the page is rendered
    column by column: with gaps, anything in a gap would belong to no column and vanish.
    Returns the column ``(x0, x1)`` pairs, or ``[]`` when fewer than two columns are
    found, the signal to render the page whole rather than split it.
    """
    bands: list[list[float]] = []
    for x0, x1 in sorted(spans):
        if bands and x0 < bands[-1][1] - _BAND_MERGE_SLACK:
            bands[-1][1] = max(bands[-1][1], x1)  # overlaps the open column → same column
        else:
            bands.append([x0, x1])
    if len(bands) < 2:
        return []
    bands[0][0], bands[-1][1] = page_x0, page_x1
    for left, right in zip(bands, bands[1:]):
        midpoint = (left[1] + right[0]) / 2
        left[1] = right[0] = midpoint
    return [(x0, x1) for x0, x1 in bands]


def _column_clips(page) -> list:
    """Full-height cropbox rectangles, one per column, tiling ``page`` left to right —
    or ``[]`` if the page is single-column. Columns are detected with ``column_boxes``,
    the same primitive PyMuPDF4LLM uses internally; see ``_tile_columns`` for the tiling
    contract that keeps the clips gap-free."""
    import fitz
    from pymupdf4llm.helpers.multi_column import column_boxes

    rect = page.rect
    columns = _tile_columns(
        [(box.x0, box.x1) for box in column_boxes(page)], rect.x0, rect.x1
    )
    return [fitz.Rect(x0, rect.y0, x1, rect.y1) for x0, x1 in columns]


def _pdf_to_markdown(data: bytes) -> str:
    """Render a PDF to Markdown column by column so multi-column reading order survives.

    PyMuPDF4LLM globally sorts a page's text fragments by vertical position. On a
    two-column page split by a table this interleaves the columns — fragments from the
    left and right columns sort together by height, scrambling the reading order — and
    merges side-by-side tables into one garbled grid. Restricting the page to one column
    at a time (via its cropbox) leaves the engine nothing to interleave, so order and
    tables stay intact. Single-column pages (title page, full-width text) have no
    detected split and are rendered whole, byte-identical to the naive whole-document
    call. Costs one ``to_markdown`` pass per column rather than one per document, but
    parsing is offline (``asyncio.to_thread``), so the extra passes are affordable.
    """
    import fitz  # PyMuPDF
    import pymupdf4llm

    pages_md: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            clips = _column_clips(page)
            if not clips:
                pages_md.append(
                    pymupdf4llm.to_markdown(doc, pages=[page.number], show_progress=False)
                )
                continue
            full_box = fitz.Rect(page.rect)
            for clip in clips:
                page.set_cropbox(clip)
                pages_md.append(
                    pymupdf4llm.to_markdown(doc, pages=[page.number], show_progress=False)
                )
            page.set_cropbox(full_box)  # restore before the next page's column detection
    return "\n\n".join(pages_md)


def parse_document(data: bytes, source_type: str) -> str:
    """Extract text from raw document bytes.

    PDFs are rendered to Markdown with PyMuPDF4LLM — far cleaner extraction input than
    raw ``get_text()``, which interleaves columns and turns tables into noise — one
    column at a time so multi-column reading order survives (``_pdf_to_markdown``).
    CPU-bound — call via ``asyncio.to_thread`` from the async worker so it doesn't block
    the event loop.
    """
    if source_type == "pdf":
        markdown = _pdf_to_markdown(data)
        return _clean_extraction_noise(_strip_references(markdown))
    # markdown | text — decode, replacing any undecodable bytes rather than failing.
    text = data.decode("utf-8", errors="replace")
    # Markdown uploads are documents too; strip a trailing reference section. Plain
    # text is left intact (no reliable heading structure to anchor on).
    return _strip_references(text) if source_type == "markdown" else text
