"""Concept detail — powers the graph's concept side panel.

The read logic and response models live in ``app.services.concept_read`` (shared
with the MCP ``concept_get`` tool).
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.services.concept_read import (
    ConceptDetail,
    ConceptDocument,  # noqa: F401 — re-exported for importers of this router
    ConceptPassage,  # noqa: F401
    ConceptPassages,
    get_concept_detail,
    get_concept_passages,
)

router = APIRouter(prefix="/api/concepts", tags=["concepts"])


@router.get("/{concept_id}", response_model=ConceptDetail)
async def get_concept(
    concept_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConceptDetail:
    return await get_concept_detail(session, user.id, concept_id)


@router.get("/{concept_id}/passages", response_model=ConceptPassages)
async def get_concept_passages_route(
    concept_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConceptPassages:
    """Source passages backing a concept — the evidence the graph omits."""
    return await get_concept_passages(session, user.id, concept_id)
