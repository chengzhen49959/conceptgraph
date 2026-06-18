"""Throwaway: poll the ingest until terminal, then dump the clean concept list."""

import asyncio

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_engine
from app.models import Chunk, Cluster, Concept, Document, Edge


async def main() -> None:
    eng = get_engine()
    waited = 0
    while True:
        async with AsyncSession(eng) as s:
            doc = (
                await s.execute(select(Document.status, Document.error))
            ).first()
            nch = (await s.execute(select(func.count()).select_from(Chunk))).scalar_one()
            nc = (await s.execute(select(func.count()).select_from(Concept))).scalar_one()
            ne = (await s.execute(select(func.count()).select_from(Edge))).scalar_one()
            ncl = (await s.execute(select(func.count()).select_from(Cluster))).scalar_one()
        print(
            f"[{waited:3}s] status={doc[0]:9} chunks={nch} concepts={nc} edges={ne} clusters={ncl}",
            flush=True,
        )
        if doc[0] in ("done", "failed") or waited >= 220:
            async with AsyncSession(eng) as s:
                names = (
                    await s.execute(select(Concept.name).order_by(Concept.name))
                ).scalars().all()
            print(f"\nerror: {doc[1]}")
            print(f"FINAL: {len(names)} concepts")
            for n in names:
                print("  ", n)
            break
        await asyncio.sleep(4)
        waited += 4
    await eng.dispose()


asyncio.run(main())
