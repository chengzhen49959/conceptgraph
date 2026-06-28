"""`sweep_orphan_concepts` — the single guardian of the graph invariant
"an extracted concept exists only while some document mentions it".

The real WHERE semantics are exercised end-to-end against Postgres (the ingest
e2e), not here. What this pins down is the part a refactor could silently break:

1. The concept sweep must stay scoped to ``origin='extracted'`` AND a not-mentioned
   predicate — drop either and it would reap user-drawn manual nodes (which stand
   alone by design) or fresh concepts mid-ingest.
2. The emptied-cluster cleanup must require BOTH "no concept" AND "no child
   cluster". A parent cluster never carries concepts directly (it groups leaves via
   ``parent_id``), so a concept-only check matches every parent and — because
   ``parent_id`` is ON DELETE CASCADE — wipes its still-populated leaves, NULL-ing
   out other documents' topics workspace-wide. The ``parent_id`` guard is what
   prevents that cascade; its absence is the regression.

We assert both by compiling the statements the helper hands to `execute` and
inspecting their SQL.
"""

import asyncio
import uuid

from app.services.concepts import sweep_orphan_concepts


class _Result:
    def __init__(self, rowcount: int):
        self.rowcount = rowcount


class _CapturingSession:
    """Records every statement passed to `execute`. The concept delete reports 3
    rows swept (the helper's return value); the cluster delete reports 0 so the
    empty-cluster fixpoint loop settles after a single pass."""

    def __init__(self):
        self.statements: list[str] = []

    async def execute(self, stmt, *_a, **_k):
        sql = str(stmt)
        self.statements.append(sql)
        return _Result(0 if sql.startswith("DELETE FROM clusters") else 3)


def test_sweep_scopes_to_extracted_unmentioned_concepts_then_empty_clusters():
    session = _CapturingSession()
    swept = asyncio.run(sweep_orphan_concepts(session, uuid.uuid4()))

    # Returns the concept delete's rowcount.
    assert swept == 3

    # Two deletes: concepts first, then emptied clusters (the loop runs once because
    # the cluster delete reports 0 rows).
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
    # Empty = no concept AND no child cluster. Both not-exists guards MUST be present;
    # the child-cluster (parent_id) guard is what spares a populated parent from the
    # cascade wipe, so its absence is the cascade-delete regression.
    assert cluster_delete.count("NOT (EXISTS") == 2
    assert "parent_id" in cluster_delete
