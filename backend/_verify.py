"""Throwaway: assert the real-DB ingest result — antonyms separate, variants
merged, edges + clusters populated.  uv run --directory backend python _verify.py"""

import asyncio

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_engine
from app.models import Cluster, Concept, ConceptAlias, Edge


async def main() -> None:
    async with AsyncSession(get_engine()) as s:
        concepts = (
            await s.execute(
                select(Concept.id, Concept.name, Concept.description).order_by(Concept.name)
            )
        ).all()
        names = {c.name for c in concepts}
        n_edges = (await s.execute(select(func.count()).select_from(Edge))).scalar_one()
        n_clusters = (
            await s.execute(select(func.count()).select_from(Cluster))
        ).scalar_one()
        aliases = (
            await s.execute(select(ConceptAlias.concept_id, ConceptAlias.alias))
        ).all()
        labels = (await s.execute(select(Cluster.label))).scalars().all()
        edges = (
            await s.execute(
                select(
                    Edge.source_concept_id,
                    Edge.relation,
                    Edge.target_concept_id,
                    Edge.weight,
                )
                .order_by(Edge.weight.desc())
                .limit(40)
            )
        ).all()

    id2name = {c.id: c.name for c in concepts}
    print(
        f"concepts={len(concepts)} edges={n_edges} clusters={n_clusters} "
        f"aliases={len(aliases)}\n"
    )

    # KEY regression check: the two opposites must BOTH exist as distinct nodes.
    for n in ("自上而下", "自下而上"):
        print(("  OK distinct    " if n in names else "  MISSING/merged  ") + n)

    print("\nmerges (alias -> canonical):")
    for cid, alias in aliases:
        print(f"   {alias}  ->  {id2name.get(cid, cid)}")

    print(f"\ncluster labels ({len(labels)}): " + ", ".join(l or "(none)" for l in labels))

    print("\ntop edges:")
    for sid, rel, tid, w in edges:
        print(f"   {id2name.get(sid, sid)} -{rel}-> {id2name.get(tid, tid)}  x{w}")

    await get_engine().dispose()


asyncio.run(main())
