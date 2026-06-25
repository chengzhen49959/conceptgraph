"""Per-chunk concept + relation extraction (OpenAI structured output)."""

import re

from pydantic import BaseModel

from app.ai.client import LLM_SEMAPHORE, get_client
from app.config import get_settings


# Strict-schema-safe (every field required; optional = `T | None`; nesting ≤ 5).
class ExtractedConcept(BaseModel):
    name: str
    description: str  # required: a self-contained, glossary-style definition
    aliases: list[str]


class ExtractedRelation(BaseModel):
    source: str  # a concept name appearing in `concepts`
    target: str  # a concept name appearing in `concepts`
    relation: str  # short verb phrase, e.g. "is a kind of"


class ChunkExtraction(BaseModel):
    concepts: list[ExtractedConcept]
    relations: list[ExtractedRelation]
    summary: str  # 1-2 sentence summary of THIS passage; aggregated into a doc summary


_INSTRUCTIONS = """You extract knowledge from ONE passage of a document for a knowledge graph.

LANGUAGE — write EVERY `name`, `alias`, and `description` in English, whatever
language the passage is in. Translate every non-English term to its standard
English name (a passage in Chinese still yields English names such as
"self-attention"); if a term has no established English name, transliterate it
into the Latin alphabet. The output must contain no CJK or other non-English
characters.

CONCEPTS — every concept that passes the inclusion test below. Do NOT cap the
count; return as many as the passage substantively covers (a dense passage has
several, a thin one may have none). A core concept is a specific, nameable idea:
a method, mechanism, structure, principle, phenomenon, framework, or result
the passage introduces, explains, or builds on directly.

Include a concept only if ALL hold:
- An encyclopedia could have a focused article under exactly this name.
- It is NOT a whole field or umbrella term (wrong: "Machine Learning", "Linguistics").
- It is NOT a generic activity, property, or artifact (wrong: "Training",
  "Evaluation", "Dataset", "Optimization", "Cause").
- It is NOT a person. Never extract someone's name — the document's author, a
  cited theorist or researcher, a historical figure — as a concept; extract the
  idea, method, or framework they introduced instead, under its standard name
  (a passage by Darwin on evolution yields "natural selection", never "Darwin").
  The same applies to an organization cited only as a source.
- The passage substantively explains or uses it — not a passing mention.
- It is NOT a sentence, clause, claim, or question — only a noun-phrase term.

Prefer the most specific name the passage treats. Use the standard community
term as `name` (short noun phrase, singular, standard casing; spelled-out form
when an acronym also exists); put variants/abbreviations in `aliases`.

`description` (REQUIRED): 2-3 sentences defining the concept in general,
self-contained terms — what it is, how it works, what it is for. Write it like a
standalone glossary entry: never reference "this passage", "the document", or
"the author". The same concept seen in a different document must yield a nearly
identical description — this is what lets duplicates across documents merge.

RELATIONS — short verb-phrase predicates between two concepts, BOTH present in
`concepts` by their exact `name` (e.g. "is a kind of", "depends on", "is used
for"). Skip any relation whose endpoints aren't both in the concept list.

SUMMARY — also return `summary`: 1-2 sentences, in English, stating what THIS
passage is about (its topic and main point). It is aggregated with the other
passages' summaries into a single document summary, so keep it self-contained and
free of references like "this passage"."""

# The prompt aims for completeness, so this is only a runaway backstop, not a
# quality knob — a single passage realistically never has this many concepts.
_MAX_CONCEPTS = 40
_MAX_NAME_LEN = 60  # a concept name longer than this is almost certainly a clause
_SENTENCE_PUNCT = re.compile(r"[。！？!?…;；]|\.\.\.")
_PARENTHETICAL = re.compile(r"[（(][^）)]*[)）]")


def _clean_name(name: str) -> str | None:
    """Normalise an extracted name, or return None if it isn't a real concept.

    A code-level backstop for the model still slipping a sentence / question /
    fragment through: drop parentheticals and slash-examples, reject anything
    with sentence punctuation or that's too long to be a term.
    """
    n = _PARENTHETICAL.sub("", name).strip()
    n = n.split("/")[0].strip()  # keep the head term before an example slash
    if len(n) < 2 or len(n) > _MAX_NAME_LEN:  # single chars are never concepts
        return None
    if _SENTENCE_PUNCT.search(n):
        return None
    return n


def _clean(parsed: ChunkExtraction) -> ChunkExtraction:
    """Filter garbage names, cap the count, and re-point relations to kept names."""
    name_map: dict[str, str] = {}  # original name -> cleaned name (kept only)
    kept: dict[str, ExtractedConcept] = {}  # lower(name) -> concept
    for c in parsed.concepts:
        cleaned = _clean_name(c.name)
        if cleaned is None:
            continue
        name_map[c.name] = cleaned
        key = cleaned.lower()
        if key not in kept:
            if len(kept) >= _MAX_CONCEPTS:
                continue
            kept[key] = ExtractedConcept(
                name=cleaned,
                description=c.description,
                aliases=[a.strip() for a in c.aliases if a.strip()],
            )

    relations: list[ExtractedRelation] = []
    for r in parsed.relations:
        s = name_map.get(r.source)
        t = name_map.get(r.target)
        if s and t and s.lower() in kept and t.lower() in kept and s.lower() != t.lower():
            relations.append(ExtractedRelation(source=s, target=t, relation=r.relation))

    return ChunkExtraction(
        concepts=list(kept.values()), relations=relations, summary=parsed.summary
    )


async def extract_concepts(text: str) -> ChunkExtraction:
    """Extract concepts + relations from one chunk. Refusal → empty extraction."""
    client = get_client()
    settings = get_settings()
    async with LLM_SEMAPHORE:
        resp = await client.responses.parse(
            model=settings.extract_model,
            instructions=_INSTRUCTIONS,
            input=text,
            text_format=ChunkExtraction,
            reasoning={"effort": "low"},
        )
    return _clean(
        resp.output_parsed or ChunkExtraction(concepts=[], relations=[], summary="")
    )
