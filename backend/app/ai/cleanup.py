"""LLM reformatting of raw PDF text into clean Markdown.

The parser extracts a PDF's text layer cheaply (``app.services.parse``) to keep the worker
within its memory limit, which trades away the heading/table structure the heavier layout
path produced. This pass hands that raw text to a small model to restore Markdown structure
— fix reading order, rejoin broken lines, mark headings, rebuild tables — WITHOUT changing
wording, so the stored text stays faithful for embeddings and citation. Best-effort by
construction: any chunk the model fails, refuses, or appears to truncate falls back to its
raw text, so cleanup never loses content and never raises.
"""

import asyncio

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings

# Pack paragraphs into chunks no larger than this many characters before sending each to the
# model. Char-based, NOT token-based, on purpose: the token encoder (tiktoken) downloads its
# vocab on first use and has frozen the worker behind the GFW, and this stage needs no exact
# token count. ~12k chars ≈ 3k tokens, well under the model's output ceiling so one chunk's
# cleaned form can't be truncated.
_CHUNK_CHARS = 12000

# A cleaned chunk shorter than this fraction of its input almost certainly means the model
# summarised, refused, or was cut off — fall back to the raw chunk rather than store a lossy
# result. Reformatting only adds Markdown punctuation, so output length ≈ input length.
_MIN_KEEP_RATIO = 0.6

# Output budget per chunk. ~12k input chars ≈ 3k tokens in, cleaned output is similar, so
# this leaves generous headroom (plus the small reasoning budget at effort="low").
_MAX_OUTPUT_TOKENS = 12000

_INSTRUCTIONS = """You are a PDF-to-Markdown cleanup pass. You are given raw text extracted \
from one slice of an academic PDF. Re-emit the SAME text as clean GitHub-flavored Markdown.

Rules:
- Reproduce every sentence verbatim. Do NOT summarise, paraphrase, translate, add, or omit \
any content. This is reformatting, not editing.
- Put fragments back into natural reading order if the extraction interleaved columns.
- Rejoin words split across lines by hyphenation; merge lines that belong to one paragraph.
- Mark section headings with `#`/`##`, lists with `-`, and reconstruct a Markdown table when \
the text clearly came from one.
- Drop pure extraction noise: stray page numbers, running headers/footers, figure-glyph \
garble. When unsure whether something is content, KEEP it.

Output only the Markdown — no preamble and no code fence around the whole document."""


def _split(text: str) -> list[str]:
    """Greedily pack paragraphs into ``_CHUNK_CHARS``-bounded chunks on blank-line
    boundaries, so a chunk never splits mid-paragraph (which would strand a heading or a
    table row from its body). A single paragraph longer than the bound becomes its own
    (oversized) chunk rather than being cut mid-sentence."""
    chunks: list[str] = []
    current = ""
    for para in text.split("\n\n"):
        if current and len(current) + len(para) + 2 > _CHUNK_CHARS:
            chunks.append(current)
            current = para
        else:
            current = f"{current}\n\n{para}" if current else para
    if current:
        chunks.append(current)
    return chunks


async def _clean_chunk(raw: str) -> str:
    """Reformat one chunk; return the raw chunk unchanged on any failure or a suspiciously
    short (likely truncated/summarised) result."""
    client = get_client()
    settings = get_settings()
    try:
        async with LLM_SEMAPHORE:
            resp = await client.responses.create(
                model=settings.parse_clean_model,
                instructions=_INSTRUCTIONS,
                input=raw,
                reasoning={"effort": "low"},
                max_output_tokens=_MAX_OUTPUT_TOKENS,
            )
        out = (resp.output_text or "").strip()
    except Exception:
        return raw
    return out if len(out) >= len(raw) * _MIN_KEEP_RATIO else raw


async def clean_markdown(text: str) -> str:
    """Reformat raw extracted PDF text into clean Markdown, chunk by chunk in parallel.

    Returns the input unchanged if it is empty. Each chunk independently falls back to its
    raw form on failure, so the result always carries the full document — at worst it is the
    unmodified extraction. Concurrency is bounded by ``ai.client.LLM_SEMAPHORE`` (shared with
    the rest of the pipeline's model calls).
    """
    if not text.strip():
        return text
    cleaned = await asyncio.gather(*(_clean_chunk(chunk) for chunk in _split(text)))
    return "\n\n".join(cleaned)
