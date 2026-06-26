"""Document parsing — extraction-noise stripping + reference trimming.

`_clean_extraction_noise` removes the figure/formula markers PyMuPDF4LLM's layout
engine injects and the typesetter artefacts (line-break hyphenation, bare page
numbers) that survive PDF→Markdown, without touching substantive text. These tests
pin that contract on the exact marker strings the layout engine emits, plus the
safe-failure case (an unterminated block is left intact). All pure — no PDF, no LLM,
no DB — so they run with no environment.
"""

from app.services.parse import (
    _clean_extraction_noise,
    _strip_references,
    _tile_columns,
    parse_document,
)


def test_picture_placeholder_line_removed():
    out = _clean_extraction_noise(
        "Before the figure.\n\n"
        "**==> picture [612 x 80] intentionally omitted <==**\n\n"
        "After the figure."
    )
    assert "picture" not in out
    assert "intentionally omitted" not in out
    assert "Before the figure." in out
    assert "After the figure." in out


def test_picture_text_block_removed_markdown_variant():
    # The bold/`<br>` Markdown variant, with garbled OCR'd chart text inside.
    out = _clean_extraction_noise(
        "Real prose.\n\n"
        "**----- Start of picture text -----**<br>\n"
        "C omput e Dataset Size Parameters<br>"
        "Test Loss 10 10 nu m ber of parameters<br>"
        "**----- End of picture text -----**<br>\n\n"
        "More real prose."
    )
    assert "picture text" not in out
    assert "nu m ber" not in out  # the garble inside the block is gone
    assert "Real prose." in out
    assert "More real prose." in out


def test_picture_text_block_removed_table_fallback_variant():
    # The table-fallback variant wraps a `| | |` pseudo-table in the same markers.
    out = _clean_extraction_noise(
        "Lead in.\n\n"
        "**----- Start of picture text -----**<br>\n"
        "|||\n"
        "|---|---|\n"
        "|garbled|cells|\n"
        "\n**----- End of picture text -----**<br>\n\n"
        "Lead out."
    )
    assert "picture text" not in out
    assert "garbled" not in out
    assert "Lead in." in out
    assert "Lead out." in out


def test_unterminated_picture_block_is_left_intact():
    # No closing marker → the regex must not match and must not eat the rest of the
    # document. The Start marker line is preserved verbatim (safe failure).
    text = (
        "Keep this.\n\n"
        "**----- Start of picture text -----**<br>\n"
        "orphaned content that runs to the end of the document"
    )
    out = _clean_extraction_noise(text)
    assert "Keep this." in out
    assert "orphaned content that runs to the end" in out


def test_html_br_in_table_cells_collapsed_to_space_row_intact():
    # pymupdf4llm encodes in-cell line breaks as `<br>`; the reader has no rehype-raw
    # so they'd show literally. Collapse to a space without breaking the table row.
    out = _clean_extraction_noise(
        "| Model | SQuAD<br>1.1<br>dev | Accuracy<br/>on test |\n"
        "|---|---|---|\n"
        "| BERT<sub> | 84.1 | 90.9 |\n"
    )
    assert "<br>" not in out
    assert "<br/>" not in out
    assert "SQuAD 1.1 dev" in out
    assert "Accuracy on test" in out
    # The pipe structure of the header row is preserved (still a 3-column row).
    header = out.splitlines()[0]
    assert header.count("|") == 4


def test_line_break_hyphenation_joined_real_compound_preserved():
    out = _clean_extraction_noise("a model with bidirec-\ntional fine-tuning applied")
    assert "bidirectional" in out
    assert "fine-tuning" in out  # genuine compound (no line break) untouched


def test_bare_page_number_line_removed_number_in_prose_preserved():
    out = _clean_extraction_noise(
        "End of a page.\n\n3\n\nStart of the next page with 1024 tokens."
    )
    lines = out.splitlines()
    assert "3" not in lines  # the standalone page-number line is gone
    assert "1024" in out  # a number inside prose is untouched


def test_blank_line_runs_collapsed():
    out = _clean_extraction_noise("Para one.\n\n\n\n\nPara two.")
    assert out == "Para one.\n\nPara two."


def test_clean_is_idempotent_and_noop_on_clean_text():
    clean = "A heading\n\nA paragraph of ordinary text.\n\nAnother paragraph."
    assert _clean_extraction_noise(clean) == clean
    assert _clean_extraction_noise(_clean_extraction_noise(clean)) == clean


def test_strip_references_still_trims_tail():
    out = _strip_references("Body content.\n\n## References\n\n[1] Some cited work.")
    assert "Body content." in out
    assert "cited work" not in out


def test_non_pdf_text_passes_through_without_noise_cleaning():
    # The clean step is PDF-only; plain-text uploads are user-authored and left as is.
    raw = "user text with a-\nhyphen and a lone 7\n\nand markers ----- Start of x"
    assert parse_document(raw.encode("utf-8"), "text") == raw


# --- column tiling (multi-column reading order) -----------------------------------
# `_tile_columns` turns the detected column x-spans of a page into gap-free column
# boundaries; the page is then rendered one column at a time so a two-column layout
# split by a table keeps its reading order instead of interleaving by height.


def test_single_column_is_not_split():
    # One detected span (or none) → render the page whole, never split it.
    assert _tile_columns([(72, 520)], 0, 595) == []
    assert _tile_columns([], 0, 595) == []


def test_two_columns_snap_to_edges_and_split_gutter_at_midpoint():
    # The two columns of a typical A4 paper. Outer edges snap to the page margins; the
    # gutter (291..307) splits at its midpoint (299), so the bands tile [0, 595].
    bands = _tile_columns([(72, 291), (307, 526)], 0, 595)
    assert bands == [(0, 299), (299, 595)]


def test_tiling_leaves_no_gaps_or_overlaps():
    # Every band's right edge is the next band's left edge, and the bands cover the
    # whole page — the property that guarantees no text is dropped between columns.
    bands = _tile_columns([(72, 291), (307, 526)], 0, 595)
    assert bands[0][0] == 0 and bands[-1][1] == 595
    for left, right in zip(bands, bands[1:]):
        assert left[1] == right[0]


def test_overlapping_spans_merge_into_one_column():
    # A column cut in two by a figure yields two overlapping boxes; they must merge into
    # one column, not be mistaken for two columns of a multi-column layout.
    assert _tile_columns([(72, 291), (80, 285)], 0, 595) == []


def test_three_columns_each_gutter_splits_independently():
    bands = _tile_columns([(40, 190), (220, 370), (400, 550)], 0, 595)
    assert bands == [(0, 205), (205, 385), (385, 595)]
