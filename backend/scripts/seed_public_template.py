"""Build the public-demo template workspace.

Every new demo visitor's graph is a deep clone of this template (see
``app.services.public_seed`` + ``app.routers.public``). Build it ONCE; the demo
then needs no OpenAI per visit — each session is a pure DB copy. Two modes:

  # Recommended — clone an existing, already-built workspace (NO OpenAI needed).
  # In the normal app, sign in and build a nice graph (upload a few papers, let
  # ingestion finish), copy its id from the URL (?workspace=<uuid>), then:
  uv run --directory backend python scripts/seed_public_template.py --from-workspace <uuid>

  # Alternative — ingest local files into a fresh template (needs the arq worker
  # running AND OpenAI reachable: run on Render, or locally with the VPN up).
  uv run --directory backend python scripts/seed_public_template.py --from-files a.pdf b.md

Either mode first deletes any existing template so re-runs are clean. The template
is identified by ``owner_id = settings.public_template_owner_id``.

Note: a clone copies the source documents' S3 keys (downloads read the originals).
Clone from a workspace you intend to keep — deleting it later would 404 the demo's
"view source" for seed documents (the graph itself is unaffected).
"""

import argparse
import asyncio
import uuid
from pathlib import Path

from arq import create_pool
from arq.connections import RedisSettings
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_engine
from app.models import Document, Workspace
from app.services.public_seed import clone_workspace_graph
from app.services.storage import _client


def _types(filename: str) -> tuple[str, str]:
    """(content_type, source_type) from a filename — mirrors the upload contract."""
    n = filename.lower()
    if n.endswith(".pdf"):
        return "application/pdf", "pdf"
    if n.endswith((".md", ".markdown")):
        return "text/markdown", "markdown"
    return "text/plain", "text"


async def _reset_template(db: AsyncSession, owner_id: str) -> None:
    """Drop any existing template workspace (cascades its graph rows away)."""
    await db.execute(delete(Workspace).where(Workspace.owner_id == owner_id))
    await db.flush()


async def _new_template(db: AsyncSession, owner_id: str) -> Workspace:
    ws = Workspace(owner_id=owner_id, type="private", name="Demo (template)")
    db.add(ws)
    await db.flush()
    return ws


async def from_workspace(src_id: uuid.UUID) -> None:
    owner_id = get_settings().public_template_owner_id
    async with AsyncSession(get_engine()) as db:
        src = await db.scalar(select(Workspace.id).where(Workspace.id == src_id))
        if src is None:
            raise SystemExit(f"source workspace {src_id} not found")
        await _reset_template(db, owner_id)
        template = await _new_template(db, owner_id)
        template_id = template.id  # capture before commit expires it + the session closes
        n = await clone_workspace_graph(
            db, src_workspace_id=src_id, dst_workspace_id=template_id
        )
        await db.commit()
    print(f"template ready: cloned {n} concepts into workspace {template_id} (owner {owner_id})")
    await get_engine().dispose()


async def from_files(paths: list[str]) -> None:
    s = get_settings()
    owner_id = s.public_template_owner_id
    async with AsyncSession(get_engine()) as db:
        await _reset_template(db, owner_id)
        template = await _new_template(db, owner_id)
        ws_id = template.id
        doc_ids: list[uuid.UUID] = []
        for path in paths:
            p = Path(path)
            data = p.read_bytes()
            content_type, source_type = _types(p.name)
            doc_id = uuid.uuid4()
            s3_key = f"{ws_id}/{doc_id}/{p.name}"
            _client().put_object(
                Bucket=s.s3_bucket, Key=s3_key, Body=data, ContentType=content_type
            )
            db.add(
                Document(
                    id=doc_id,
                    workspace_id=ws_id,
                    title=p.stem,
                    source_type=source_type,
                    status="pending",
                    s3_key=s3_key,
                )
            )
            doc_ids.append(doc_id)
        await db.commit()

    redis = await create_pool(RedisSettings.from_dsn(s.redis_url))
    for doc_id in doc_ids:
        await redis.enqueue_job("ingest_document", str(doc_id))
    await redis.aclose()
    print(
        f"template workspace {ws_id} (owner {owner_id}): enqueued {len(doc_ids)} document(s).\n"
        f"  Wait for the arq worker to finish ingesting (watch document status),\n"
        f"  then the template is ready — new demo sessions will clone it."
    )
    await get_engine().dispose()


def main() -> None:
    ap = argparse.ArgumentParser(description="Build the public-demo template workspace.")
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--from-workspace", metavar="UUID", help="clone an existing workspace")
    group.add_argument(
        "--from-files", nargs="+", metavar="PATH", help="ingest local files (needs worker + OpenAI)"
    )
    args = ap.parse_args()
    if args.from_workspace:
        asyncio.run(from_workspace(uuid.UUID(args.from_workspace)))
    else:
        asyncio.run(from_files(args.from_files))


if __name__ == "__main__":
    main()
