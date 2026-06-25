"""Document-level summary — fold per-chunk summaries into one (spec S4 aggregator).

The extractor returns a short summary per chunk; this aggregates them into a
single document summary stored on `documents.summary`. Kept separate from
extraction so the aggregation is one cheap call per document, not per chunk.
"""

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


class DocumentSummary(BaseModel):
    summary: str


_INSTRUCTIONS = """You are given short summaries, each describing one passage of a
single document, in reading order. Write ONE concise summary of the whole
document — 3-5 sentences covering what it is about, its key ideas, and its
purpose. Write in English whatever language the inputs are in. Name the document's
actual subject; do not just stitch the passage summaries together."""


async def summarize_document(chunk_summaries: list[str]) -> str:
    """Fold per-chunk summaries into one document summary. Empty input → ""."""
    parts = [s.strip() for s in chunk_summaries if s and s.strip()]
    if not parts:
        return ""
    client = get_client()
    settings = get_settings()
    joined = "\n".join(f"- {s}" for s in parts)
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.label_model,
            instructions=_INSTRUCTIONS,
            input=joined,
            text_format=DocumentSummary,
            reasoning={"effort": "low"},
        )
    parsed = resp.output_parsed
    return parsed.summary.strip() if parsed else ""
