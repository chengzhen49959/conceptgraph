"""arq worker — the async ingestion pipeline.

One job per document: parse → chunk → embed → extract → merge/dedup → edges →
cluster, updating `documents.status` at each boundary so the frontend can poll.
The merge + edge-build + cluster section runs under a per-workspace Redis lock so
two concurrent jobs for the same workspace can't create duplicate concept nodes
(the F4 guarantee); parse/chunk/embed/extract are lock-free and may overlap.
"""

import asyncio
import contextlib
import logging
import uuid
from collections import Counter
from itertools import combinations

from arq.connections import RedisSettings
from sqlalchemy import delete, update

from app.ai import (
    CandidateConcept,
    ExtractedConcept,
    embed_text,
    embed_texts,
    extract_concepts,
    select_core_concepts,
    summarize_document,
)
from app.config import get_settings
from app.db import _sessionmaker, get_engine
from app.models import Chunk, Document
from app.services.chunk import chunk_text
from app.services.clustering import recompute_clusters
from app.services.concepts import (
    add_aliases,
    add_mentions,
    resolve_concept,
    sweep_orphan_concepts,
    upsert_edges,
)
from app.services.dedup_sweep import sweep_workspace
from app.services.parse import parse_document
from app.services.storage import get_object
from app.services.thesis import grounds_in, thesis_anchor

logger = logging.getLogger("ingest")

