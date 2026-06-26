"""`sweep_orphan_concepts` — the single guardian of the graph invariant
"an extracted concept exists only while some document mentions it".

The real WHERE semantics are exercised end-to-end against Postgres (the ingest
e2e), not here. What this pins down is the part a refactor could silently break:
the concept sweep must stay scoped to ``origin='extracted'`` AND a not-mentioned
predicate — drop either and it would reap user-drawn manual nodes (which stand
alone by design) or fresh concepts mid-ingest. We assert it by compiling the
statements the helper hands to `execute` and inspecting their SQL.
"""

import asyncio
import uuid

from app.services.concepts import sweep_orphan_concepts


class _Result:
    rowcount = 3  # concepts swept; the helper returns this


class _CapturingSession:
    """Records every statement passed to `execute`; returns a rowcount result."""

    def __init__(self):
        self.statements: list[str] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return False

    async def execute(self, stmt, *_a, **_k):
        self.statements.append(str(stmt))
        return _Result()


def test_sweep_scopes_to_extracted_unmentioned_concepts_then_empty_clusters():
    session = _CapturingSession()
    swept = asyncio.run(sweep_orphan_concepts(session, uuid.uuid4()))

    # Returns the concept delete's rowcount.
    assert swept == 3

    # Two deletes: concepts first, then emptied clusters.
    assert len(session.statements) == 2
    concept_delete, cluster_delete = session.statements

    assert concept_delete.startswith("DELETE FROM concepts")
    # Manual nodes are exempt — the extracted filter MUST be present.
    assert "concepts.origin" in concept_delete
    # Mentioned concepts are spared — the not-exists mention predicate MUST be present.
    assert "NOT (EXISTS" in concept_delete and "concept_mentions" in concept_delete
    # Scoped to one workspace, never global.
    assert "concepts.workspace_id" in concept_delete

    assert cluster_delete.startswith("DELETE FROM clusters")
    assert "clusters.workspace_id" in cluster_delete
