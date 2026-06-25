"""Unified activity feed — graph edits + annotations in one timeline (M3+).

The Activity panel needs to answer "what changed, who did it, and have I seen it?"
across BOTH change sources: structural graph edits (recorded in ``graph_audit``)
and mentor/student annotations (``annotations``). Rather than copy annotation
events into the audit table (which is graph-shaped: entity_type concept|edge,
before/after snapshots for undo), this router MERGES the two sources at read time
into a single ``ActivityEvent`` stream. Each table stays cleanly shaped; the
feed-merge complexity lives here, behind one interface.

Undo stays in ``graph_edit`` (only graph events are undoable); a graph event here
carries ``audit_id`` so the client reuses ``POST /api/graph/audit/{id}/undo``.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Annotation, Concept, GraphAudit, WorkspaceMember
from app.routers.graph_edit import _summary  # human summary for a graph audit row
from app.services.workspaces import can_edit_graph, require_workspace_role

router = APIRouter(prefix="/api/activity", tags=["activity"])

_UNREAD_CAP = 99


class ActivityEvent(BaseModel):
    # Stable client key. Graph: the audit uuid. Annotation: "ann:{id}:created" or
    # "ann:{id}:resolved" (one annotation yields up to two timeline events).
    id: str
    source_type: str  # "graph" | "annotation"
    action: str  # machine: concept.create | annotation.highlight | *.resolved | …
    summary: str  # human-readable, already localized to English verbs
    actor_id: str | None  # None for a resolved event (no resolver recorded)
    actor_role: str | None  # set for graph events; None for annotations (no name)
    actor_is_you: bool
    target_concept_id: uuid.UUID | None = None  # → click jumps to this concept
    audit_id: uuid.UUID | None = None  # graph events only → undo
    can_undo: bool = False
    undone: bool = False
    created_at: datetime


def _event_type(ev: ActivityEvent) -> str:
    """Coarse category for the client's type filter."""
    if ev.source_type == "graph":
        return "edit"
    if ev.action.startswith("annotation.highlight"):
        return "highlight"
    if ev.action.startswith("annotation.flag"):
        return "flag"
    return "comment"  # comment + reply


def _graph_event(e: GraphAudit, user: CurrentUser, role: str) -> ActivityEvent:
    can_undo = (
        e.undone_by is None
        and (role == "owner" or e.actor_id == user.id)
        and can_edit_graph(role)
    )
    return ActivityEvent(
        id=str(e.id),
        source_type="graph",
        action=e.action,
        summary=_summary(e),
        actor_id=e.actor_id,
        actor_role=e.actor_role,
        actor_is_you=e.actor_id == user.id,
        # entity_id is the concept id for concept.* events (None target for edges).
        target_concept_id=e.entity_id if e.entity_type == "concept" else None,
        audit_id=e.id,
        can_undo=can_undo,
        undone=e.undone_by is not None,
        created_at=e.created_at,
    )


def _annotation_events(
    a: Annotation, user: CurrentUser, names: dict[uuid.UUID, str]
) -> list[ActivityEvent]:
    """A "created" event always; a "resolved" event too when status=resolved."""
    where = (
        names.get(a.target_concept_id)
        or a.target_cluster_label
        or ("a relation" if a.target_edge_id else "the graph")
    )
    is_you = a.author_id == user.id
    if a.parent_id is not None:
        action, summary = "annotation.reply", f'Replied: "{(a.body or "")[:60]}"'
    elif a.kind == "comment":
        body = f': "{a.body[:50]}"' if a.body else ""
        action, summary = "annotation.comment", f'Commented on "{where}"{body}'
    elif a.kind == "highlight":
        action, summary = "annotation.highlight", f'Highlighted "{where}"'
    elif a.kind == "flag":
        action, summary = "annotation.flag", f'Flagged "{where}"'
    else:
        action, summary = f"annotation.{a.kind}", f'Noted "{where}"'

    events = [
        ActivityEvent(
            id=f"ann:{a.id}:created",
            source_type="annotation",
            action=action,
            summary=summary,
            actor_id=a.author_id,
            actor_role=None,
            actor_is_you=is_you,
            target_concept_id=a.target_concept_id,
            created_at=a.created_at,
        )
    ]
    if a.status == "resolved":
        verb = {"highlight": "Removed highlight on", "flag": "Cleared flag on"}.get(
            a.kind, "Resolved note on"
        )
        events.append(
            ActivityEvent(
                id=f"ann:{a.id}:resolved",
                source_type="annotation",
                action=f"{action}.resolved",
                summary=f'{verb} "{where}"',
                actor_id=None,  # who resolved it isn't recorded on the row
                actor_role=None,
                actor_is_you=False,
                target_concept_id=a.target_concept_id,
                created_at=a.updated_at,
            )
        )
    return events


