"""Workspace invites — bring a mentor (or member) into a project.

There is no users table, so invites are keyed by **email** and the invitee's
Cognito sub is bound only when they accept (their id token then carries the
email). The token is an unguessable secret; possession + a matching email grants
membership. One live (pending) invite per (workspace, email) is enforced by the
partial unique index ``uq_invites_ws_email_pending``.
"""

import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.config import get_settings
from app.db import get_session
from app.models import Workspace, WorkspaceInvite, WorkspaceMember
from app.services.workspaces import can_manage_members, require_workspace_role

router = APIRouter(prefix="/api", tags=["invites"])

# Roles a workspace owner may grant via an invite. 'owner' is never invitable.
INVITABLE_ROLES = {"mentor", "member"}


class InviteCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    role: str = "mentor"


class InviteOut(BaseModel):
    invite_id: uuid.UUID
    token: str
    accept_url: str
    email: str
    role: str
    status: str


class InvitePreview(BaseModel):
    workspace_name: str
    role: str
    status: str


class AcceptOut(BaseModel):
    workspace_id: uuid.UUID


class MemberOut(BaseModel):
    user_id: str  # Cognito sub (no users table → no email/display name to resolve)
    role: str
    is_you: bool


class PendingInviteOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    created_at: datetime


class MembersOut(BaseModel):
    members: list[MemberOut]
    pending_invites: list[PendingInviteOut]


def _accept_url(token: str) -> str:
    return f"{get_settings().frontend_origin}/invite/{token}"


def _invite_out(invite: WorkspaceInvite) -> InviteOut:
    return InviteOut(
        invite_id=invite.id,
        token=invite.token,
        accept_url=_accept_url(invite.token),
        email=invite.email,
        role=invite.role,
        status=invite.status,
    )


@router.post(
    "/workspaces/{workspace_id}/invites",
    response_model=InviteOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_invite(
    workspace_id: uuid.UUID,
    body: InviteCreate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> InviteOut:
    """Invite someone by email (owner only). Idempotent: re-inviting the same
    email returns the existing pending invite rather than erroring."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    if not can_manage_members(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only the owner can invite")
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "invalid email")
    if body.role not in INVITABLE_ROLES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "role must be mentor or member"
        )

    async def _existing() -> WorkspaceInvite | None:
        return (
            await session.execute(
                select(WorkspaceInvite).where(
                    WorkspaceInvite.workspace_id == workspace_id,
                    func.lower(WorkspaceInvite.email) == email,
                    WorkspaceInvite.status == "pending",
                )
            )
        ).scalar_one_or_none()

    existing = await _existing()
    if existing is not None:
        return _invite_out(existing)

    invite = WorkspaceInvite(
        workspace_id=workspace_id,
        email=email,
        role=body.role,
        token=secrets.token_urlsafe(32),
        invited_by=user.id,
        status="pending",
    )
    session.add(invite)
    try:
        await session.flush()
    except IntegrityError:
        # Lost a race against a concurrent invite for the same email — return the
        # winner (the partial unique index is the backstop).
        await session.rollback()
        winner = await _existing()
        if winner is None:
            raise
        return _invite_out(winner)
    await session.commit()
    return _invite_out(invite)


@router.get("/invites/{token}", response_model=InvitePreview)
async def get_invite(
    token: str,
    session: AsyncSession = Depends(get_session),
) -> InvitePreview:
    """Preview an invite by token. **Unauthenticated** so a logged-out invitee
    can see what they're accepting; the token itself is the secret."""
    invite = (
        await session.execute(
            select(WorkspaceInvite).where(WorkspaceInvite.token == token)
        )
    ).scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "invite not found")
    workspace = await session.get(Workspace, invite.workspace_id)
    name = (workspace.name if workspace and workspace.name else "a research project")
    return InvitePreview(workspace_name=name, role=invite.role, status=invite.status)


@router.post("/invites/{token}/accept", response_model=AcceptOut)
async def accept_invite(
    token: str,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AcceptOut:
    """Accept an invite: bind the caller's sub as a workspace member. The caller's
    email must match the invite's (the binding point for the email-keyed flow)."""
    invite = (
        await session.execute(
            select(WorkspaceInvite).where(WorkspaceInvite.token == token)
        )
    ).scalar_one_or_none()
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "invite not found")
    if invite.status != "pending":
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"invite is {invite.status}, not pending"
        )
    if user.email and invite.email.lower() != user.email.lower():
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "this invite was sent to a different email"
        )

    await session.execute(
        pg_insert(WorkspaceMember)
        .values(
            workspace_id=invite.workspace_id, user_id=user.id, role=invite.role
        )
        .on_conflict_do_nothing()
    )
    invite.status = "accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    invite.accepted_by = user.id
    await session.commit()
    return AcceptOut(workspace_id=invite.workspace_id)


@router.delete(
    "/workspaces/{workspace_id}/invites/{invite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_invite(
    workspace_id: uuid.UUID,
    invite_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Revoke a pending invite (owner only)."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    if not can_manage_members(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only the owner can revoke")
    invite = await session.get(WorkspaceInvite, invite_id)
    if invite is None or invite.workspace_id != workspace_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "invite not found")
    invite.status = "revoked"
    await session.commit()


@router.get("/workspaces/{workspace_id}/members", response_model=MembersOut)
async def list_members(
    workspace_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MembersOut:
    """Members + pending invites for the workspace (owner or mentor)."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    if role not in {"owner", "mentor"}:
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

    invite_rows = (
        await session.execute(
            select(WorkspaceInvite)
            .where(
                WorkspaceInvite.workspace_id == workspace_id,
                WorkspaceInvite.status == "pending",
            )
            .order_by(WorkspaceInvite.created_at)
        )
    ).scalars().all()
    pending = [
        PendingInviteOut(id=i.id, email=i.email, role=i.role, created_at=i.created_at)
        for i in invite_rows
    ]
    return MembersOut(members=members, pending_invites=pending)
