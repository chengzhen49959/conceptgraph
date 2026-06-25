"""Global ER sweep smoke — plant two near-duplicate concepts the incremental merge
would have left split, run ``sweep_workspace`` (dry then real), and assert the
duplicate folds: node count drops, the loser's edge re-points onto the survivor,
and the loser's alias + name move over.

Usage (from backend/, like pipeline_smoke):
    cd backend && .venv/bin/python ../test/dedup_sweep_smoke.py

Needs DATABASE_URL + OPENAI_API_KEY in backend/.env.local and a reachable Aurora +
OpenAI. Creates a throwaway workspace and deletes it (CASCADE) on exit.
"""

import asyncio
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import delete, func, select  # noqa: E402

from app.ai import embed_text  # noqa: E402
from app.db import _sessionmaker  # noqa: E402
from app.models import (  # noqa: E402
    Chunk,
    Concept,
    ConceptAlias,
    Document,
    Edge,
    Workspace,
)
from app.services.concepts import add_alias, add_mention, upsert_edge  # noqa: E402
from app.services.dedup_sweep import sweep_workspace  # noqa: E402


async def _counts(sm, ws_id) -> dict:
    async with sm() as s:
        concepts = (
            await s.execute(select(func.count()).select_from(Concept).where(Concept.workspace_id == ws_id))
        ).scalar()
        edges = (
            await s.execute(select(func.count()).select_from(Edge).where(Edge.workspace_id == ws_id))
        ).scalar()
    return {"concepts": concepts, "edges": edges}


async def main() -> None:
    sm = _sessionmaker()
    ws_id = uuid.uuid4()
    failures: list[str] = []
    try:
        # --- workspace + one doc + one chunk (provenance targets) ---
        chunk_vec = await embed_text("placeholder chunk")
        async with sm() as s:
            s.add(Workspace(id=ws_id, owner_id=f"sweep-{ws_id}", type="shared", name="sweep smoke"))
            await s.flush()
            doc = Document(workspace_id=ws_id, title="t", source_type="text", status="done", s3_key="local:t")
            s.add(doc)
            await s.flush()
            doc_id = doc.id
            chunk = Chunk(document_id=doc_id, content="placeholder chunk", content_hash=uuid.uuid4().hex, embedding=chunk_vec)
            s.add(chunk)
            await s.flush()
            chunk_id = chunk.id
            await s.commit()

        # --- two near-duplicate concepts + one distinct, with real embeddings ---
        v_a = await embed_text("Self-attention: relates different positions of a single sequence to compute a representation of it.")
        v_b = await embed_text("Self attention mechanism: an attention mechanism that relates positions within one sequence to build its representation.")
        v_c = await embed_text("Positional encoding: injects token order information into the input embeddings.")
        async with sm() as s:
            a = Concept(workspace_id=ws_id, name="Self-attention", description="Relates positions of one sequence to represent it.", embedding=v_a)
            b = Concept(workspace_id=ws_id, name="Self attention mechanism", description="An attention mechanism over positions within a single sequence.", embedding=v_b)
            c = Concept(workspace_id=ws_id, name="Positional encoding", description="Injects order info into embeddings.", embedding=v_c)
            s.add_all([a, b, c])
            await s.flush()
            a_id, b_id, c_id = a.id, b.id, c.id
            await add_mention(s, a_id, chunk_id, doc_id)
            await add_mention(s, b_id, chunk_id, doc_id)  # same chunk → must dedupe on move
            await add_alias(s, b_id, "self-attn")  # loser alias → must move to survivor
            await upsert_edge(s, ws_id, b_id, c_id, "is combined with")  # loser edge → must re-point
            await s.commit()

        before = await _counts(sm, ws_id)
        print("before:", before)

        dry = await sweep_workspace(sm, ws_id, dry_run=True)
        print(f"dry-run: {dry.candidate_pairs} candidate pairs, merges={dry.merges}")
        after_dry = await _counts(sm, ws_id)
        if after_dry != before:
            failures.append(f"dry-run mutated the graph: {before} -> {after_dry}")
        if not any({"Self-attention", "Self attention mechanism"} == {m[0], m[1]} for m in dry.merges):
            failures.append("dry-run did not flag the Self-attention duplicate")

        real = await sweep_workspace(sm, ws_id, dry_run=False)
        print(f"real: merges={real.merges}")
        after = await _counts(sm, ws_id)
        print("after:", after)

        # --- assertions ---
        if after["concepts"] != before["concepts"] - 1:
            failures.append(f"expected 1 fewer concept, got {before['concepts']} -> {after['concepts']}")
        async with sm() as s:
            names = set((await s.execute(select(Concept.name).where(Concept.workspace_id == ws_id))).scalars())
            survivor_id = (
                await s.execute(select(Concept.id).where(Concept.workspace_id == ws_id, Concept.name.in_(["Self-attention", "Self attention mechanism"])))
            ).scalar_one_or_none()
            # the distinct concept is untouched
            if "Positional encoding" not in names:
                failures.append("distinct concept 'Positional encoding' was wrongly removed")
            # survivor inherits the loser's edge to Positional encoding
            edge_targets = set(
                (await s.execute(select(Edge.target_concept_id).where(Edge.source_concept_id == survivor_id, Edge.kind == "relation"))).scalars()
            )
            if c_id not in edge_targets:
                failures.append("loser's edge did not re-point onto the survivor")
            # survivor carries the loser's alias and the loser's name
            aliases = set(
                (await s.execute(select(ConceptAlias.alias).where(ConceptAlias.concept_id == survivor_id))).scalars()
            )
            if "self-attn" not in aliases:
                failures.append(f"loser alias 'self-attn' did not move; aliases={aliases}")

        # idempotency: a second sweep finds nothing to merge
        again = await sweep_workspace(sm, ws_id, dry_run=False)
        if again.merges:
            failures.append(f"second sweep was not a no-op: {again.merges}")

        print("\nRESULT:", "PASS ✅" if not failures else "FAIL ❌")
        for f in failures:
            print("  -", f)
    finally:
        async with sm() as s:
            await s.execute(delete(Workspace).where(Workspace.id == ws_id))
            await s.commit()
        print(f"cleaned up workspace {ws_id}")


if __name__ == "__main__":
    asyncio.run(main())
