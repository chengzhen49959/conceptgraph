"""Workspace listing — also bootstraps the caller's personal workspace."""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Workspace, WorkspaceMember
from app.services.workspaces import ensure_personal_workspace

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


class WorkspaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: str
    type: str


@router.get("", response_model=list[WorkspaceOut])
async def list_workspaces(
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[Workspace]:
    """Return the caller's workspaces, creating their personal one on first call."""
    await ensure_personal_workspace(session, user.id)
    await session.commit()

    # Owned workspaces + any shared workspace the user is a member of.
    member_ids = (
        select(WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == user.id)
        .scalar_subquery()
    )
    rows = (
        await session.execute(
            select(Workspace)
            .where(
                (Workspace.owner_id == user.id) | (Workspace.id.in_(member_ids))
            )
            .order_by(Workspace.created_at)
        )
    ).scalars().all()
    return list(rows)
