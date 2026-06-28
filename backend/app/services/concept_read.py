"""Concept detail + source passages.

Shared by the HTTP concepts router and the MCP ``concept_get`` tool. Returns the
provenance the graph payload omits for size (aliases, documents, mention/edge
counts) and, separately, the full source passages a concept appears in. Neighbour
concepts are derived client-side from the loaded graph, so they aren't repeated.
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
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
from app.services.workspaces import require_workspace


class ConceptDocument(BaseModel):
    document_id: uuid.UUID
    title: str


class ConceptDetail(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_label: str | None
    aliases: list[str]  # merged synonyms
    documents: list[ConceptDocument]  # provenance: docs that mention it
    mentions: int  # total mention rows
    degree: int  # edges incident to this concept


class ConceptPassage(BaseModel):
    document_id: uuid.UUID
    document_title: str
    chunk_id: uuid.UUID
    content: str  # the full source chunk text the mention was found in


class ConceptPassages(BaseModel):
    passages: list[ConceptPassage]


async def get_concept_detail(
    session: AsyncSession, user_id: str, concept_id: uuid.UUID
) -> ConceptDetail:
    """One concept with its provenance. Raises 404 if absent, 403/404 if the
    caller can't access its workspace (via ``require_workspace``)."""
    concept = await session.get(Concept, concept_id)
    if concept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    await require_workspace(session, user_id, concept.workspace_id)

    cluster_label: str | None = None
    if concept.cluster_id is not None:
        cluster_label = (
            await session.execute(
                select(Cluster.label).where(Cluster.id == concept.cluster_id)
            )
        ).scalar_one_or_none()

    aliases = (
        (
            await session.execute(
                select(ConceptAlias.alias)
                .where(ConceptAlias.concept_id == concept_id)
                .order_by(ConceptAlias.alias)
            )
        )
        .scalars()
        .all()
    )

    doc_rows = (
        await session.execute(
            select(Document.id, Document.title)
            .join(ConceptMention, ConceptMention.document_id == Document.id)
            .where(ConceptMention.concept_id == concept_id)
            .group_by(Document.id, Document.title)
            .order_by(Document.title)
        )
    ).all()

    mentions = (
        await session.execute(
            select(func.count())
            .select_from(ConceptMention)
            .where(ConceptMention.concept_id == concept_id)
        )
    ).scalar_one()

    degree = (
        await session.execute(
            select(func.count())
            .select_from(Edge)
            .where(
                Edge.workspace_id == concept.workspace_id,
                or_(
                    Edge.source_concept_id == concept_id,
                    Edge.target_concept_id == concept_id,
                ),
            )
        )
    ).scalar_one()

    return ConceptDetail(
        id=concept.id,
        name=concept.name,
        description=concept.description,
        cluster_label=cluster_label,
        aliases=list(aliases),
        documents=[ConceptDocument(document_id=r[0], title=r[1]) for r in doc_rows],
        mentions=mentions,
        degree=degree,
    )


async def get_concept_passages(
    session: AsyncSession, user_id: str, concept_id: uuid.UUID
) -> ConceptPassages:
    """Source passages backing a concept (capped at 200, ordered by document then
    chunk). Raises 404/403 like :func:`get_concept_detail`."""
    concept = await session.get(Concept, concept_id)
    if concept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    await require_workspace(session, user_id, concept.workspace_id)

    rows = (
        await session.execute(
            select(Document.id, Document.title, Chunk.id, Chunk.content)
            .join(ConceptMention, ConceptMention.chunk_id == Chunk.id)
            .join(Document, Document.id == ConceptMention.document_id)
            .where(ConceptMention.concept_id == concept_id)
            .order_by(Document.title, Chunk.id)
            .limit(200)
        )
    ).all()

    return ConceptPassages(
        passages=[
            ConceptPassage(
                document_id=r[0], document_title=r[1], chunk_id=r[2], content=r[3]
            )
            for r in rows
        ]
    )
