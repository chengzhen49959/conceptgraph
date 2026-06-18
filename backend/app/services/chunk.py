"""Chunking — structure-aware paragraph packing into token windows, with a
content hash per chunk for idempotent re-ingestion."""

import hashlib
import re
from dataclasses import dataclass
from functools import lru_cache


@dataclass
class ChunkData:
    content: str
    content_hash: str  # sha256 of content


@lru_cache
def _encoder():
    import tiktoken

    # Model-agnostic tokenizer: we only need approximate token counts to size
    # chunks, not exact alignment with the extraction model.
    return tiktoken.get_encoding("cl100k_base")


def chunk_text(text: str, max_tokens: int = 512, overlap: int = 64) -> list[ChunkData]:
    """Split text into ≤max_tokens chunks, packing whole paragraphs where they
    fit and hard-splitting any paragraph that's too large."""
    enc = _encoder()
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]

    raw_chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = len(enc.encode(para))
        if para_tokens > max_tokens:
            # Flush the buffer, then window-split the oversized paragraph.
            if current:
                raw_chunks.append("\n\n".join(current))
                current, current_tokens = [], 0
            tokens = enc.encode(para)
            step = max(1, max_tokens - overlap)
            for i in range(0, len(tokens), step):
                raw_chunks.append(enc.decode(tokens[i : i + max_tokens]))
            continue
        if current_tokens + para_tokens > max_tokens and current:
            raw_chunks.append("\n\n".join(current))
            current, current_tokens = [], 0
        current.append(para)
        current_tokens += para_tokens

    if current:
        raw_chunks.append("\n\n".join(current))

    # Dedup identical chunks; the hash also keys idempotent inserts.
    out: list[ChunkData] = []
    seen: set[str] = set()
    for content in raw_chunks:
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        if digest in seen:
            continue
        seen.add(digest)
        out.append(ChunkData(content=content, content_hash=digest))
    return out
