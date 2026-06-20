"""LLM cluster labelling for F9 (topic naming)."""

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


class ClusterLabel(BaseModel):
    label: str


_INSTRUCTIONS = """Given concept names that form one topic cluster, return a
short human-readable label (2-4 words) that names the shared topic.

Write the label in English, in Title Case, whatever language the concept names
are in; translate any non-English names. Name the shared topic — do not just
concatenate two of the concept names.
No surrounding quotes and no trailing punctuation."""

_MAX_NAMES = 40  # enough signal to label; keeps the prompt small


async def label_cluster(concept_names: list[str]) -> str:
    """Return a topic label for a cluster. Falls back to 'Unlabeled' on refusal."""
    if not concept_names:
        return "Unlabeled"
    client = get_client()
    settings = get_settings()
    sample = ", ".join(concept_names[:_MAX_NAMES])
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.label_model,
            instructions=_INSTRUCTIONS,
            input=f"Concepts: {sample}",
            text_format=ClusterLabel,
        )
    parsed = resp.output_parsed
    return parsed.label if parsed else "Unlabeled"