# Per-document floor for emitting a co-occurrence edge. A co-occurrence's STRENGTH
# is its weight, which accumulates across chunks AND documents via upsert, so the
# signal is cross-corpus, not per-doc — thresholding per document would block that
# accumulation (a pair co-mentioned once in each of five papers should reach
# weight 5, not be dropped five times). So the floor is 1 (emit every co-mention)
# and weight-aware Leiden lets incidental weight-1 links fade while repeated
# co-mentions pull concepts together. A knob: raise it to sparsify per document.
_MIN_COOCCUR = 1

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
        text = await asyncio.to_thread(parse_document, data, source_type)

        # Persist the parsed source as the document's canonical text. Stored before
        # the empty-chunk early-return below so even a chunk-less doc retains its text.
        # (The pipeline chunks the in-memory copy; this column is the durable record.)
        async with sessionmaker() as session:
            await session.execute(
                update(Document).where(Document.id == doc_id).values(body_markdown=text)
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

        # --- Extract concepts + relations per chunk (lock-free, concurrent) ----
        await _set_status(doc_id, "extracting")
        extractions = await asyncio.gather(
            *(extract_concepts(c.content) for c in chunks)
        )

        # Collect each distinct concept (by lowercased name): its canonical
        # "name: description" form (identical to what the store keeps, so
        # similarity is comparable at merge time), a representative object, and how
        # many passages it appeared in (a salience hint for the core gate).
        concept_text: dict[str, str] = {}
        concept_first: dict[str, ExtractedConcept] = {}
        freq: Counter[str] = Counter()
        for ext in extractions:
            for c in ext.concepts:
                key = c.name.strip().lower()
                if not key:
                    continue
                freq[key] += 1
                if key not in concept_text:
                    concept_text[key] = f"{c.name}: {c.description}"
                    concept_first[key] = c
        keys = list(concept_text)

        # Aggregate the per-chunk summaries into one document summary and embed it
        # (lock-free; it touches only this document's row). Stored in phase 2.
        doc_summary = await summarize_document([e.summary for e in extractions])
        summary_vec = await embed_text(doc_summary) if doc_summary else None

        # Reduce-pass core gate: per-chunk extraction over-produces (every passage,
        # incl. bibliography/related-work, yields nodes). This one document-level
        # call keeps only the concepts the document substantively develops; the rest
        # never enter the graph from this document. Lock-free, like the summary.
        #
        # Centrality is judged against the document's own framing (title + abstract +
        # intro + conclusion), NOT the aggregate summary: the summary stitches every
        # passage together, so it reflects incidental machinery (an optimizer, a
        # normalization trick) as if it were the subject. The authors' framing names
        # only the contribution. `thesis` is sliced positionally, not parsed. A
        # concept named in that framing is grounded — a strong prior that it is core.
        thesis = thesis_anchor(text, title)
        core = await select_core_concepts(
            thesis or doc_summary,  # framing is the arbiter; summary only if framing is empty
            [
                CandidateConcept(
                    name=concept_first[k].name,
                    description=concept_first[k].description,
                    freq=freq[k],
                    grounded=grounds_in(
                        thesis, concept_first[k].name, *concept_first[k].aliases
                    ),
                )
                for k in keys
            ],
        )

        # Embed only the core concepts for the merge step (skips dropped ones).
        core_keys = [k for k in keys if k in core]
        concept_vectors = (
            await embed_texts([concept_text[k] for k in core_keys]) if core_keys else []
        )
        concept_vec = dict(zip(core_keys, concept_vectors))

        # --- Merge/dedup + edges + cluster (per-workspace lock) ----------------
        # Serialize the duplicate-prone section per workspace; different
        # workspaces still run in parallel. Inside the lock we never hold a DB
        # session across an LLM call — concept resolution and cluster labelling
        # open their own short-lived sessions — so Aurora can't drop an idle
        # connection mid-job.
        await _set_status(doc_id, "merging")
        async with _merge_lock(redis, workspace_id):
            # Phase 1 — resolve every distinct concept to an id (the merge LLM runs
            # here, with no DB session held). `cache` keys are lowercased names.
            #
            # Resolutions run CONCURRENTLY, bounded by settings.merge_concurrency.
            # One-at-a-time they were ≈60 sequential merge-judge calls over the
            # network — the dominant cost that blew the 600s job_timeout on a first
            # document. Concurrency cuts that to a few waves. The cost: each
            # resolution's nearest-neighbour query sees a racy, partially-built view of
            # THIS batch, so two differently-named near-duplicates in one document can
            # both create a node; same-NAME collisions still can't (keys are distinct
            # here, and the (workspace_id, lower(name)) unique index + ON CONFLICT
            # backstops a race). The manual dedup_sweep repairs the residual near-dups.
            cache: dict[str, uuid.UUID] = {}

            # Distinct concepts that passed the core gate (first description wins).
            to_resolve: dict[str, tuple[str, str | None]] = {}
            for ext in extractions:
                for c in ext.concepts:
                    key = c.name.strip().lower()
                    if not key or key not in core or key not in concept_vec:
                        continue
                    to_resolve.setdefault(key, (c.name, c.description))

            total = len(to_resolve)
            await _set_progress(doc_id, 0, total)
            done = 0
            # ≈20 progress writes across the phase, not one DB round-trip per concept.
            tick = max(1, total // 20)
            sem = asyncio.Semaphore(get_settings().merge_concurrency)

            async def _resolve_one(key: str, name: str, description: str | None) -> None:
                nonlocal done
                async with sem:
                    await resolve_concept(
                        sessionmaker, workspace_id, name, description, concept_vec[key], cache
                    )
                done += 1
                if done % tick == 0 or done == total:
                    await _set_progress(doc_id, done, total)

            await asyncio.gather(
                *(_resolve_one(k, n, d) for k, (n, d) in to_resolve.items())
            )

            # Aliases: collected after resolution, so `cache` maps every key to its id.
            alias_pairs: list[tuple[uuid.UUID, str]] = []
            for ext in extractions:
                for c in ext.concepts:
                    key = c.name.strip().lower()
                    if key in cache:
                        alias_pairs.extend((cache[key], a) for a in c.aliases)

            # Phase 2 — provenance + edges. Aggregate everything in memory first (no
            # awaits), then ONE bulk statement each for mentions, aliases, and edges.
            # Per-row writes here were hundreds of sequential round-trips to Aurora —
            # the ~4-minute stall the pipeline hit AFTER the merge had finished, which
            # read to the user as "stuck again". Relation and co-occurrence weights are
            # pre-summed per (source, target, relation, kind) so no key repeats within a
            # multi-row INSERT (Postgres can't upsert the same conflict target twice in
            # one statement).
            edge_weights: Counter[tuple[uuid.UUID, uuid.UUID, str, str]] = Counter()
            mentions: set[tuple[uuid.UUID, uuid.UUID, uuid.UUID]] = set()
            for chunk_id, ext in zip(chunk_ids, extractions):
                ids_here: set[uuid.UUID] = set()
                for c in ext.concepts:
                    cid = cache.get(c.name.strip().lower())
                    if cid is not None:
                        mentions.add((cid, chunk_id, doc_id))
                        ids_here.add(cid)
                # Concepts sharing a chunk co-occur; tally each unordered pair
                # (sorted → a<b canonical) across chunks for the cluster graph.
                for a, b in combinations(sorted(ids_here), 2):
                    edge_weights[(a, b, "", "cooccur")] += 1
                for rel in ext.relations:
                    sk = rel.source.strip().lower()
                    tk = rel.target.strip().lower()
                    if sk in cache and tk in cache:
                        edge_weights[(cache[sk], cache[tk], rel.relation, "relation")] += 1
            # Co-occurrence edges below the noise floor are dropped; displayed relations
            # (kind='relation') are always kept. kind='cooccur' edges stay hidden from
            # the graph view — they only densify the cluster graph.
            edges = {
                k: w for k, w in edge_weights.items() if k[3] != "cooccur" or w >= _MIN_COOCCUR
            }
            async with sessionmaker() as session:
                await add_aliases(session, alias_pairs)
                await add_mentions(session, mentions)
                await upsert_edges(session, workspace_id, edges)
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
