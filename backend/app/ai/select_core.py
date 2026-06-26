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

import re

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


# A survey/review's contribution is to MAP a whole area, so its core is broader
# than a single method: the aboutness test (tuned for "what is THE contribution")
# is too strict and drops the flagship sub-areas the survey is actually organised
# around. This addendum is APPENDED to the base prompt for those documents only —
# the contribution-paper prompt above is left byte-for-byte unchanged, so a
# survey-detector false positive is the only way this can touch a normal paper
# (and its downside is a slightly looser keep, never the reverse).
_SURVEY_ADDENDUM = """

THIS DOCUMENT IS A SURVEY / REVIEW, AND THE INSTRUCTIONS ABOVE NOW CHANGE FOR IT.
A survey has no single contribution; its job is to MAP a whole field, so its core
is the WHOLE SET of named ideas it catalogs. Override the precision-lean above:
for this document, when in doubt KEEP. Recall of the field's substance is the goal.

Do NOT collapse to the survey's top-level section titles. Those few umbrella
headings (e.g. its "pre-training", "adaptation", "utilization", "evaluation"
chapters) are the SHALLOWEST possible answer and miss the point. Go one level
deeper: the survey's real content is the specific, named things it surveys WITHIN
those chapters — each named method, model family, learning paradigm, training or
tuning technique, prompting/reasoning strategy, scaling relationship, alignment
approach, capability, and emergent phenomenon it describes and compares. EVERY such
named concept is core to a survey, even when it lives inside a broader section and
even when it is attributed to other work.

Calibrate the COUNT accordingly: a comprehensive survey legitimately has MANY core
concepts — typically several dozen. If you have kept only a handful, you have
stopped at the section headings; go back and include the named sub-topics.

Still DROP genuine incidentals, exactly as before: specific datasets, benchmarks,
metrics, leaderboards, libraries, software tools, hardware, and one-off cited
systems named only as a passing example. The test for a survey is "does the survey
substantively describe or compare this as part of its map of the field" — broadened
from "is this THE contribution", but a true name-drop is still a drop."""

# Cheap, deterministic survey/review/position detection from the document's own
# framing (no extra LLM call). The title — prepended verbatim by `thesis_anchor`
# as the first "TITLE: ..." line — is the strongest, near-zero-false-positive
# signal; an explicit self-description in the abstract opening is the backup.
_SURVEY_TITLE_RE = re.compile(r"\b(survey|review|overview|taxonomy)\b", re.I)
# Strict self-identification only — a survey calls ITSELF one. The detector must
# bias HARD to precision: a false positive loosens a contribution paper's gate
# (the one regression that matters), while a false negative merely keeps the base
# precision-first behaviour. So this matches only phrasings a contribution paper
# essentially never uses: "in this survey/review/overview" (self-naming, never said
# of a related-work section) and "we present/provide a survey" (the NOUN survey
# only — "review"/"overview" are too polysemous: "we give a review of baselines",
# "this paper reviews and proposes" are contribution-paper phrasings, not surveys).
_SURVEY_BODY_RE = re.compile(
    r"\bin\s+this\s+(?:survey|review|overview)\b"
    r"|\bwe\s+(?:present|provide|conduct|offer)\s+(?:a|an)\s+(?:comprehensive\s+|systematic\s+|brief\s+)?survey\b",
    re.I,
)


def _is_survey(anchor: str) -> bool:
    """Whether the document framing reads as a survey/review/overview.

    Title-first: a `survey`/`review`/`overview`/`taxonomy` in the title is a near-
    certain signal and almost never appears in a contribution paper's title. Falls
    back to an explicit "in this survey we review …" self-description in the
    abstract. A false positive only loosens one document's gate slightly; a false
    negative just leaves the base (precision-first) behaviour — both fail safe.
    """
    if not anchor:
        return False
    first_line = anchor.splitlines()[0] if anchor else ""
    if first_line.upper().startswith("TITLE:") and _SURVEY_TITLE_RE.search(first_line):
        return True
    return bool(_SURVEY_BODY_RE.search(anchor[:1500]))


# The shared client's per-request timeout (45s, app/ai/client.py) is tuned for the
# small, fast PER-CHUNK extraction calls — a stalled one should fail fast. The gate
# is a different kind of call: ONE per document over EVERY candidate, so a large
# document (a 600k-char survey yields thousands of candidates) legitimately reasons
# for minutes. Under the shared 45s it times out, burns all retries, and fails the
# whole document at the gate. This call therefore overrides the timeout to a value
# matched to its real cost — still far under the worker's 1800s job ceiling, and one
# retry rides out a transient blip without re-paying a full long timeout many times.
_GATE_TIMEOUT = 300.0
_GATE_RETRIES = 1


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
    # A survey's core is a whole area, not one method — widen the aboutness test for
    # it (the base prompt is left intact for contribution papers, see _SURVEY_ADDENDUM).
    instructions = _INSTRUCTIONS + (_SURVEY_ADDENDUM if _is_survey(anchor) else "")
    client = get_client()
    settings = get_settings()
    async with LLM_SEMAPHORE:
        resp = await client.with_options(
            timeout=_GATE_TIMEOUT, max_retries=_GATE_RETRIES
        ).responses.parse(
            model=settings.select_core_model,
            instructions=instructions,
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
