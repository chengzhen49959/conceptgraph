"""Concept merge/dedup + edge building — the F4 core differentiator.

`resolve_concept` decides, for each extracted concept, whether to MERGE into an
existing node (same concept) or CREATE a new one. Merge is gated by an exact
name hit, or vector similarity within the workspace followed by an LLM
confirmation. The functional unique index `(workspace_id, lower(name))` is the
race backstop: a lost merge lock degrades to "found existing", never a duplicate.
"""

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai import embed_text, match_concept, merge_descriptions
from app.config import get_settings
from app.models import Concept, ConceptAlias, ConceptMention, Edge


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
    short-lived session so the merge LLM call (`confirm_same_concept`) runs with
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

    # Fast path: exact (case-insensitive) name already present — no LLM needed.
    async with sessionmaker() as session:
        existing_id = (
            await session.execute(
                select(Concept.id).where(
                    Concept.workspace_id == workspace_id,
                    func.lower(Concept.name) == key,
                )
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
) -> None:
    """Insert an edge, or increment its weight if the same relation recurs."""
    if source_concept_id == target_concept_id:
        return  # no self-loops
    await session.execute(
        pg_insert(Edge)
        .values(
            workspace_id=workspace_id,
            source_concept_id=source_concept_id,
            target_concept_id=target_concept_id,
            relation=relation,
            weight=1,
        )
        .on_conflict_do_update(
            constraint="uq_edges_triple",
            set_={"weight": Edge.weight + 1},
        )
    )
