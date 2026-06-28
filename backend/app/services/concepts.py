"""Concept merge/dedup + edge building — the F4 core differentiator.

`resolve_concept` decides, for each extracted concept, whether to MERGE into an
existing node (same concept) or CREATE a new one. Merge is gated by an exact
name hit, or vector similarity within the workspace followed by an LLM
confirmation. The functional unique index `(workspace_id, lower(name))` is the
race backstop: a lost merge lock degrades to "found existing", never a duplicate.
"""

import uuid
from collections.abc import Iterable

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import aliased

from app.ai import embed_text, match_concept, merge_descriptions
from app.config import get_settings
from app.models import Cluster, Concept, ConceptAlias, ConceptMention, Edge


async def resolve_concept(
    sessionmaker: async_sessionmaker[AsyncSession],
    workspace_id: uuid.UUID,
    name: str,
    description: str | None,
    embedding: list[float],
    cache: dict[str, uuid.UUID],
) -> uuid.UUID:
    """Return the concept id for `name`, merging or creating as appropriate.

    Takes the session *factory*, not an open session: each DB step uses its own
    short-lived session so the merge LLM call (`match_concept`) runs with
    NO connection checked out. Holding a connection across that network call is
    what let Aurora kill it mid-job (`ConnectionDoesNotExistError`).

    `cache` is a per-document name→id map so the same concept across chunks
    resolves once (and doesn't re-run similarity/LLM each time).
    """
    key = name.strip().lower()
    if not key:
        raise ValueError("concept name is empty")
    if key in cache:
        return cache[key]

    # Fast path: exact (case-insensitive) hit on a canonical name OR a known
    # alias — reuse that node, no embed/ANN/LLM. An alias records a merge the
    # LLM already confirmed, so a surface form we've folded before resolves for
    # free (and never re-creates a near-duplicate of its own canonical node).
    async with sessionmaker() as session:
        existing_id = (
            await session.execute(
                select(Concept.id).where(
                    Concept.workspace_id == workspace_id,
                    func.lower(Concept.name) == key,
                )
            )
        ).scalar_one_or_none()
        if existing_id is None:
            existing_id = (
                await session.execute(
                    select(ConceptAlias.concept_id)
                    .join(Concept, Concept.id == ConceptAlias.concept_id)
                    .where(
                        Concept.workspace_id == workspace_id,
                        func.lower(ConceptAlias.alias) == key,
                    )
                    .limit(1)
                )
            ).scalar_one_or_none()
    if existing_id is not None:
        cache[key] = existing_id
        return existing_id

    # Vector nearest neighbours within the workspace (HNSW + cosine distance).
    # Embeddings only BLOCK here — they recall candidates; the merge decision is
    # the LLM's (match_concept). Pure cosine-threshold merging is low-precision and
    # false-merges siblings/opposites (e.g. top-down vs bottom-up).
    settings = get_settings()
    async with sessionmaker() as session:
        rows = (
            await session.execute(
                select(
                    Concept.id,
                    Concept.name,
                    Concept.description,
                    Concept.embedding.cosine_distance(embedding).label("dist"),
                )
                .where(Concept.workspace_id == workspace_id)
                .order_by(Concept.embedding.cosine_distance(embedding))
                .limit(settings.block_top_k)
            )
        ).all()

    candidates = [r for r in rows if r.dist is not None and r.dist <= settings.block_distance]
    if candidates:
        # LLM multiple-choice canonicalization — deliberately OUTSIDE any open
        # session. Returns the chosen candidate's index, or -1 for "none → new".
        match = await match_concept(
            name,
            description,
            [{"name": c.name, "description": c.description} for c in candidates],
        )
        if 0 <= match.match_index < len(candidates):
            nn = candidates[match.match_index]
            # Merge into the chosen node: keep the incoming surface form as an
            # alias, fold the new wording into one canonical glossary description,
            # and re-embed only when that text actually changed so the stored
            # vector always matches the stored description. The merge LLM and the
            # embedding call both run BEFORE any session is opened.
            merged = nn.description
            if description and nn.description and description != nn.description:
                merged = await merge_descriptions(nn.name, nn.description, description)
            elif description and not nn.description:
                merged = description
            new_vec = (
                await embed_text(f"{nn.name}: {merged}")
                if merged and merged != nn.description
                else None
            )
            async with sessionmaker() as session:
                await add_alias(session, nn.id, name)
                if new_vec is not None:
                    await session.execute(
                        update(Concept)
                        .where(Concept.id == nn.id)
                        .values(description=merged, embedding=new_vec)
                    )
                await session.commit()
            cache[key] = nn.id
            return nn.id

    # Create. ON CONFLICT handles a concurrent create of the same name.
    async with sessionmaker() as session:
        await session.execute(
            pg_insert(Concept)
            .values(
                workspace_id=workspace_id,
                name=name,
                description=description,
                embedding=embedding,
            )
            .on_conflict_do_nothing(
                index_elements=[Concept.workspace_id, func.lower(Concept.name)]
            )
        )
        new_id = (
            await session.execute(
                select(Concept.id).where(
                    Concept.workspace_id == workspace_id,
                    func.lower(Concept.name) == key,
                )
            )
        ).scalar_one()
        await session.commit()
    cache[key] = new_id
    return new_id


