"""Throwaway: seed ONE local file into real S3 + Aurora and enqueue a clean ingest.

Wipes derived tables + documents (single-doc clean slate so _watch.py is accurate),
ensures one dev workspace, PUTs the file to S3, inserts a Document row, enqueues
ingest_document. Run with the arq worker already running.
  uv run --directory backend python _seed_mckee.py [path.md]
"""

import asyncio
import sys
import uuid
from pathlib import Path

from arq import create_pool
from arq.connections import RedisSettings
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_engine
from app.models import Document, Workspace
from app.services.storage import _client  # boto3 s3 client (no put_object helper exists)

INPUT = Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else "/Users/gongchengzhen/Downloads/麦基《故事》剧本分析与诊断框架.md"
)


async def main() -> None:
    s = get_settings()
    data = INPUT.read_bytes()
    async with AsyncSession(get_engine()) as db:
        # Clean single-doc slate (same tables _reingest wipes, plus documents) so
        # _watch.py's unfiltered counts reflect exactly this ingest.
        await db.execute(
            text(
                "TRUNCATE concepts, clusters, edges, concept_aliases, "
                "concept_mentions, chunks, documents CASCADE"
            )
        )
        ws_id = (await db.execute(select(Workspace.id))).scalars().first()
        if ws_id is None:
            ws_id = uuid.uuid4()
            await db.execute(
                Workspace.__table__.insert().values(
                    id=ws_id, owner_id="dev-seed", type="private"
                )
            )
        doc_id = uuid.uuid4()
        s3_key = f"{ws_id}/{doc_id}/{INPUT.name}"
        await db.execute(
            Document.__table__.insert().values(
                id=doc_id,
                workspace_id=ws_id,
                title=INPUT.stem,
                source_type="markdown",
                status="pending",
                s3_key=s3_key,
            )
        )
        await db.commit()

    # PUT bytes to real S3 (boto3 is sync; fine in a throwaway script).
    _client().put_object(
        Bucket=s.s3_bucket, Key=s3_key, Body=data, ContentType="text/markdown"
    )

    redis = await create_pool(RedisSettings.from_dsn(s.redis_url))
    await redis.enqueue_job("ingest_document", str(doc_id))
    await redis.aclose()
    print(
        f"seeded doc {doc_id}\n"
        f"  s3://{s.s3_bucket}/{s3_key}\n"
        f"  enqueued ingest_document (worker must be running)"
    )
    await get_engine().dispose()


asyncio.run(main())
