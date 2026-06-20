"""Annotations API — mentor highlight / flag / comment threads (M3).

A mentor (or owner) highlights a promising node or flags a wrong direction; any
member may comment and reply. The student reviews these asynchronously. Unlike
graph mutations these don't touch graph structure, so they take no merge-lock.

Capability split (enforced here on top of workspace access):
- comment / reply: anyone with access (owner | mentor | member)
- highlight / flag: owner | mentor only
- resolve / reopen: owner | mentor (any), member (own only)
- edit: author only;  delete: author or owner
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Annotation, Concept, Edge
from app.services.workspaces import (
    can_annotate,
    can_highlight_or_flag,
    require_workspace_role,
    touch_workspace,
)

router = APIRouter(prefix="/api/annotations", tags=["annotations"])

_KINDS = {"highlight", "flag", "comment"}
_TARGETS = {"concept", "edge", "cluster"}


class AnnotationCreate(BaseModel):
    workspace_id: uuid.UUID | None = None  # required for a root (ignored on a reply)
    target_type: str | None = None  # concept | edge | cluster (root only)
    target_concept_id: uuid.UUID | None = None
    target_edge_id: uuid.UUID | None = None
    target_cluster_label: str | None = None
    kind: str = "comment"  # highlight | flag | comment
    body: str | None = None
    parent_id: uuid.UUID | None = None  # set → this is a reply (inherits target)


class AnnotationPatch(BaseModel):
    body: str


class AnnotationOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    author_id: str
    author_is_you: bool
    target_type: str
    target_concept_id: uuid.UUID | None
    target_edge_id: uuid.UUID | None
    target_cluster_label: str | None
    kind: str
    body: str | None
    status: str
    parent_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


def _ann_out(a: Annotation, user: CurrentUser) -> AnnotationOut:
    return AnnotationOut(
        id=a.id,
        workspace_id=a.workspace_id,
        author_id=a.author_id,
        author_is_you=a.author_id == user.id,
        target_type=a.target_type,
        target_concept_id=a.target_concept_id,
        target_edge_id=a.target_edge_id,
        target_cluster_label=a.target_cluster_label,
        kind=a.kind,
        body=a.body,
        status=a.status,
        parent_id=a.parent_id,
        created_at=a.created_at,
        updated_at=a.updated_at,
    )


@router.post("", response_model=AnnotationOut, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    body: AnnotationCreate,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnnotationOut:
    # A reply inherits its workspace + target from the parent; a root needs them.
    parent: Annotation | None = None
    if body.parent_id is not None:
        parent = await session.get(Annotation, body.parent_id)
        if parent is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "parent annotation not found")
        ws_id = parent.workspace_id
    elif body.workspace_id is not None:
        ws_id = body.workspace_id
    else:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "workspace_id is required"
        )

    _, role = await require_workspace_role(session, user.id, ws_id)
    if not can_annotate(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "no access to this workspace")

    kind = "comment" if parent is not None else body.kind
    if kind not in _KINDS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "invalid kind")
    if kind in {"highlight", "flag"} and not can_highlight_or_flag(role):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "only a mentor or owner can highlight or flag"
        )
    if kind == "comment" and not (body.body and body.body.strip()):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "a comment needs a body"
        )

    if parent is not None:
        target_type = parent.target_type
        tcid, teid, tlabel = (
            parent.target_concept_id,
            parent.target_edge_id,
            parent.target_cluster_label,
        )
    else:
        target_type = body.target_type
        tcid, teid, tlabel = (
            body.target_concept_id,
            body.target_edge_id,
            body.target_cluster_label,
        )
        if target_type not in _TARGETS:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, "invalid target_type"
            )
        # Validate the target exists and belongs to this workspace (cross-tenant
        # safety: a mentor in A must not annotate B's concept).
        if target_type == "concept":
            if tcid is None:
                raise HTTPException(422, "target_concept_id required")
            c = await session.get(Concept, tcid)
            if c is None or c.workspace_id != ws_id:
                raise HTTPException(404, "concept not in this workspace")
        elif target_type == "edge":
            if teid is None:
                raise HTTPException(422, "target_edge_id required")
            e = await session.get(Edge, teid)
            if e is None or e.workspace_id != ws_id:
                raise HTTPException(404, "edge not in this workspace")
        else:  # cluster
            if not tlabel:
                raise HTTPException(422, "target_cluster_label required")

    annotation = Annotation(
        workspace_id=ws_id,
        author_id=user.id,
        target_type=target_type,
        target_concept_id=tcid,
        target_edge_id=teid,
        target_cluster_label=tlabel,
        kind=kind,
        body=body.body.strip() if body.body else None,
        status="open",
        parent_id=body.parent_id,
    )
    session.add(annotation)
    await session.flush()
    await touch_workspace(session, ws_id)
    await session.commit()
    return _ann_out(annotation, user)


@router.get("", response_model=list[AnnotationOut])
async def list_annotations(
    workspace_id: uuid.UUID = Query(...),
    status_filter: str | None = Query(default=None, alias="status"),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AnnotationOut]:
    """All annotations for a workspace (roots + replies), oldest first. The client
    builds threads by ``parent_id`` and derives canvas markers from open
    highlight/flag roots."""
    await require_workspace_role(session, user.id, workspace_id)
    query = (
        select(Annotation)
        .where(Annotation.workspace_id == workspace_id)
        .order_by(Annotation.created_at)
    )
    if status_filter:
        query = query.where(Annotation.status == status_filter)
    rows = (await session.execute(query)).scalars().all()
    return [_ann_out(r, user) for r in rows]


@router.get("/concept/{concept_id}", response_model=list[AnnotationOut])
async def concept_annotations(
    concept_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AnnotationOut]:
    concept = await session.get(Concept, concept_id)
    if concept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    await require_workspace_role(session, user.id, concept.workspace_id)
    rows = (
        await session.execute(
            select(Annotation)
            .where(Annotation.target_concept_id == concept_id)
            .order_by(Annotation.created_at)
        )
    ).scalars().all()
    return [_ann_out(r, user) for r in rows]


async def _load_for_access(
    session: AsyncSession, user: CurrentUser, annotation_id: uuid.UUID
) -> tuple[Annotation, str]:
    annotation = await session.get(Annotation, annotation_id)
    if annotation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "annotation not found")
    _, role = await require_workspace_role(session, user.id, annotation.workspace_id)
    return annotation, role


@router.patch("/{annotation_id}", response_model=AnnotationOut)
async def edit_annotation(
    annotation_id: uuid.UUID,
    body: AnnotationPatch,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnnotationOut:
    annotation, _ = await _load_for_access(session, user, annotation_id)
    if annotation.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only the author can edit")
    annotation.body = body.body.strip() or None
    await session.commit()
    return _ann_out(annotation, user)


async def _set_status(
    session: AsyncSession,
    user: CurrentUser,
    annotation_id: uuid.UUID,
    new_status: str,
) -> AnnotationOut:
    annotation, role = await _load_for_access(session, user, annotation_id)
    if role not in {"owner", "mentor"} and annotation.author_id != user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "you can only resolve your own notes"
        )
    annotation.status = new_status
    await session.commit()
    return _ann_out(annotation, user)


@router.post("/{annotation_id}/resolve", response_model=AnnotationOut)
async def resolve_annotation(
    annotation_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnnotationOut:
    return await _set_status(session, user, annotation_id, "resolved")


@router.post("/{annotation_id}/reopen", response_model=AnnotationOut)
async def reopen_annotation(
    annotation_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AnnotationOut:
    return await _set_status(session, user, annotation_id, "open")


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    annotation_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    annotation, role = await _load_for_access(session, user, annotation_id)
    if annotation.author_id != user.id and role != "owner":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "only the author or owner can delete"
        )
    await session.delete(annotation)  # cascade removes replies
    await session.commit()
