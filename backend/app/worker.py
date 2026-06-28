"""arq worker — the async ingestion pipeline.

One job per document: parse → chunk → embed → extract → merge/dedup → edges →
cluster, updating `documents.status` at each boundary so the frontend can poll.
The merge + edge-build + cluster section runs under a per-workspace Redis lock so
two concurrent jobs for the same workspace can't create duplicate concept nodes
(the F4 guarantee); parse/chunk/embed/extract are lock-free and may overlap.
"""

import asyncio
import contextlib
import hashlib
import logging
import uuid
from collections import Counter

from arq.connections import RedisSettings
from sqlalchemy import delete, select, update

from app.ai import (
    SYMMETRIC_RELATIONS,
    embed_text,
    embed_texts,
    extract_core,
)
from app.config import get_settings
from app.db import _sessionmaker, get_engine
from app.models import Chunk, Document
from app.services.chunk import chunk_text
from app.services.clustering import recompute_clusters
from app.services.worker_health import WORKER_HEALTH_INTERVAL
from app.services.concepts import (
    add_aliases,
    add_mentions,
    resolve_concept,
    sweep_orphan_concepts,
    upsert_edges,
)
from app.services.dedup_sweep import sweep_workspace
from app.services.parse import parse_document
from app.services.simhash import compute as compute_simhash
from app.services.simhash import hamming as simhash_hamming
from app.services.storage import get_object

logger = logging.getLogger("ingest")

# Provenance re-link: whole-document extraction yields core concepts with no chunk
# attached, so each is linked back to the chunks of ITS document whose embedding is
# nearest — always its single best chunk (so the concept has provenance and the orphan
# sweep spares it), plus any above this cosine floor, capped. Powers the passage panel
# + node sizing without per-chunk extraction.
_RELINK_MIN_SIM = 0.40
_RELINK_MAX_CHUNKS = 5

# Max bit distance between two 64-bit text SimHashes to treat them as the same
# document. 3 is the standard near-duplicate cut for 64-bit SimHash (Manku/Google):
# two renders of one paper sit at 0-3 bits, two different papers ~half the bits apart.
_NEAR_DUP_MAX_HAMMING = 3

# The hard ceiling on one ingest job (seconds). arq cancels the task at this bound,
# so it is also the longest the merge lock can ever be held — the two MUST stay tied
# (see _merge_lock): a lock timeout shorter than the job timeout lets the lock expire
# while a long merge still holds it, which both crashes the release ("lock no longer
# owned") AND lets a second job acquire it mid-merge and spawn duplicate nodes,
# silently breaking the F4 no-duplicate guarantee. 30 min: the first document into an
# empty workspace resolves every concept as new (the maximum merge-judge fan-out).
_JOB_TIMEOUT = 1800


async def _set_status(document_id: uuid.UUID, status: str, error: str | None = None) -> None:
    # A status transition always clears the merge-progress counters: they belong to
    # the merging phase alone, so leaving them set would make a later phase (or a
    # finished doc) show a stale "30/62". The merge loop re-arms them via _set_progress.
    sessionmaker = _sessionmaker()
    async with sessionmaker() as session:
        await session.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(status=status, error=error, progress_current=None, progress_total=None)
        )
        await session.commit()


async def _set_progress(document_id: uuid.UUID, current: int, total: int) -> None:
    """Record merge-phase progress (current of total concepts resolved). Display
    only — the frontend renders the count and derives a rough ETA from the rate at
    which it advances. Called throttled (≈20 writes per document), not per concept."""
    sessionmaker = _sessionmaker()
    async with sessionmaker() as session:
        await session.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(progress_current=current, progress_total=total)
        )
        await session.commit()


def _merge_lock(redis, workspace_id: uuid.UUID):
    """The per-workspace lock serialising every duplicate-prone graph write — the
    ingest merge phase and the dedup sweep — so they can't interleave and spawn
    duplicate nodes. Different workspaces still run in parallel.

    `timeout` is tied to the job timeout (`_JOB_TIMEOUT`), the longest the lock can
    be held: a shorter lock TTL expires mid-merge under load, which crashes the
    release and — worse — lets a second job acquire the lock and break F4. The job
    cancels at the same bound, so the lock can never outlive its holder."""
    return redis.lock(
        f"merge-lock:{workspace_id}", timeout=_JOB_TIMEOUT, blocking_timeout=180
    )


