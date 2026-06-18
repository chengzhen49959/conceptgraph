"""Document parsing — PDF via PyMuPDF, Markdown/text decoded directly."""


def parse_document(data: bytes, source_type: str) -> str:
    """Extract plain text from raw document bytes.

    CPU-bound for PDFs — call via ``asyncio.to_thread`` from the async worker so
    it doesn't block the event loop.
    """
    if source_type == "pdf":
        import fitz  # PyMuPDF

        with fitz.open(stream=data, filetype="pdf") as doc:
            return "\n\n".join(page.get_text() for page in doc)
    # markdown | text — decode, replacing any undecodable bytes rather than failing.
    return data.decode("utf-8", errors="replace")
