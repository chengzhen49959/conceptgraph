"""Workspace bootstrapping + access control.

Every user gets one private personal workspace. `require_workspace` is the single
place that decides whether a caller may touch a workspace (owner or member) — both
the documents and graph routers defer to it, so the rule lives in one module.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Workspace, WorkspaceMember


async def ensure_personal_workspace(session: AsyncSession, user_id: str) -> Workspace:
    """Return the user's private workspace, creating it on first call.

    Race-safe: INSERT ... ON CONFLICT DO NOTHING against the partial unique index
    ``uq_workspaces_owner_private`` (one private workspace per user), then
    re-select. Also ensures an owner membership row.
    """

    async def _get() -> Workspace | None:
        return (
            await session.execute(
                select(Workspace).where(
                    Workspace.owner_id == user_id, Workspace.type == "private"
                )
            )
        ).scalar_one_or_none()

    workspace = await _get()
    if workspace is None:
        await session.execute(
            pg_insert(Workspace)
            .values(owner_id=user_id, type="private")
            .on_conflict_do_nothing(
                index_elements=["owner_id"], index_where=text("type = 'private'")
            )
        )
        await session.flush()
        workspace = await _get()
    assert workspace is not None

    await session.execute(
        pg_insert(WorkspaceMember)
        .values(workspace_id=workspace.id, user_id=user_id, role="owner")
        .on_conflict_do_nothing()
    )
    return workspace


async def require_workspace(
    session: AsyncSession, user_id: str, workspace_id: uuid.UUID
) -> Workspace:
    """Load a workspace the caller may access (owner or member), else 403/404."""
    workspace = await session.get(Workspace, workspace_id)
    if workspace is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "workspace not found")
    if workspace.owner_id != user_id:
        member = (
            await session.execute(
                select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.user_id == user_id,
                )
            )
        ).scalar_one_or_none()
        if member is None:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "not a member of this workspace"
            )
    return workspace