async def add_alias(session: AsyncSession, concept_id: uuid.UUID, alias: str) -> None:
    if not alias.strip():
        return
    await session.execute(
        pg_insert(ConceptAlias)
        .values(concept_id=concept_id, alias=alias)
        .on_conflict_do_nothing()
    )


async def add_mention(
    session: AsyncSession,
    concept_id: uuid.UUID,
    chunk_id: uuid.UUID,
    document_id: uuid.UUID,
) -> None:
    """Record provenance: this concept is mentioned in this chunk."""
    await session.execute(
        pg_insert(ConceptMention)
        .values(concept_id=concept_id, chunk_id=chunk_id, document_id=document_id)
        .on_conflict_do_nothing()
    )


async def upsert_edge(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    source_concept_id: uuid.UUID,
    target_concept_id: uuid.UUID,
    relation: str,
    kind: str = "relation",
    weight: int = 1,
) -> None:
    """Insert an edge, or add `weight` to it if the same (source, target, relation,
    kind) edge recurs.

    `kind` distinguishes a displayed directed relation ('relation') from a hidden
    co-occurrence clustering edge ('cooccur'); the caller orders the endpoints
    (relations are directed, co-occurrences are stored canonically). `weight` lets
    a co-occurrence be added by its count in one call instead of N.
    """
    if source_concept_id == target_concept_id:
        return  # no self-loops
    await session.execute(
        pg_insert(Edge)
        .values(
            workspace_id=workspace_id,
            source_concept_id=source_concept_id,
            target_concept_id=target_concept_id,
            relation=relation,
            kind=kind,
            weight=weight,
        )
        .on_conflict_do_update(
            constraint="uq_edges_triple",
            set_={"weight": Edge.weight + weight},
        )
    )


# --- Bulk variants ---------------------------------------------------------
# The singular helpers above stay for single-edge callers (graph_edit, dedup_sweep,
# resolve_concept). The worker's per-document provenance/edge write, though, is
# hundreds of rows: doing it one INSERT at a time was hundreds of sequential
# round-trips to Aurora — the stall that hung the pipeline AFTER the merge finished.
# These fold a whole document into one multi-row statement each.


async def add_aliases(
    session: AsyncSession, pairs: Iterable[tuple[uuid.UUID, str]]
) -> None:
    """Bulk :func:`add_alias`: one INSERT for a document's surface forms. Blanks are
    dropped, duplicates collapsed, and ON CONFLICT DO NOTHING keeps an existing alias."""
    rows = [
        {"concept_id": cid, "alias": alias}
        for cid, alias in {(c, a.strip()) for c, a in pairs if a.strip()}
    ]
    if not rows:
        return
    await session.execute(pg_insert(ConceptAlias).values(rows).on_conflict_do_nothing())


