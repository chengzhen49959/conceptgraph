"""Document-level core-concept selection — a reduce-pass salience gate.

Per-chunk extraction (app.ai.extract) sees only ONE passage at a time, so it
surfaces background, prior-work, and cited concepts as nodes alongside the
document's real subject. This pass runs once per document: it sees the whole
candidate set plus the document's own FRAMING (its title + abstract + intro +
conclusion — see `app.services.thesis`) and returns only the concepts the
document substantively develops, so the pipeline persists a clean core-concept
set instead of every passing mention.

Centrality is a GLOBAL property — a candidate looks core or incidental only
against what the whole document contributes — so it is decided here, in one
document-wide call, never per chunk (a chunk cannot know an optimizer it describes
is incidental to a paper it never sees). The framing, not the aggregate summary,
is the arbiter: the summary stitches every passage together and so reflects
incidental machinery as if it were the subject, while the authors' framing names
only the contribution. Kept separate from extraction (one cheap call per document)
and from merge (it only decides *which* concepts this document contributes — it
never deletes concepts other documents own).
"""

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


class CandidateConcept(BaseModel):
    name: str
    description: str
    freq: int  # number of passages the concept appeared in — a weak hint
    grounded: bool = False  # named in the document's framing — a strong core prior


# Strict-schema-safe (every field required) — see app/ai/extract.py.
class CoreSelection(BaseModel):
    core_indices: list[int]  # indices into the candidate list judged core


# Selection strictness lives entirely in this prompt's wording — tune here, not in
# the pipeline structure (a deep module: the caller just gets back the core set).
_INSTRUCTIONS = """You decide which concepts a single document is genuinely ABOUT — its core
contribution — versus concepts it merely mentions, cites, uses as a tool, or
gives as background.

You are given the DOCUMENT FRAMING: the authors' own words from the front of the
document (title, abstract, introduction) and its conclusion. This is the
authoritative statement of what the document contributes — judge centrality
against it, not against how often a concept happens to appear.

You are also given a numbered list of CANDIDATE concepts, extracted passage by
passage. Because the extractor sees one passage at a time, the list mixes the
document's CORE concepts with INCIDENTAL ones: prior work cited for comparison, a
competing system, datasets / benchmarks / metrics / libraries / tools named in
passing, and standard machinery (optimizers, normalization, regularization tricks)
the document uses but does not study.

Return the indices of the CORE concepts only, ORDERED most central first.

THE TEST is ABOUTNESS, not dependence. KEEP a concept only if the document is
genuinely ABOUT it: it introduces, proposes, defines, develops, or makes it a
primary object of study — or directly builds on or contrasts with it as part of
its own argument (engaged prior work the document sets out to extend or replace
counts as ABOUT). DROP a concept the document only USES, assumes, cites, reports
as a baseline or result, or names in passing — even when the work depends on it.
A paper depends on an optimizer, a normalization layer, or an evaluation metric
without being about them. Do NOT ask "would the document still work without this
concept" — a paper's own core mechanisms are each individually removable, so that
question wrongly drops them; ask only "is the document about this concept".

SIGNALS (weigh them, do not obey them):
- A candidate marked [in-framing] was named by the authors in their own abstract,
  introduction, or conclusion — a STRONG sign it is core.
- The ABSENCE of [in-framing] means nothing on its own: the match is literal, so
  it misses paraphrases and any framing not in English. Judge an un-tagged
  candidate on the framing text; if NOTHING is tagged, ignore this signal entirely.
- `freq` (how many passages mentioned it) is a WEAK hint: a high-freq tool can
  still be incidental; a low-freq concept named in the framing can be core.

When genuinely unsure, DROP. A false core tag pollutes every later query against
this document; a missed one does not. Favour precision over recall."""


def _render(anchor: str, candidates: list[CandidateConcept]) -> str:
    lines = [
        "DOCUMENT FRAMING (authors' own words — title, abstract, introduction, conclusion):",
        anchor or "(none)",
        "",
        "CANDIDATE CONCEPTS:",
    ]
    lines += [
        f"[{i}] {c.name} (freq={c.freq}){' [in-framing]' if c.grounded else ''}: {c.description}"
        for i, c in enumerate(candidates)
    ]
    return "\n".join(lines)


async def select_core_concepts(
    anchor: str, candidates: list[CandidateConcept]
) -> set[str]:
    """Return the lowercased names of the concepts CORE to this document.

    `anchor` is the document's framing (`app.services.thesis.thesis_anchor`) — the
    text centrality is judged against. The returned names match
    `candidate.name.strip().lower()`, the same key the worker resolves concepts by.
    Indices out of range are ignored. On refusal, empty output, or empty input,
    returns ALL candidate names (fail-open — never silently empty the graph).
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
            input=_render(anchor, candidates),
            text_format=CoreSelection,
            # The precision gate for the whole graph — one call per document, so the
            # extra reasoning is cheap where a wrong keep/drop is permanent.
            reasoning={"effort": "medium"},
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
