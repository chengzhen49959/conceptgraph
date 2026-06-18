"""LLM second-pass confirmation for concept merge/dedup (F4).

Only called when pgvector similarity already flags two concepts as candidates,
so the cost is bounded to genuine near-matches. Conservative by design: a false
"same" merges two distinct nodes, which is worse than a missed merge.
"""

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


class MergeDecision(BaseModel):
    same_concept: bool
    reason: str


_INSTRUCTIONS = """You decide whether two concepts from a knowledge base are THE
SAME underlying concept — synonyms, abbreviations, or rephrasings of one idea —
versus merely related or sibling concepts.

Be conservative: answer same_concept=true ONLY if a reader would collapse them
into a single node. Different-but-related (e.g. "neural network" vs "neuron") is
false. Give a one-sentence reason."""


async def confirm_same_concept(
    incoming_name: str,
    incoming_description: str | None,
    candidate_name: str,
    candidate_description: str | None,
) -> MergeDecision:
    """Confirm whether an incoming concept is the same as an existing candidate."""
    client = get_client()
    settings = get_settings()
    payload = (
        f"Concept A:\n  name: {incoming_name}\n"
        f"  description: {incoming_description or '(none)'}\n\n"
        f"Concept B:\n  name: {candidate_name}\n"
        f"  description: {candidate_description or '(none)'}"
    )
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.confirm_model,
            instructions=_INSTRUCTIONS,
            input=payload,
            text_format=MergeDecision,
            reasoning={"effort": "none"},
        )
    # Refusal / no parse → don't merge (safe default).
    return resp.output_parsed or MergeDecision(
        same_concept=False, reason="no decision returned"
    )


class MergedDescription(BaseModel):
    description: str


_MERGE_DESC_INSTRUCTIONS = """You maintain the canonical description of a concept
in a knowledge base. You receive the concept's name, its current canonical
description, and a new description of the same concept extracted from a different
source.

Return the single best canonical description: 2-4 sentences, general and
self-contained, written like a glossary entry, with no reference to any specific
source or document.

Rules:
- If the new description adds material information (a mechanism, purpose,
  distinction, or precision the current one lacks), integrate it.
- If it adds nothing material, return the current description verbatim.
- Never grow the description by concatenation; rewrite so it stays tight."""


async def merge_descriptions(name: str, current: str, incoming: str) -> str:
    """Fold an incoming description into the canonical one, returning a single
    tight glossary-style description. Refusal / no parse → keep `current`."""
    client = get_client()
    settings = get_settings()
    payload = (
        f"Concept: {name}\n\n"
        f"Current canonical description:\n{current}\n\n"
        f"New description from another source:\n{incoming}"
    )
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.confirm_model,
            instructions=_MERGE_DESC_INSTRUCTIONS,
            input=payload,
            text_format=MergedDescription,
            reasoning={"effort": "low"},
        )
    parsed = resp.output_parsed
    return parsed.description if parsed else current