async def add_mentions(
    session: AsyncSession, rows: Iterable[tuple[uuid.UUID, uuid.UUID, uuid.UUID]]
) -> None:
    """Bulk :func:`add_mention`: one INSERT for every (concept, chunk, document)
    provenance row a document yields. Deduped via a set; ON CONFLICT DO NOTHING
    absorbs a re-ingest."""
    values = [
        {"concept_id": cid, "chunk_id": chunk_id, "document_id": doc_id}
        for cid, chunk_id, doc_id in set(rows)
    ]
    if not values:
        return
    await session.execute(
        pg_insert(ConceptMention).values(values).on_conflict_do_nothing()
    )


async def upsert_edges(
    session: AsyncSession,
    workspace_id: uuid.UUID,
    weighted: dict[tuple[uuid.UUID, uuid.UUID, str, str], int],
) -> None:
    """Bulk :func:`upsert_edge`: one INSERT … ON CONFLICT DO UPDATE for a document's
    whole edge set, existing edges accumulating the incoming weight exactly as the
    per-edge path does.

    Weights MUST be pre-aggregated by the caller — the dict key is
    ``(source, target, relation, kind)`` — because Postgres rejects updating the same
    conflict target twice within one statement, so a key may not repeat. Self-loops
    are dropped."""
    rows = [
        {
            "workspace_id": workspace_id,
            "source_concept_id": s,
            "target_concept_id": t,
            "relation": relation,
            "kind": kind,
            "weight": weight,
        }
        for (s, t, relation, kind), weight in weighted.items()
        if s != t
    ]
    if not rows:
        return
    stmt = pg_insert(Edge).values(rows)
    await session.execute(
        stmt.on_conflict_do_update(
            constraint="uq_edges_triple",
            set_={"weight": Edge.weight + stmt.excluded.weight},
        )
    )


async def sweep_orphan_concepts(
    session: AsyncSession, workspace_id: uuid.UUID
) -> int:
    """Delete *extracted* concepts no document mentions, plus any cluster thereby
    left empty. Returns the number of concepts swept.

    The graph's invariant: an extracted concept exists only as long as some
    document mentions it. The ingest pipeline creates a concept node (Phase 1)
    and its provenance mentions (Phase 2) in SEPARATE transactions, and
    ``concept_mentions`` cascades only from its document — so a concept can be
    stranded with zero mentions two ways: an ingest dies between the phases, or a
    document row is removed by any path other than this sweep. Either leaves a
    ghost node with no document/topic behind it (and, worse, its embedding still
    pollutes the merge ANN pool, so a later ingest can resurrect it). This
    reconciles both. Manual concepts (``origin='manual'``) are user-drawn and may
    legitimately stand alone, so they are exempt.

    Callers MUST hold the per-workspace merge lock (the worker) or run inside a
    document-delete transaction (the delete endpoint): both already serialise the
    duplicate-prone graph writes, so no concurrent ingest can be mid-merge with a
    not-yet-mentioned extracted concept that this would wrongly reap.
    """
    has_mention = (
        select(ConceptMention.concept_id)
        .where(ConceptMention.concept_id == Concept.id)
        .exists()
    )
    result = await session.execute(
        delete(Concept).where(
            Concept.workspace_id == workspace_id,
            Concept.origin == "extracted",
            ~has_mention,
        )
    )
    # Drop clusters the sweep emptied (concept FK is ON DELETE SET NULL, so they'd
    # otherwise linger as empty topics). A cluster is empty only when nothing hangs
    # under it: no concept AND no child cluster. The hierarchy is two-level — a leaf
    # carries concepts, a parent carries none and groups leaves via `parent_id` — so
    # testing concepts alone matched EVERY parent and cascade-deleted (parent_id is
    # ON DELETE CASCADE) its still-populated leaves, NULL-ing out and un-topic-ing
    # other documents' concepts workspace-wide. Removing an empty leaf can orphan its
    # parent, so repeat to a fixpoint; two levels settle in at most two passes.
    child = aliased(Cluster)
    while True:
        has_concept = (
            select(Concept.id).where(Concept.cluster_id == Cluster.id).exists()
        )
        has_child = select(child.id).where(child.parent_id == Cluster.id).exists()
        emptied = await session.execute(
            delete(Cluster).where(
                Cluster.workspace_id == workspace_id,
                ~has_concept,
                ~has_child,
            )
        )
        if not emptied.rowcount:
            break
    return result.rowcount or 0