def _ingest_lock(redis, document_id: uuid.UUID):
    """Per-document mutual exclusion: at most one ingest job runs for a document at
    a time. Acquired non-blocking at the top of the job and skipped on miss, because
    a *duplicate* job for the same doc is exactly what we want to drop, not queue.

    Without it, two jobs for one document race the lock-free chunk phase: the
    parse/chunk/embed section (deliberately outside the per-workspace `_merge_lock`,
    for cross-document parallelism) starts by DELETEing the doc's chunks and
    re-inserting fresh rows. A second job's delete wipes the first's just-inserted
    chunks, so the first's `concept_mentions` insert then violates the chunk FK and
    the whole job fails. Duplicates arise from arq retrying a timed-out job while a
    fresh enqueue for the same doc is already in flight, or a manual re-ingest fired
    before a prior run finished. The TTL is tied to `_JOB_TIMEOUT` (like `_merge_lock`)
    so a hard-killed holder's lock can't outlive the job; `on_startup` is the backstop."""
    return redis.lock(f"ingest-lock:{document_id}", timeout=_JOB_TIMEOUT)


def _nearest_chunks(
    concept_vec: list[float],
    chunk_ids: list[uuid.UUID],
    chunk_vectors: list[list[float]],
) -> list[uuid.UUID]:
    """Chunk ids of one document whose embedding is nearest the concept: its single
    best chunk always (guarantees ≥1 mention, so the concept has provenance and the
    orphan sweep spares it) plus any with cosine ≥ ``_RELINK_MIN_SIM``, capped at
    ``_RELINK_MAX_CHUNKS``. Cosine in memory over this document's chunks only."""
    import numpy as np

    if not chunk_ids:
        return []
    cv = np.asarray(concept_vec, dtype=np.float32)
    cm = np.asarray(chunk_vectors, dtype=np.float32)
    cn = float(np.linalg.norm(cv)) or 1.0
    rn = np.linalg.norm(cm, axis=1)
    rn[rn == 0] = 1.0
    sims = (cm @ cv) / (rn * cn)
    order = np.argsort(sims)[::-1]
    out = [chunk_ids[int(order[0])]]  # best always, even if below the floor
    for idx in order[1:_RELINK_MAX_CHUNKS]:
        if sims[int(idx)] >= _RELINK_MIN_SIM:
            out.append(chunk_ids[int(idx)])
    return out