@router.get("", response_model=list[ActivityEvent])
async def get_activity(
    workspace_id: uuid.UUID = Query(...),
    before: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    scope: str = Query(default="all"),  # all | mine | others
    types: str | None = Query(default=None),  # csv: edit,highlight,flag,comment
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ActivityEvent]:
    """Merged, newest-first activity for a workspace: graph edits + annotations."""
    _, role = await require_workspace_role(session, user.id, workspace_id)

    aq = (
        select(GraphAudit)
        .where(GraphAudit.workspace_id == workspace_id)
        .order_by(GraphAudit.created_at.desc())
        .limit(limit)
    )
    nq = (
        select(Annotation)
        .where(Annotation.workspace_id == workspace_id)
        .order_by(Annotation.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        aq = aq.where(GraphAudit.created_at < before)
        nq = nq.where(Annotation.created_at < before)
    audits = (await session.execute(aq)).scalars().all()
    anns = (await session.execute(nq)).scalars().all()

    cids = {a.target_concept_id for a in anns if a.target_concept_id}
    names: dict[uuid.UUID, str] = {}
    if cids:
        rows = (
            await session.execute(
                select(Concept.id, Concept.name).where(Concept.id.in_(cids))
            )
        ).all()
        names = {cid: name for cid, name in rows}

    events = [_graph_event(e, user, role) for e in audits]
    for a in anns:
        events.extend(_annotation_events(a, user, names))

    # A resolved event's time (updated_at) can exceed the create-time cursor; trim.
    if before is not None:
        events = [ev for ev in events if ev.created_at < before]
    if scope == "mine":
        events = [ev for ev in events if ev.actor_is_you]
    elif scope == "others":
        events = [ev for ev in events if ev.actor_id and not ev.actor_is_you]
    if types:
        wanted = {t.strip() for t in types.split(",") if t.strip()}
        events = [ev for ev in events if _event_type(ev) in wanted]

    events.sort(key=lambda ev: ev.created_at, reverse=True)
    return events[:limit]


@router.get("/unread_count")
async def unread_count(
    workspace_id: uuid.UUID = Query(...),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, int]:
    """Count of events by *other* members since this member last opened the feed.

    Counts graph edits + annotation creates by others; resolved events are not
    attributed to a resolver so they don't drive the badge. Capped at 99.
    """
    await require_workspace_role(session, user.id, workspace_id)
    member = await session.get(WorkspaceMember, (workspace_id, user.id))
    seen = member.last_seen_activity_at if member else None

    gq = select(func.count()).select_from(GraphAudit).where(
        GraphAudit.workspace_id == workspace_id, GraphAudit.actor_id != user.id
    )
    nq = select(func.count()).select_from(Annotation).where(
        Annotation.workspace_id == workspace_id, Annotation.author_id != user.id
    )
    if seen is not None:
        gq = gq.where(GraphAudit.created_at > seen)
        nq = nq.where(Annotation.created_at > seen)
    g = (await session.execute(gq)).scalar_one()
    n = (await session.execute(nq)).scalar_one()
    return {"count": min(_UNREAD_CAP, g + n)}


@router.post("/seen")
async def mark_seen(
    workspace_id: uuid.UUID = Query(...),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    """Mark the feed read up to now (resets the unread badge for this member)."""
    await require_workspace_role(session, user.id, workspace_id)
    await session.execute(
        update(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user.id,
        )
        .values(last_seen_activity_at=func.now())
    )
    await session.commit()
    return {"ok": True}
