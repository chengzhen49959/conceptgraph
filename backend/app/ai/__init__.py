"""AI adapter — all OpenAI usage (embeddings + structured LLM calls)."""

from app.ai.embeddings import embed_text, embed_texts
from app.ai.extract import (
    RELATION_TYPES,
    SYMMETRIC_RELATIONS,
    CoreConcept,
    CoreExtraction,
    CoreRelation,
    extract_core,
)
from app.ai.labels import label_cluster
from app.ai.merge import (
    MatchResult,
    MergeDecision,
    confirm_same_concept,
    match_concept,
    merge_descriptions,
)

__all__ = [
    "embed_text",
    "embed_texts",
    "extract_core",
    "CoreExtraction",
    "CoreConcept",
    "CoreRelation",
    "RELATION_TYPES",
    "SYMMETRIC_RELATIONS",
    "confirm_same_concept",
    "match_concept",
    "MatchResult",
    "merge_descriptions",
    "MergeDecision",
    "label_cluster",
]