async def ingest_document(ctx: dict, document_id: str) -> None:
    """Process one uploaded document end to end."""
    doc_id = uuid.UUID(document_id)
    sessionmaker = _sessionmaker()
    redis = ctx["redis"]

    # Skip if another job is already ingesting this exact document — a duplicate
    # would clobber its chunks mid-pipeline (see _ingest_lock). Non-blocking: we
    # drop the duplicate, not wait for the holder to finish and re-run redundantly.
    lock = _ingest_lock(redis, doc_id)
    if not await lock.acquire(blocking=False):
        logger.info("document %s already being ingested; skipping duplicate job", doc_id)
        return

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
            title = doc.title  # prepended to the thesis anchor (strongest subject signal)

        # Retry-safe: clear any chunks from a previous failed attempt (cascades
        # to their mentions). Concepts/edges from other documents are untouched.
        async with sessionmaker() as session:
            await session.execute(delete(Chunk).where(Chunk.document_id == doc_id))
            await session.commit()

        # --- Parse (lock-free) -------------------------------------------------
        await _set_status(doc_id, "parsing")
        data = await get_object(s3_key)

        # De-dup by file content: if this workspace already holds these exact bytes
        # (a re-upload of the same paper), mark this row a duplicate and skip the
        # pipeline so the paper contributes its concepts/edges exactly once — edge
        # weight then means "papers that agree", not "times re-uploaded". Hashed here,
        # after the fetch, because the browser PUTs straight to S3, so the bytes don't
        # exist at create_document time. The hash filter ignores not-yet-hashed
        # siblings (their content_hash is NULL), so a concurrent first-upload isn't
        # falsely matched; the small residual race (two identical uploads hashing at
        # once) degrades to two rows the dedup sweep can fold, never a corrupted graph.
        content_hash = hashlib.sha256(data).hexdigest()
        async with sessionmaker() as session:
            original_id = (
                await session.execute(
                    select(Document.id)
                    .where(
                        Document.workspace_id == workspace_id,
                        Document.content_hash == content_hash,
                        Document.id != doc_id,
                        Document.status.notin_(["failed", "duplicate"]),
                    )
                    .order_by(Document.created_at)
                    .limit(1)
                )
            ).scalar_one_or_none()
            if original_id is not None:
                await session.execute(
                    update(Document)
                    .where(Document.id == doc_id)
                    .values(
                        status="duplicate",
                        content_hash=content_hash,
                        duplicate_of=original_id,
                        progress_current=None,
                        progress_total=None,
                    )
                )
                await session.commit()
                logger.info("document %s duplicates %s; skipping ingest", doc_id, original_id)
                return
            await session.execute(
                update(Document)
                .where(Document.id == doc_id)
                .values(content_hash=content_hash)
            )
            await session.commit()

        text = await asyncio.to_thread(parse_document, data, source_type)

        # Near-duplicate (lexical) de-dup: content_hash above catches byte-identical
        # re-uploads; this catches the SAME paper from a different file (re-rendered PDF,
        # arxiv v1 vs v2) whose bytes differ but whose text barely does. SimHash over
        # normalized 5-word shingles — two renders land within a few bits, two different
        # papers on one topic sit ~half the bits apart (the signal is exact phrase
        # overlap, not meaning, so it can't false-merge BERT into RoBERTa the way an
        # embedding cosine would). Runs after parse (needs the text) but before the
        # expensive chunk/embed/extract, so a re-upload still skips the costly half.
        simhash = await asyncio.to_thread(compute_simhash, text)
        if simhash:
            async with sessionmaker() as session:
                candidates = (
                    await session.execute(
                        select(Document.id, Document.text_simhash)
                        .where(
                            Document.workspace_id == workspace_id,
                            Document.id != doc_id,
                            Document.text_simhash.isnot(None),
                            Document.status.notin_(["failed", "duplicate"]),
                        )
                        .order_by(Document.created_at)
                    )
                ).all()
            near_id = next(
                (cid for cid, h in candidates if simhash_hamming(simhash, h) <= _NEAR_DUP_MAX_HAMMING),
                None,
            )
            if near_id is not None:
                async with sessionmaker() as session:
                    await session.execute(
                        update(Document)
                        .where(Document.id == doc_id)
                        .values(
                            status="duplicate",
                            text_simhash=simhash,
                            duplicate_of=near_id,
                            progress_current=None,
                            progress_total=None,
                        )
                    )
                    await session.commit()
                logger.info("document %s near-duplicates %s (simhash); skipping ingest", doc_id, near_id)
                return

        # Persist the parsed source as the document's canonical text + its fingerprint.
        # Stored before the empty-chunk early-return below so even a chunk-less doc
        # retains its text. (The pipeline chunks the in-memory copy; this is the durable
        # record.)
        async with sessionmaker() as session:
            await session.execute(
                update(Document)
                .where(Document.id == doc_id)
                .values(body_markdown=text, text_simhash=simhash or None)
            )
            await session.commit()

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

        # --- Extract core concepts + typed relations (one whole-doc call) ------
        # Precision-first: a single pass returns only the concepts the paper is about
        # plus typed relations from the fixed 6-verb vocabulary — no per-chunk recall +
        # core gate. Chunks (above) stay for RAG/search/provenance; they no longer
        # drive extraction.
        await _set_status(doc_id, "extracting")
        core = await extract_core(text)
        if not core.concepts:
            await _set_status(doc_id, "done")
            return

        doc_summary = core.summary
        summary_vec = await embed_text(doc_summary) if doc_summary else None

        # Embed each core concept ("name: description") — used to merge into the graph
        # AND to re-link the concept to the chunks that discuss it (provenance).
        core_keys = [c.name.strip().lower() for c in core.concepts]
        core_by_key = {k: c for k, c in zip(core_keys, core.concepts)}
        concept_vectors = await embed_texts(
            [f"{c.name}: {c.description}" for c in core.concepts]
        )
        concept_vec = dict(zip(core_keys, concept_vectors))

        # --- Merge/dedup + provenance + edges + cluster (per-workspace lock) ----
        # Serialize the duplicate-prone section per workspace; different workspaces
        # still run in parallel. Inside the lock we never hold a DB session across an
        # LLM call — concept resolution and cluster labelling open their own short-lived
        # sessions — so Aurora can't drop an idle connection mid-job.
        await _set_status(doc_id, "merging")
        async with _merge_lock(redis, workspace_id):
            # Phase 1 — resolve every core concept to an id (the merge LLM runs here,
            # with no DB session held), concurrently, bounded by merge_concurrency. The
            # (workspace_id, lower(name)) unique index + ON CONFLICT backstops a race;
            # the manual dedup_sweep repairs residual near-dups.
            cache: dict[str, uuid.UUID] = {}
            total = len(core_keys)
            await _set_progress(doc_id, 0, total)
            done = 0
            # ≈20 progress writes across the phase, not one DB round-trip per concept.
            tick = max(1, total // 20)
            sem = asyncio.Semaphore(get_settings().merge_concurrency)

            async def _resolve_one(key: str) -> None:
                nonlocal done
                c = core_by_key[key]
                async with sem:
                    await resolve_concept(
                        sessionmaker, workspace_id, c.name, c.description, concept_vec[key], cache
                    )
                done += 1
                if done % tick == 0 or done == total:
                    await _set_progress(doc_id, done, total)

            await asyncio.gather(*(_resolve_one(k) for k in core_keys))

            # Aliases — cache now maps every key to its id.
            alias_pairs: list[tuple[uuid.UUID, str]] = [
                (cache[k], a)
                for k in core_keys
                if k in cache
                for a in core_by_key[k].aliases
            ]

            # Phase 2 — provenance (re-link) + typed edges. Whole-doc extraction leaves
            # a concept with no chunk attached, so link each resolved concept to the
            # nearest chunks of THIS document by embedding (its best chunk always, +
            # any above the floor). Edges come from the typed relations only — no
            # co-occurrence; contrasts_with is symmetric, stored on the sorted id pair.
            # Weights pre-summed per (source, target, type, kind) so no key repeats in a
            # multi-row upsert; they accumulate across documents into a consensus count.
            mentions: set[tuple[uuid.UUID, uuid.UUID, uuid.UUID]] = set()
            for key in core_keys:
                cid = cache.get(key)
                if cid is None:
                    continue
                for chunk_id in _nearest_chunks(concept_vec[key], chunk_ids, chunk_vectors):
                    mentions.add((cid, chunk_id, doc_id))

            edge_weights: Counter[tuple[uuid.UUID, uuid.UUID, str, str]] = Counter()
            for rel in core.relations:
                s = cache.get(rel.source.strip().lower())
                t = cache.get(rel.target.strip().lower())
                if s is None or t is None or s == t:
                    continue
                if rel.type in SYMMETRIC_RELATIONS and s > t:
                    s, t = t, s  # canonical ordering for an undirected pair
                edge_weights[(s, t, rel.type, "relation")] += 1

            async with sessionmaker() as session:
                await add_aliases(session, alias_pairs)
                await add_mentions(session, mentions)
                await upsert_edges(session, workspace_id, dict(edge_weights))
                if doc_summary:
                    await session.execute(
                        update(Document)
                        .where(Document.id == doc_id)
                        .values(summary=doc_summary, summary_embedding=summary_vec)
                    )
                # Reconcile orphans BEFORE clustering: a prior ingest that died
                # between concept-create (Phase 1, committed per node) and this
                # provenance write leaves extracted concepts with no mention — ghost
                # nodes that also pollute the merge ANN pool. This doc's concepts are
                # already mentioned in this same transaction, so the sweep spares them
                # and only reaps stale orphans. Safe here: the per-workspace merge lock
                # is held, so no concurrent ingest is mid-merge. (See sweep_orphan_concepts.)
                await sweep_orphan_concepts(session, workspace_id)
                await session.commit()

            # Phase 3 — refresh clusters (labels via LLM, hoisted; own sessions).
            await _set_status(doc_id, "clustering")
            await recompute_clusters(sessionmaker, workspace_id)

        await _set_status(doc_id, "done")
        logger.info("ingested document %s (%d chunks)", doc_id, len(chunks))

    except asyncio.CancelledError:
        # arq's hard job_timeout cancels the task, and CancelledError is a
        # BaseException — the `except Exception` below never sees it, which is why a
        # timed-out job used to leave the doc frozen at 'merging' forever. Flag it
        # failed before re-raising, shielded so this final write isn't itself
        # cancelled mid-flight. on_startup is the backstop if even this can't land.
        logger.warning("ingest cancelled (timeout?) for %s", doc_id)
        with contextlib.suppress(Exception):
            await asyncio.shield(_set_status(doc_id, "failed", "timed out"))
        raise
    except Exception as exc:  # noqa: BLE001 — record failure, then re-raise for arq
        logger.exception("ingest failed for %s", doc_id)
        try:
            await _set_status(doc_id, "failed", str(exc))
        except Exception:  # pragma: no cover
            logger.exception("could not record failure status for %s", doc_id)
        raise
    finally:
        # Release the per-document lock on every exit (success, early return, error,
        # or cancel). Suppressed because a timeout-expired lock raises on release —
        # the TTL is tied to the job timeout so that can't happen mid-job, but a hard
        # kill could, and the release must never mask the original failure.
        with contextlib.suppress(Exception):
            await lock.release()


async def dedup_sweep_workspace(
    ctx: dict, workspace_id: str, dry_run: bool = False
) -> dict:
    """Global entity-resolution sweep for one workspace — the repair pass for the
    incremental merge, enqueued manually (or on a schedule). Holds the same
    per-workspace merge lock as ingestion so it can't interleave with a document's
    merge phase. `dry_run` judges duplicates but writes nothing — run it first to
    eyeball the LLM's pairings before authorising the destructive merge.
    """
    ws_id = uuid.UUID(workspace_id)
    sessionmaker = _sessionmaker()
    async with _merge_lock(ctx["redis"], ws_id):
        result = await sweep_workspace(sessionmaker, ws_id, dry_run=dry_run)
    logger.info(
        "dedup sweep %s: %d concepts, %d candidate pairs, %d merges%s",
        ws_id,
        result.concepts,
        result.candidate_pairs,
        len(result.merges),
        " (dry run)" if dry_run else "",
    )
    return {
        "concepts": result.concepts,
        "candidate_pairs": result.candidate_pairs,
        "merges": result.merges,
        "dry_run": dry_run,
    }


async def on_startup(ctx: dict) -> None:
    """Reset documents stranded in an in-progress stage by a previous worker's death.

    A hard kill (laptop sleep, closed terminal) or a job_timeout-cancel can stop a
    job without its `except` running, leaving the doc frozen mid-pipeline (e.g.
    'merging') with no process driving it — an honest dead-end the UI shows as a
    spinner that never resolves. On a fresh worker start nothing is legitimately
    mid-flight (single worker; the per-workspace lock serialises the rest), so any
    non-terminal, non-queued doc is such a corpse: mark it failed so the user sees a
    clear, re-uploadable error. 'pending' is left alone — that's a job still queued
    in Redis that this worker is about to run.
    """
    sessionmaker = _sessionmaker()
    async with sessionmaker() as session:
        result = await session.execute(
            update(Document)
            .where(Document.status.notin_(["pending", "done", "failed"]))
            .values(
                status="failed",
                error="interrupted (worker restarted)",
                progress_current=None,
                progress_total=None,
            )
        )
        await session.commit()
    if result.rowcount:
        logger.warning("reset %d interrupted document(s) to failed on startup", result.rowcount)


async def on_shutdown(ctx: dict) -> None:
    # Release the worker's Aurora pool cleanly.
    await get_engine().dispose()


class WorkerSettings:
    functions = [ingest_document, dedup_sweep_workspace]
    # redis_url must be set for the worker to run; fall back to localhost only so
    # importing this module (e.g. in tests) doesn't raise.
    redis_settings = RedisSettings.from_dsn(
        get_settings().redis_url or "redis://localhost:6379"
    )
    on_startup = on_startup
    on_shutdown = on_shutdown
    # Refresh the Redis health key on a short interval (arq's default is 1h) so the
    # API can tell within seconds when this worker has died — a dead worker is the
    # usual reason a clip sits stuck at "Queued". arq deletes the key on a clean
    # shutdown and TTLs it just past this interval, so a hard kill expires it too.
    # Read back via app.services.worker_health.worker_is_online.
    health_check_interval = WORKER_HEALTH_INTERVAL
    max_jobs = 4
    # The single source for the job ceiling; the merge lock's TTL is tied to it
    # (see _JOB_TIMEOUT / _merge_lock). 600s wasn't enough even before network
    # latency — the first document into an empty workspace resolves every concept as
    # new (the maximum merge-judge fan-out). The merge phase is now concurrent, but
    # keep the wide ceiling so a big PDF can't be cancelled mid-flight.
    job_timeout = _JOB_TIMEOUT
    # A genuinely failing job shouldn't burn the full timeout arq's default 5 times,
    # but a single batch-induced blip (a transient Aurora/DNS drop mid-write under a
    # multi-PDF upload) shouldn't permanently fail an otherwise-fine document either.
    # Three attempts rides out one bad network window without a retry storm.
    max_tries = 3
    keep_result = 3600
