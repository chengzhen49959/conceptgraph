"""Throwaway: re-run clustering to regenerate cluster labels with the fixed
language-aware prompt. Leiden is seeded (seed=42), so communities are unchanged
— only the labels are rewritten. No re-extraction / re-ingest."""

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db import get_engine
from app.models import Concept
from app.services.clustering import recompute_clusters


async def main() -> None:
    engine = get_engine()
    sm = async_sessionmaker(engine, expire_on_commit=False)

    # Re-label every workspace that actually holds concepts (skips empty ones).
    async with sm() as s:
        ws_ids = (
            await s.execute(select(Concept.workspace_id).distinct())
        ).scalars().all()

    for ws_id in ws_ids:
        n = await recompute_clusters(sm, ws_id)
        print(f"workspace {ws_id}: re-labeled {n} clusters")

    if not ws_ids:
        print("no workspace has concepts — nothing to re-label")
    await engine.dispose()


asyncio.run(main())
