"""Document-level core-concept selection — a reduce-pass salience gate.

Per-chunk extraction (app.ai.extract) sees only ONE passage at a time, so it
surfaces background, prior-work, and cited concepts as nodes alongside the
document's real subject. This pass runs once per document: it sees the whole
candidate set plus the document summary and returns only the concepts the
document substantively develops, so the pipeline persists a clean core-concept
set instead of every passing mention. Kept separate from extraction (one cheap
call per document) and from merge (it only decides *which* concepts this document
contributes — it never deletes concepts other documents own).
"""

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


class CandidateConcept(BaseModel):
    name: str
    description: str
    freq: int  # number of passages the concept appeared in — a hint, not a rule


# Strict-schema-safe (every field required) — see app/ai/extract.py.
class CoreSelection(BaseModel):
    core_indices: list[int]  # indices into the candidate list judged core


# Selection strictness lives entirely in this prompt's wording — tune here, not in
# the pipeline structure (a deep module: the caller just gets back the core set).
_INSTRUCTIONS = """You are given a DOCUMENT SUMMARY and a numbered list of CANDIDATE concepts that
were extracted passage-by-passage from that ONE document. Because the extractor
sees only one passage at a time, the list mixes the document's CORE concepts with
INCIDENTAL ones (background, prior work cited for comparison, datasets / metrics /
tools named in passing, minor configuration details).

Return the indices of the CORE concepts only — the concepts this document is
actually about: what it introduces, defines, develops, or directly builds on or
contrasts with as part of its own contribution.

KEEP a concept if the document substantively develops it, or it is a central part
of the document's own subject — even if it appears in only one passage.
DROP a concept if it is:
  - prior work or a competing system named only for comparison or citation,
  - a dataset, benchmark, metric, library, or tool mentioned only in passing,
  - a minor configuration or implementation detail not central to the contribution,
  - generic background a reader would not consider a topic OF THIS document.

Judge salience relative to THIS document's summary, not in the abstract. `freq`
(number of passages a concept appeared in) is a hint, not a rule: a high-freq
background term can still be incidental, a low-freq concept can be core. When
genuinely unsure, lean toward DROPPING — the goal is a clean core-concept set,
not recall."""


def _render(summary: str, candidates: list[CandidateConcept]) -> str:
    lines = [f"DOCUMENT SUMMARY:\n{summary or '(none)'}", "", "CANDIDATE CONCEPTS:"]
    lines += [
        f"[{i}] {c.name} (freq={c.freq}): {c.description}"
        for i, c in enumerate(candidates)
    ]
    return "\n".join(lines)


async def select_core_concepts(
    summary: str, candidates: list[CandidateConcept]
) -> set[str]:
    """Return the lowercased names of the concepts CORE to this document.

    The returned names match `candidate.name.strip().lower()`, the same key the
    worker resolves concepts by. Indices out of range are ignored. On refusal,
    empty output, or empty input, returns ALL candidate names (fail-open — never
    silently empty the graph).
    """
    if not candidates:
        return set()
    all_names = {c.name.strip().lower() for c in candidates}
    client = get_client()
    settings = get_settings()
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.select_core_model,
            instructions=_INSTRUCTIONS,
            input=_render(summary, candidates),
            text_format=CoreSelection,
            reasoning={"effort": "low"},
        )
    parsed = resp.output_parsed
    if not parsed or not parsed.core_indices:
        return all_names  # fail-open
    core = {
        candidates[i].name.strip().lower()
        for i in parsed.core_indices
        if 0 <= i < len(candidates)
    }
    return core or all_names  # fail-open if every index was out of range
