"""arq worker — the async ingestion pipeline.

One job per document: parse → chunk → embed → extract → merge/dedup → edges →
cluster, updating `documents.status` at each boundary so the frontend can poll.
The merge + edge-build + cluster section runs under a per-workspace Redis lock so
two concurrent jobs for the same workspace can't create duplicate concept nodes
(the F4 guarantee); parse/chunk/embed/extract are lock-free and may overlap.
"""

import asyncio
import logging
import uuid

from arq.connections import RedisSettings
from sqlalchemy import delete, update

from app.ai import embed_texts, extract_concepts
from app.config import get_settings
from app.db import _sessionmaker, get_engine
from app.models import Chunk, Document
from app.services.chunk import chunk_text
from app.services.clustering import recompute_clusters
from app.services.concepts import add_alias, add_mention, resolve_concept, upsert_edge
from app.services.parse import parse_document
from app.services.storage import get_object

logger = logging.getLogger("ingest")


async def _set_status(document_id: uuid.UUID, status: str, error: str | None = None) -> None:
    sessionmaker = _sessionmaker()
    async with sessionmaker() as session:
        await session.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(status=status, error=error)
        )
        await session.commit()


async def ingest_document(ctx: dict, document_id: str) -> None:
    """Process one uploaded document end to end."""
    doc_id = uuid.UUID(document_id)
    sessionmaker = _sessionmaker()
    redis = ctx["redis"]

    try:
        # Load the document's processing inputs.
        async with sessionmaker() as session:
            doc = await session.get(Document, doc_id)
            if doc is None:
                logger.error("document %s not found; skipping", doc_id)
                return
            workspace_id = doc.workspace_id
            s3_key = doc.s3_key
            source_type = doc.source_type

        # Retry-safe: clear any chunks from a previous failed attempt (cascades
        # to their mentions). Concepts/edges from other documents are untouched.
        async with sessionmaker() as session:
            await session.execute(delete(Chunk).where(Chunk.document_id == doc_id))
            await session.commit()

        # --- Parse (lock-free) -------------------------------------------------
        await _set_status(doc_id, "parsing")
        data = await get_object(s3_key)
        text = await asyncio.to_thread(parse_document, data, source_type)

        # --- Chunk -------------------------------------------------------------
        await _set_status(doc_id, "chunking")
        chunks = chunk_text(text)
        if not chunks:
            await _set_status(doc_id, "done")
            return

        # --- Embed chunks + persist -------------------------------------------
        await _set_status(doc_id, "embedding")
        chunk_vectors = await embed_texts([c.content for c in chunks])
        chunk_ids: list[uuid.UUID] = []
        async with sessionmaker() as session:
            for cd, vec in zip(chunks, chunk_vectors):
                row = Chunk(
                    document_id=doc_id,
                    content=cd.content,
                    content_hash=cd.content_hash,
                    embedding=vec,
                )
                session.add(row)
                await session.flush()
                chunk_ids.append(row.id)
            await session.commit()

        # --- Extract concepts + relations per chunk (lock-free, concurrent) ----
        extractions = await asyncio.gather(
            *(extract_concepts(c.content) for c in chunks)
        )

        # Pre-embed each distinct concept (by lowercased name) for the merge step.
        concept_text: dict[str, str] = {}
        for ext in extractions:
            for c in ext.concepts:
                key = c.name.strip().lower()
                if key and key not in concept_text:
                    # Canonical "name: description" form — identical to what the
                    # store keeps, so similarity is comparable at merge time.
                    concept_text[key] = f"{c.name}: {c.description}"
        keys = list(concept_text)
        concept_vectors = await embed_texts([concept_text[k] for k in keys]) if keys else []
        concept_vec = dict(zip(keys, concept_vectors))

        # --- Merge/dedup + edges + cluster (per-workspace lock) ----------------
        # Serialize the duplicate-prone section per workspace; different
        # workspaces still run in parallel. Inside the lock we never hold a DB
        # session across an LLM call — concept resolution and cluster labelling
        # open their own short-lived sessions — so Aurora can't drop an idle
        # connection mid-job.
        lock = redis.lock(
            f"merge-lock:{workspace_id}", timeout=600, blocking_timeout=180
        )
        async with lock:
            # Phase 1 — resolve every distinct concept to an id (the merge LLM
            # runs here, with no session held). `cache` keys are lowercased names.
            cache: dict[str, uuid.UUID] = {}
            alias_pairs: list[tuple[uuid.UUID, str]] = []
            for ext in extractions:
                for c in ext.concepts:
                    key = c.name.strip().lower()
                    if not key or key not in concept_vec:
                        continue
                    if key not in cache:
                        await resolve_concept(
                            sessionmaker,
                            workspace_id,
                            c.name,
                            c.description,
                            concept_vec[key],
                            cache,
                        )
                    alias_pairs.extend((cache[key], a) for a in c.aliases)

            # Phase 2 — provenance + edges (pure DB, one short session, no LLM).
            async with sessionmaker() as session:
                for cid, alias in alias_pairs:
                    await add_alias(session, cid, alias)
                for chunk_id, ext in zip(chunk_ids, extractions):
                    for c in ext.concepts:
                        cid = cache.get(c.name.strip().lower())
                        if cid is not None:
                            await add_mention(session, cid, chunk_id, doc_id)
                    for rel in ext.relations:
                        sk = rel.source.strip().lower()
                        tk = rel.target.strip().lower()
                        if sk in cache and tk in cache:
                            await upsert_edge(
                                session, workspace_id, cache[sk], cache[tk], rel.relation
                            )
                await session.commit()

            # Phase 3 — refresh clusters (labels via LLM, hoisted; own sessions).
            await recompute_clusters(sessionmaker, workspace_id)

        await _set_status(doc_id, "done")
        logger.info("ingested document %s (%d chunks)", doc_id, len(chunks))

    except Exception as exc:  # noqa: BLE001 — record failure, then re-raise for arq
        logger.exception("ingest failed for %s", doc_id)
        try:
            await _set_status(doc_id, "failed", str(exc))
        except Exception:  # pragma: no cover
            logger.exception("could not record failure status for %s", doc_id)
        raise


async def on_shutdown(ctx: dict) -> None:
    # Release the worker's Aurora pool cleanly.
    await get_engine().dispose()


class WorkerSettings:
    functions = [ingest_document]
    # redis_url must be set for the worker to run; fall back to localhost only so
    # importing this module (e.g. in tests) doesn't raise.
    redis_settings = RedisSettings.from_dsn(
        get_settings().redis_url or "redis://localhost:6379"
    )
    on_shutdown = on_shutdown
    max_jobs = 4
    job_timeout = 600  # seconds; a large PDF's embed + extract fan-out
    keep_result = 3600
