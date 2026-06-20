"""Workspace bootstrapping + access control.

Every user gets one private personal workspace. `require_workspace` is the single
place that decides whether a caller may touch a workspace (owner or member) — both
the documents and graph routers defer to it, so the rule lives in one module.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select, text, update
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


async def require_workspace_role(
    session: AsyncSession, user_id: str, workspace_id: uuid.UUID
) -> tuple[Workspace, str]:
    """Load a workspace the caller may access and return ``(workspace, role)``.

    ``role`` is ``"owner"`` when the caller owns the workspace, else the
    membership row's role (``"mentor"`` | ``"member"``). 404 if the workspace
    doesn't exist, 403 if the caller is neither owner nor member. This is the
    single place that decides *whether* a caller may touch a workspace and *as
    what* — every collaboration endpoint derives its permissions from the role
    returned here (see the capability helpers below).
    """
    workspace = await session.get(Workspace, workspace_id)
    if workspace is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "workspace not found")
    if workspace.owner_id == user_id:
        return workspace, "owner"
    member = (
        await session.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not a member of this workspace")
    return workspace, member.role


async def require_workspace(
    session: AsyncSession, user_id: str, workspace_id: uuid.UUID
) -> Workspace:
    """Load a workspace the caller may access (owner or member), else 403/404.

    Thin wrapper over :func:`require_workspace_role` for callers that only need
    the access check + the workspace row, not the role.
    """
    workspace, _ = await require_workspace_role(session, user_id, workspace_id)
    return workspace


# --- Capability policy --------------------------------------------------------
# Role → permission, centralized so the rules live in one module instead of being
# scattered across routers. Routers call these and raise 403 themselves, e.g.
# ``if not can_edit_graph(role): raise HTTPException(403, ...)``.

EDIT_ROLES = frozenset({"owner", "mentor"})


def can_edit_graph(role: str) -> bool:
    """Create / edit / delete concepts and edges, and upload / delete documents."""
    return role in EDIT_ROLES


def can_annotate(role: str) -> bool:
    """Comment on the graph. Anyone with access may comment; the highlight/flag
    kinds are further restricted (see :func:`can_highlight_or_flag`)."""
    return role in {"owner", "mentor", "member"}


def can_highlight_or_flag(role: str) -> bool:
    """Author highlight / flag annotations — the mentor's course-correction tools."""
    return role in EDIT_ROLES


def can_manage_members(role: str) -> bool:
    """Invite / revoke members and rename / delete the workspace (owner only)."""
    return role == "owner"


def can_connect_slack(role: str) -> bool:
    """Connect / disconnect the workspace's Slack integration (owner only)."""
    return role == "owner"


async def touch_workspace(session: AsyncSession, workspace_id: uuid.UUID) -> None:
    """Bump ``updated_at`` to mark recent activity (drives the dashboard's
    "last activity"). A Core UPDATE with ``now()`` — doesn't load/expire the ORM
    row. Caller commits. Reused by rename here and by graph edits / ingest later.
    """
    await session.execute(
        update(Workspace)
        .where(Workspace.id == workspace_id)
        .values(updated_at=func.now())
    )
