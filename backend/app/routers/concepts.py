"""Concept detail — powers the graph's concept side panel.

Returns one concept with the provenance the graph payload omits for size:
its aliases (merged synonyms), the documents that mention it, and how many
edges it touches. Neighbour concepts are derived client-side from the already
loaded graph, so they aren't repeated here.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Cluster, Concept, ConceptAlias, ConceptMention, Document, Edge
from app.services.workspaces import require_workspace

router = APIRouter(prefix="/api/concepts", tags=["concepts"])


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


@router.get("/{concept_id}", response_model=ConceptDetail)
async def get_concept(
    concept_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConceptDetail:
    concept = await session.get(Concept, concept_id)
    if concept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    await require_workspace(session, user.id, concept.workspace_id)

    cluster_label: str | None = None
    if concept.cluster_id is not None:
        cluster_label = (
            await session.execute(
                select(Cluster.label).where(Cluster.id == concept.cluster_id)
            )
        ).scalar_one_or_none()

    aliases = (
        await session.execute(
            select(ConceptAlias.alias)
            .where(ConceptAlias.concept_id == concept_id)
            .order_by(ConceptAlias.alias)
        )
    ).scalars().all()

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
