"""Whole-document core concept + relation extraction (OpenAI structured output).

One pass per document returns only the concepts a paper is actually about, plus
typed relations from a fixed 6-verb vocabulary. Precision-first, built for "which
of my papers cover X" + a legible concept map (vs a high-recall per-chunk pass that
floods the graph with cited/background mentions).
"""

import re
from typing import Literal

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings

_MAX_NAME_LEN = 60  # a concept name longer than this is almost certainly a clause
_SENTENCE_PUNCT = re.compile(r"[。！？!?…;；]|\.\.\.")
_PARENTHETICAL = re.compile(r"[（(][^）)]*[)）]")


def _clean_name(name: str) -> str | None:
    """Normalise an extracted name, or return None if it isn't a real concept.

    A code-level backstop for the model still slipping a sentence / question /
    fragment through: drop parentheticals and slash-examples, reject anything with
    sentence punctuation or that's too long to be a term.
    """
    n = _PARENTHETICAL.sub("", name).strip()
    n = n.split("/")[0].strip()  # keep the head term before an example slash
    if len(n) < 2 or len(n) > _MAX_NAME_LEN:  # single chars are never concepts
        return None
    if _SENTENCE_PUNCT.search(n):
        return None
    return n


# A fixed, directed relation vocabulary — six verbs that cover ~90% of how research
# concepts relate, ordered by precedence so a pair asserted with two verbs collapses
# to the most informative one (lineage/contrast over scaffolding). Kept small on
# purpose: a 6-way choice the model makes consistently, where a dozen free-text
# predicates fragment (the duplicate-edge problem). See worker edge collapse and the
# (workspace, source, target, kind) edge key.
RELATION_TYPES = [
    "builds_on",  # source derived from / improves / extends target (newer -> prior)
    "contrasts_with",  # source is an alternative/competitor to target (SYMMETRIC)
    "applied_to",  # source (a method) addresses target (a task/domain)
    "uses",  # source depends on target as a component/mechanism
    "part_of",  # source is a component of target
    "is_a",  # source is a subtype/instance of target
]
RelationType = Literal[
    "builds_on", "contrasts_with", "applied_to", "uses", "part_of", "is_a"
]
SYMMETRIC_RELATIONS = {"contrasts_with"}


class CoreConcept(BaseModel):
    name: str
    description: str
    aliases: list[str]


class CoreRelation(BaseModel):
    source: str  # a concept name appearing in `concepts`
    target: str  # a concept name appearing in `concepts`
    type: RelationType


class CoreExtraction(BaseModel):
    concepts: list[CoreConcept]
    relations: list[CoreRelation]
    summary: str  # 1-2 sentence document summary (topic + main point)


_CORE_INSTRUCTIONS = """You build a research knowledge graph from ONE paper, for a student who later asks "which of my papers cover X" and "how do these ideas relate".

LANGUAGE — write every `name`, `alias`, `description`, and `summary` in English, translating any non-English term to its standard English name.

CONCEPTS — extract ONLY the CORE concepts the paper actually contributes or is centrally about: the ideas a one-paragraph abstract would name. EXCLUDE anything merely cited, used as background, named in related-work, or appearing once in passing — that is noise for this use case. Prefer 5-15 concepts; never more than 20. A concept is a specific, nameable method, mechanism, structure, principle, or result. NEVER a person, a whole field ("machine learning"), a generic activity ("training", "evaluation"), or a dataset/metric unless it is the paper's own contribution.

For each concept: the standard community `name` (short noun phrase, singular, standard casing; spelled-out form when an acronym exists), a 2-3 sentence self-contained glossary `description` (define it in general terms — never reference "this paper"/"the document"; the same concept in another paper must yield a nearly identical description so duplicates merge), and `aliases` (abbreviations/variants).

RELATIONS — only between two concepts BOTH in your `concepts` list, by their exact `name`. Use EXACTLY ONE of these six `type` values, and RESPECT DIRECTION (source -> target):
- builds_on: source is derived from / improves / extends target. source newer -> target prior. (RoBERTa builds_on BERT)
- contrasts_with: source is an alternative/competitor to target. SYMMETRIC — order doesn't matter. (self-attention contrasts_with recurrence)
- applied_to: source (a method) addresses target (a task/domain/problem). method -> task. (Transformer applied_to machine translation)
- uses: source depends on target as a component/mechanism. dependent -> dependency. (Transformer uses self-attention)
- part_of: source is a component of target. component -> whole. (encoder part_of Transformer)
- is_a: source is a subtype/instance of target. specific -> general. (self-attention is_a attention mechanism)

Emit only a relation the paper actually asserts; skip vague or incidental pairs. Direction matters — do not flip source and target.

SUMMARY — `summary`: 1-2 self-contained English sentences stating the paper's topic and main contribution."""


def _clean_core(parsed: CoreExtraction) -> CoreExtraction:
    """Filter garbage names (reusing the name guard), cap at 20 concepts, and drop
    relations whose endpoints aren't both kept (or are self-loops/duplicates)."""
    name_map: dict[str, str] = {}  # original -> cleaned (kept only)
    kept: dict[str, CoreConcept] = {}  # lower(name) -> concept
    for c in parsed.concepts:
        cleaned = _clean_name(c.name)
        if cleaned is None:
            continue
        name_map[c.name] = cleaned
        key = cleaned.lower()
        if key not in kept and len(kept) < 20:
            kept[key] = CoreConcept(
                name=cleaned,
                description=c.description,
                aliases=[a.strip() for a in c.aliases if a.strip()],
            )

    relations: list[CoreRelation] = []
    seen: set[tuple[str, str, str]] = set()
    for r in parsed.relations:
        s = name_map.get(r.source)
        t = name_map.get(r.target)
        if not (s and t) or s.lower() not in kept or t.lower() not in kept:
            continue
        if s.lower() == t.lower():
            continue
        sig = (s.lower(), t.lower(), r.type)
        if sig in seen:
            continue
        seen.add(sig)
        relations.append(CoreRelation(source=s, target=t, type=r.type))

    return CoreExtraction(
        concepts=list(kept.values()), relations=relations, summary=parsed.summary
    )


async def extract_core(text: str) -> CoreExtraction:
    """Extract a paper's CORE concepts + typed relations in ONE whole-document call.

    Precision-first: returns only what the paper is about, so it needs no separate
    core gate. Refusal / parse failure → empty extraction."""
    client = get_client()
    settings = get_settings()
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.extract_model,
            instructions=_CORE_INSTRUCTIONS,
            input=text,
            text_format=CoreExtraction,
            reasoning={"effort": "low"},
        )
    return _clean_core(
        resp.output_parsed or CoreExtraction(concepts=[], relations=[], summary="")
    )
