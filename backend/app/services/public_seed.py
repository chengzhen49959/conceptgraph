"""Deep-copy a workspace's graph into another workspace.

The public demo (routers/public.py) gives every anonymous visitor their OWN
isolated workspace, seeded so the graph is already populated on first open. That
seed is a deep copy of a template workspace — built once with the normal ingest
pipeline (scripts/seed_public_template.py) — cloned here with no OpenAI calls: it
duplicates the already-computed rows (documents, chunks, concepts, edges,
clusters) and their embeddings, remapping every primary key so the copy is a
fully independent graph the visitor can edit, extend, and delete freely.

Why a clone rather than a shared read-only base + per-visitor overlay: the merge
/ dedup / clustering pipeline is defined per workspace, so a visitor's uploads
must merge against concepts that live in THEIR workspace. A clone gives each
visitor a self-contained graph the existing pipeline operates on unchanged.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Chunk,
    Cluster,
    Concept,
    ConceptAlias,
    ConceptMention,
    Document,
    Edge,
)


async def clone_workspace_graph(
    session: AsyncSession,
    *,
    src_workspace_id: uuid.UUID,
    dst_workspace_id: uuid.UUID,
) -> int:
    """Copy every graph row from ``src`` into ``dst``, returning the concept count.

    Inserts in FK-dependency order (clusters → concepts/documents → chunks →
    aliases/mentions/edges), flushing between stages so each child's foreign keys
    reference rows that already exist. Primary keys are freshly minted and mapped
    old→new; the DB-generated full-text columns (``content_tsv`` / ``text_tsv``)
    are never set — they recompute themselves on insert. The caller commits.
    """

    # --- clusters (self-referential parent_id, so two passes) ------------------
    clusters = (
        await session.execute(select(Cluster).where(Cluster.workspace_id == src_workspace_id))
    ).scalars().all()
    cluster_map: dict[uuid.UUID, uuid.UUID] = {c.id: uuid.uuid4() for c in clusters}
    for c in clusters:
        session.add(
            Cluster(id=cluster_map[c.id], workspace_id=dst_workspace_id, label=c.label)
        )
    await session.flush()
    # Re-point parent_id now that every cloned cluster row exists.
    for c in clusters:
        if c.parent_id is not None:
            cloned = await session.get(Cluster, cluster_map[c.id])
            if cloned is not None:
                cloned.parent_id = cluster_map.get(c.parent_id)
    await session.flush()

    # --- concepts (depend on clusters) -----------------------------------------
    concepts = (
        await session.execute(select(Concept).where(Concept.workspace_id == src_workspace_id))
    ).scalars().all()
    concept_map: dict[uuid.UUID, uuid.UUID] = {c.id: uuid.uuid4() for c in concepts}
    for c in concepts:
        session.add(
            Concept(
                id=concept_map[c.id],
                workspace_id=dst_workspace_id,
                name=c.name,
                canonical=c.canonical,
                origin=c.origin,
                description=c.description,
                embedding=c.embedding,
                cluster_id=cluster_map.get(c.cluster_id) if c.cluster_id else None,
            )
        )

    # --- documents -------------------------------------------------------------
    documents = (
        await session.execute(select(Document).where(Document.workspace_id == src_workspace_id))
    ).scalars().all()
    document_map: dict[uuid.UUID, uuid.UUID] = {d.id: uuid.uuid4() for d in documents}
    for d in documents:
        session.add(
            Document(
                id=document_map[d.id],
                workspace_id=dst_workspace_id,
                title=d.title,
                source_type=d.source_type,
                # Seed docs are already fully processed; carry the terminal status so
                # the demo never shows a phantom "processing" row. duplicate_of/error
                # are deliberately dropped (ids wouldn't map, and a clone is canonical).
                status=d.status,
                s3_key=d.s3_key,  # shared object — read-only for the demo (downloads work)
                source_url=d.source_url,
                source_url_canonical=d.source_url_canonical,
                doc_metadata=d.doc_metadata,
                summary=d.summary,
                summary_embedding=d.summary_embedding,
                body_markdown=d.body_markdown,
                content_hash=d.content_hash,  # per-workspace dedup key — keeps re-upload dedup working
                text_simhash=d.text_simhash,
            )
        )
    await session.flush()

    # --- chunks (depend on documents) ------------------------------------------
    chunk_map: dict[uuid.UUID, uuid.UUID] = {}
    if document_map:
        chunks = (
            await session.execute(
                select(Chunk).where(Chunk.document_id.in_(list(document_map.keys())))
            )
        ).scalars().all()
        for ch in chunks:
            new_id = uuid.uuid4()
            chunk_map[ch.id] = new_id
            session.add(
                Chunk(
                    id=new_id,
                    document_id=document_map[ch.document_id],
                    content=ch.content,
                    content_hash=ch.content_hash,
                    embedding=ch.embedding,
                )
            )
        await session.flush()

    # --- aliases + mentions + edges (depend on concepts / chunks / documents) --
    if concept_map:
        aliases = (
            await session.execute(
                select(ConceptAlias).where(
                    ConceptAlias.concept_id.in_(list(concept_map.keys()))
                )
            )
        ).scalars().all()
        for a in aliases:
            session.add(
                ConceptAlias(concept_id=concept_map[a.concept_id], alias=a.alias)
            )

    if document_map:
        mentions = (
            await session.execute(
                select(ConceptMention).where(
                    ConceptMention.document_id.in_(list(document_map.keys()))
                )
            )
        ).scalars().all()
        for m in mentions:
            # Defensive: skip a mention whose concept/chunk didn't map (shouldn't
            # happen within one consistent workspace, but never insert a dangling FK).
            if m.concept_id not in concept_map or m.chunk_id not in chunk_map:
                continue
            session.add(
                ConceptMention(
                    concept_id=concept_map[m.concept_id],
                    chunk_id=chunk_map[m.chunk_id],
                    document_id=document_map[m.document_id],
                )
            )

    edges = (
        await session.execute(select(Edge).where(Edge.workspace_id == src_workspace_id))
    ).scalars().all()
    for e in edges:
        if e.source_concept_id not in concept_map or e.target_concept_id not in concept_map:
            continue
        session.add(
            Edge(
                workspace_id=dst_workspace_id,
                source_concept_id=concept_map[e.source_concept_id],
                target_concept_id=concept_map[e.target_concept_id],
                relation=e.relation,
                kind=e.kind,
                weight=e.weight,
            )
        )
    await session.flush()

    return len(concept_map)
