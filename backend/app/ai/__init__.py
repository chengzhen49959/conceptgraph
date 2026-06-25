"""AI adapter — all OpenAI usage (embeddings + structured LLM calls)."""

from app.ai.embeddings import embed_text, embed_texts
from app.ai.extract import (
    ChunkExtraction,
    ExtractedConcept,
    ExtractedRelation,
    extract_concepts,
)
from app.ai.labels import label_cluster
from app.ai.merge import (
    MatchResult,
    MergeDecision,
    confirm_same_concept,
    match_concept,
    merge_descriptions,
)
from app.ai.select_core import (
    CandidateConcept,
    CoreSelection,
    select_core_concepts,
)
from app.ai.summarize import summarize_document

__all__ = [
    "embed_text",
    "embed_texts",
    "extract_concepts",
    "ChunkExtraction",
    "ExtractedConcept",
    "ExtractedRelation",
    "confirm_same_concept",
    "match_concept",
    "MatchResult",
    "merge_descriptions",
    "MergeDecision",
    "label_cluster",
    "select_core_concepts",
    "CandidateConcept",
    "CoreSelection",
    "summarize_document",
]
