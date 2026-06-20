"""Workspaces API — list / create / rename / delete projects.

A workspace is the isolation + ownership unit (one research project = one
workspace). Every user has one auto-created private "Personal" workspace; shared
workspaces are explicit projects a student owns and invites a mentor into. The
list endpoint optionally folds in per-workspace stats for the project dashboard.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Concept, Document, Workspace, WorkspaceMember
from app.services.workspaces import (
    can_manage_members,
    ensure_personal_workspace,
    require_workspace_role,
    touch_workspace,
)

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


def _display_name(workspace: Workspace) -> str:
    """The name to show: the stored name, else a type-appropriate default. The
    private workspace has no stored name and reads as "Personal"."""
    if workspace.name:
        return workspace.name
    return "Personal" if workspace.type == "private" else "Untitled project"


class WorkspaceCard(BaseModel):
    """A workspace as the dashboard / switcher sees it. Stats are populated only
    when the list is requested ``?with_stats=1`` (they cost extra queries)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str  # display name (never null — defaulted server-side)
    type: str  # private | shared
    role: str  # this caller's role: owner | mentor | member
    icon: str | None = None  # IconPark icon name, e.g. "Microscope"
    icon_color: str | None = None  # accent hex, e.g. "#2F88FF"
    concept_count: int | None = None
    document_count: int | None = None
    last_activity: datetime | None = None


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    icon: str | None = Field(default=None, max_length=64)
    icon_color: str | None = Field(default=None, max_length=32)


class WorkspacePatch(BaseModel):
    """Partial update — only the provided fields change. ``None`` means "leave
    as-is", so renaming and re-iconing share one endpoint without clobbering."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    icon: str | None = Field(default=None, max_length=64)
    icon_color: str | None = Field(default=None, max_length=32)


@router.get("", response_model=list[WorkspaceCard])
async def list_workspaces(
    with_stats: bool = Query(default=False),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[WorkspaceCard]:
    """Return the caller's workspaces (owned + member), bootstrapping their
    personal one on first call. With ``with_stats=1`` each card also carries
    concept/document counts and last-activity for the dashboard."""
    await ensure_personal_workspace(session, user.id)
    await session.commit()

    member_ids = (
        select(WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == user.id)
        .scalar_subquery()
    )
    workspaces = list(
        (
            await session.execute(
                select(Workspace)
                .where(
                    (Workspace.owner_id == user.id) | (Workspace.id.in_(member_ids))
                )
                .order_by(Workspace.created_at)
            )
        )
        .scalars()
        .all()
    )
    ws_ids = [w.id for w in workspaces]

    # Caller's role per workspace: owner if they own it, else the membership row.
    member_roles = dict(
        (
            await session.execute(
                select(WorkspaceMember.workspace_id, WorkspaceMember.role).where(
                    WorkspaceMember.user_id == user.id,
                    WorkspaceMember.workspace_id.in_(ws_ids),
                )
            )
        ).all()
    )

    concept_counts: dict[uuid.UUID, int] = {}
    document_counts: dict[uuid.UUID, int] = {}
    if with_stats:
        concept_counts = dict(
            (
                await session.execute(
                    select(Concept.workspace_id, func.count())
                    .where(Concept.workspace_id.in_(ws_ids))
                    .group_by(Concept.workspace_id)
                )
            ).all()
        )
        document_counts = dict(
            (
                await session.execute(
                    select(Document.workspace_id, func.count())
                    .where(Document.workspace_id.in_(ws_ids))
                    .group_by(Document.workspace_id)
                )
            ).all()
        )

    return [
        WorkspaceCard(
            id=w.id,
            name=_display_name(w),
            type=w.type,
            role="owner" if w.owner_id == user.id else member_roles.get(w.id, "member"),
            icon=w.icon,
            icon_color=w.icon_color,
            concept_count=concept_counts.get(w.id, 0) if with_stats else None,
            document_count=document_counts.get(w.id, 0) if with_stats else None,
            last_activity=(w.updated_at or w.created_at) if with_stats else None,
        )
        for w in workspaces
    ]


@router.post("", response_model=WorkspaceCard, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: WorkspaceCreate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WorkspaceCard:
    """Create a new shared (project) workspace owned by the caller."""
    workspace = Workspace(
        owner_id=user.id,
        type="shared",
        name=body.name.strip(),
        icon=body.icon,
        icon_color=body.icon_color,
    )
    session.add(workspace)
    await session.flush()  # assign the id before the member row references it
    await session.execute(
        pg_insert(WorkspaceMember)
        .values(workspace_id=workspace.id, user_id=user.id, role="owner")
        .on_conflict_do_nothing()
    )
    await session.commit()
    return WorkspaceCard(
        id=workspace.id,
        name=_display_name(workspace),
        type=workspace.type,
        role="owner",
        icon=workspace.icon,
        icon_color=workspace.icon_color,
    )


@router.patch("/{workspace_id}", response_model=WorkspaceCard)
async def update_workspace(
    workspace_id: uuid.UUID,
    body: WorkspacePatch,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WorkspaceCard:
    """Update a workspace's name and/or icon (owner only). Only the fields
    present in the body change."""
    workspace, role = await require_workspace_role(session, user.id, workspace_id)
    if not can_manage_members(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only the owner can edit")
    if body.name is not None:
        workspace.name = body.name.strip()
    if body.icon is not None:
        workspace.icon = body.icon
    if body.icon_color is not None:
        workspace.icon_color = body.icon_color
    await touch_workspace(session, workspace_id)
    await session.commit()
    return WorkspaceCard(
        id=workspace.id,
        name=_display_name(workspace),
        type=workspace.type,
        role=role,
        icon=workspace.icon,
        icon_color=workspace.icon_color,
    )


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a workspace and everything in it (owner only). The personal
    (private) workspace cannot be deleted."""
    workspace, role = await require_workspace_role(session, user.id, workspace_id)
    if not can_manage_members(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only the owner can delete")
    if workspace.type == "private":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "cannot delete your personal workspace"
        )
    await session.delete(workspace)  # FK CASCADE removes all workspace-scoped rows
    await session.commit()
