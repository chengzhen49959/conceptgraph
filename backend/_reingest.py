"""Throwaway: wipe the garbage graph, reset the doc, re-enqueue a clean ingest."""

import asyncio

from arq import create_pool
from arq.connections import RedisSettings
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_engine
from app.models import Document


async def main() -> None:
    async with AsyncSession(get_engine()) as s:
        # Clear every derived table; keep workspaces + documents.
        await s.execute(
            text(
                "TRUNCATE concepts, clusters, edges, concept_aliases, "
                "concept_mentions, chunks CASCADE"
            )
        )
        doc_id = (await s.execute(select(Document.id))).scalar_one()
        await s.execute(
            update(Document)
            .where(Document.id == doc_id)
            .values(status="pending", error=None)
        )
        await s.commit()

    redis = await create_pool(RedisSettings.from_dsn(get_settings().redis_url))
    await redis.enqueue_job("ingest_document", str(doc_id))
    await redis.aclose()
    print(f"wiped graph + re-enqueued ingest for {doc_id}")
    await get_engine().dispose()


asyncio.run(main())
