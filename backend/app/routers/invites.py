"""Workspace sharing — reusable share links + the member roster.

Sharing is link-only (Notion "Copy link"): each workspace has at most one
``WorkspaceShareLink`` (lazily created, with an ``enabled`` toggle and a mutable
role). Anyone who opens the link and logs in joins at the link's role — there is
no email binding. The token is an unguessable secret; possession + the link being
enabled grants membership.
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.config import get_settings
from app.db import get_session
from app.models import Workspace, WorkspaceMember, WorkspaceShareLink
from app.services.workspaces import can_manage_members, require_workspace_role

router = APIRouter(prefix="/api", tags=["sharing"])

# Roles a workspace owner may grant via the share link. 'owner' is never grantable.
INVITABLE_ROLES = {"editor", "commenter", "viewer"}


class InvitePreview(BaseModel):
    workspace_name: str
    role: str
    status: str  # enabled | disabled


class ShareLinkOut(BaseModel):
    enabled: bool
    role: str
    token: str
    accept_url: str


class ShareLinkUpdate(BaseModel):
    enabled: bool | None = None
    role: str | None = None


class AcceptOut(BaseModel):
    workspace_id: uuid.UUID


class MemberOut(BaseModel):
    user_id: str  # Cognito sub (no users table → no email/display name to resolve)
    role: str
    is_you: bool


class MembersOut(BaseModel):
    members: list[MemberOut]


def _accept_url(token: str) -> str:
    return f"{get_settings().frontend_origin}/invite/{token}"


def _workspace_name(workspace: Workspace | None) -> str:
    return workspace.name if workspace and workspace.name else "a research project"


def _share_link_out(link: WorkspaceShareLink) -> ShareLinkOut:
    return ShareLinkOut(
        enabled=link.enabled,
        role=link.role,
        token=link.token,
        accept_url=_accept_url(link.token),
    )


@router.get("/workspaces/{workspace_id}/members", response_model=MembersOut)
async def list_members(
    workspace_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MembersOut:
    """The workspace's members (owner or editor)."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    if role not in {"owner", "editor"}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not allowed")

    member_rows = (
        await session.execute(
            select(WorkspaceMember.user_id, WorkspaceMember.role).where(
                WorkspaceMember.workspace_id == workspace_id
            )
        )
    ).all()
    members = [
        MemberOut(user_id=uid, role=r, is_you=(uid == user.id))
        for uid, r in member_rows
    ]
    return MembersOut(members=members)


# --- Share link (Notion "Copy link": reusable, not email-bound) --------------


async def _get_or_create_share_link(
    session: AsyncSession, workspace_id: uuid.UUID, user_id: str
) -> WorkspaceShareLink:
    """The workspace's single share link, lazily created (disabled) on first use
    so the panel always has a stable token to show + copy."""
    link = (
        await session.execute(
            select(WorkspaceShareLink).where(
                WorkspaceShareLink.workspace_id == workspace_id
            )
        )
    ).scalar_one_or_none()
    if link is not None:
        return link
    link = WorkspaceShareLink(
        workspace_id=workspace_id,
        role="viewer",
        enabled=False,
        token=secrets.token_urlsafe(32),
        created_by=user_id,
    )
    session.add(link)
    try:
        await session.flush()
        await session.commit()
    except IntegrityError:
        # Concurrent first-touch — reuse the winner (unique index on workspace_id).
        await session.rollback()
        link = (
            await session.execute(
                select(WorkspaceShareLink).where(
                    WorkspaceShareLink.workspace_id == workspace_id
                )
            )
        ).scalar_one()
    return link


@router.get("/workspaces/{workspace_id}/share-link", response_model=ShareLinkOut)
async def get_share_link(
    workspace_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ShareLinkOut:
    """The workspace's reusable share link (owner only)."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    if not can_manage_members(role):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "only the owner can manage the link"
        )
    link = await _get_or_create_share_link(session, workspace_id, user.id)
    return _share_link_out(link)


@router.patch("/workspaces/{workspace_id}/share-link", response_model=ShareLinkOut)
async def update_share_link(
    workspace_id: uuid.UUID,
    body: ShareLinkUpdate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ShareLinkOut:
    """Enable/disable the link or change the role it grants (owner only).
    Disabling is how the link is revoked."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    if not can_manage_members(role):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "only the owner can manage the link"
        )
    if body.role is not None and body.role not in INVITABLE_ROLES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "role must be editor, commenter, or viewer",
        )
    link = await _get_or_create_share_link(session, workspace_id, user.id)
    if body.enabled is not None:
        link.enabled = body.enabled
    if body.role is not None:
        link.role = body.role
    link.updated_at = datetime.now(timezone.utc)
    await session.commit()
    return _share_link_out(link)


@router.get("/share/{token}", response_model=InvitePreview)
async def preview_share_link(
    token: str,
    session: AsyncSession = Depends(get_session),
) -> InvitePreview:
    """Preview a share link by token. **Unauthenticated** so a logged-out invitee
    can see what they're joining before signing in; the token itself is the
    secret."""
    link = (
        await session.execute(
            select(WorkspaceShareLink).where(WorkspaceShareLink.token == token)
        )
    ).scalar_one_or_none()
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "link not found")
    workspace = await session.get(Workspace, link.workspace_id)
    return InvitePreview(
        workspace_name=_workspace_name(workspace),
        role=link.role,
        status="enabled" if link.enabled else "disabled",
    )


@router.post("/share/{token}/accept", response_model=AcceptOut)
async def accept_share_link(
    token: str,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AcceptOut:
    """Join a workspace via its share link. There is no email match — anyone
    logged in who has the link may join at the link's role. An existing member
    keeps their current role (on_conflict_do_nothing: no downgrade, no upgrade)."""
    link = (
        await session.execute(
            select(WorkspaceShareLink).where(WorkspaceShareLink.token == token)
        )
    ).scalar_one_or_none()
    if link is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "link not found")
    if not link.enabled:
        raise HTTPException(status.HTTP_409_CONFLICT, "this link is no longer active")

    workspace = await session.get(Workspace, link.workspace_id)
    if workspace is not None and workspace.owner_id == user.id:
        # The owner already has full access; joining is a no-op.
        return AcceptOut(workspace_id=link.workspace_id)

    await session.execute(
        pg_insert(WorkspaceMember)
        .values(workspace_id=link.workspace_id, user_id=user.id, role=link.role)
        .on_conflict_do_nothing()
    )
    await session.commit()
    return AcceptOut(workspace_id=link.workspace_id)
