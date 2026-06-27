"""Graph mutation API — manual edits to the concept graph (M2).

The read-only projection lives in ``graph.py``; this is the write side. A student
(owner) or mentor hand-edits the research-direction graph — adding direction
nodes (research questions / hypotheses), fixing names, deleting dead ends, wiring
relations — and every human change is recorded in ``graph_audit`` for async
review + undo.

Two invariants protect the ingest pipeline:
1. Every mutation takes the SAME per-workspace Redis lock the worker holds
   (``merge-lock:{workspace_id}``), so a manual edit can't interleave with the
   worker's merge phase. If the worker holds it, we wait briefly then 409. The
   web process reuses the arq pool (an ``ArqRedis`` — a ``redis.asyncio.Redis``)
   for the lock, so both sides coordinate on the same key.
2. Concept creates fold into an existing same-name node via the functional unique
   index (the pipeline's dedup backstop) instead of erroring.
"""

import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from redis.exceptions import LockError
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.extract import RelationType
from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Cluster, Concept, Edge, GraphAudit
from app.services.concepts import upsert_edge
from app.services.workspaces import (
    can_edit_graph,
    ensure_personal_workspace,
    require_workspace_role,
    touch_workspace,
)

router = APIRouter(prefix="/api/graph", tags=["graph-edit"])

# A manual edit is sub-second: short TTL (auto-release if the editor crashes) +
# brief wait (the worker may hold the lock during ingest → 409 the edit).
_LOCK_TTL = 30  # seconds the lock is held before auto-expiry
_LOCK_WAIT = 5  # seconds to wait for the worker's merge phase before giving up


@asynccontextmanager
async def _merge_lock(request: Request, workspace_id: uuid.UUID) -> AsyncIterator[None]:
    """Serialize a mutation against the ingest worker's merge phase via the same
    ``merge-lock:{workspace_id}`` key. If Redis is unavailable (arq pool is None)
    proceed without the lock — v1 accepts the small race rather than coupling edit
    availability to Redis."""
    arq = request.app.state.arq
    if arq is None:
        yield
        return
    lock = arq.lock(
        f"merge-lock:{workspace_id}", timeout=_LOCK_TTL, blocking_timeout=_LOCK_WAIT
    )
    try:
        async with lock:
            yield
    except LockError:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "the graph is being rebuilt; retry in a moment"
        )


# --- request / response shapes ---------------------------------------------


class ConceptCreate(BaseModel):
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace
    name: str = Field(min_length=1, max_length=300)
    description: str | None = None


class ConceptUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=300)
    description: str | None = None


class ConceptOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    cluster_id: uuid.UUID | None
    origin: str


class EdgeCreate(BaseModel):
    source_concept_id: uuid.UUID
    target_concept_id: uuid.UUID
    # Constrained to the fixed relation vocabulary so a manual edge can't reintroduce
    # the free-text fragmentation the pipeline was redesigned to remove.
    relation: RelationType


class EdgeUpdate(BaseModel):
    relation: RelationType | None = None
    weight: int | None = Field(default=None, ge=1)


class EdgeOut(BaseModel):
    id: uuid.UUID
    source_concept_id: uuid.UUID
    target_concept_id: uuid.UUID
    relation: str
    weight: int


class DeleteResult(BaseModel):
    ok: bool = True
    deleted_concepts: int = 1  # >1 when a cascade delete also removed neighbours


class AuditOut(BaseModel):
    id: uuid.UUID
    actor_id: str
    actor_role: str
    actor_is_you: bool
    action: str
    entity_type: str
    entity_id: uuid.UUID
    summary: str
    before: dict | None
    after: dict | None
    source: str
    undone: bool
    can_undo: bool
    created_at: datetime


# --- snapshots + audit -------------------------------------------------------


def _concept_snap(c: Concept) -> dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "description": c.description,
        "cluster_id": str(c.cluster_id) if c.cluster_id else None,
        "origin": c.origin,
    }


def _edge_snap(e: Edge) -> dict:
    return {
        "id": str(e.id),
        "workspace_id": str(e.workspace_id),
        "source_concept_id": str(e.source_concept_id),
        "target_concept_id": str(e.target_concept_id),
        "relation": e.relation,
        "weight": e.weight,
    }


async def _audit(
    session: AsyncSession,
    *,
    workspace_id: uuid.UUID,
    actor: CurrentUser,
    role: str,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before: dict | None = None,
    after: dict | None = None,
) -> GraphAudit:
    """Append a change-history row. ``source`` is derived from the actor's role so
    the feed can highlight a non-owner editor's edits."""
    row = GraphAudit(
        workspace_id=workspace_id,
        actor_id=actor.id,
        actor_role=role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after,
        source="editor" if role == "editor" else "user",
    )
    session.add(row)
    await session.flush()
    return row


async def _concept_for_edit(
    session: AsyncSession, user: CurrentUser, concept_id: uuid.UUID
) -> tuple[Concept, str]:
    concept = await session.get(Concept, concept_id)
    if concept is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    _, role = await require_workspace_role(session, user.id, concept.workspace_id)
    if not can_edit_graph(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "no edit access to this graph")
    return concept, role


async def _edge_for_edit(
    session: AsyncSession, user: CurrentUser, edge_id: uuid.UUID
) -> tuple[Edge, str]:
    edge = await session.get(Edge, edge_id)
    if edge is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "edge not found")
    _, role = await require_workspace_role(session, user.id, edge.workspace_id)
    if not can_edit_graph(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "no edit access to this graph")
    return edge, role


async def _orphan_cluster_sweep(session: AsyncSession, workspace_id: uuid.UUID) -> None:
    """Drop clusters left with no concepts — same GC as document delete."""
    has_concept = select(Concept.id).where(Concept.cluster_id == Cluster.id).exists()
    await session.execute(
        delete(Cluster).where(Cluster.workspace_id == workspace_id, ~has_concept)
    )


# --- concept mutations -------------------------------------------------------


@router.post(
    "/concepts", response_model=ConceptOut, status_code=status.HTTP_201_CREATED
)
async def create_concept(
    body: ConceptCreate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConceptOut:
    """Add a hand-authored ``origin='manual'`` concept. An existing same-name node
    is reused (the dedup backstop) rather than erroring."""
    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
        ws_id, role = workspace.id, "owner"
    else:
        ws_id = body.workspace_id
        _, role = await require_workspace_role(session, user.id, ws_id)
    if not can_edit_graph(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "no edit access to this graph")

    name = body.name.strip()
    key = name.lower()
    async with _merge_lock(request, ws_id):
        existing = (
            await session.execute(
                select(Concept).where(
                    Concept.workspace_id == ws_id, func.lower(Concept.name) == key
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return ConceptOut(**_id_fields(existing))

        await session.execute(
            pg_insert(Concept)
            .values(
                workspace_id=ws_id,
                name=name,
                description=body.description,
                origin="manual",
            )
            .on_conflict_do_nothing(
                index_elements=[Concept.workspace_id, func.lower(Concept.name)]
            )
        )
        concept = (
            await session.execute(
                select(Concept).where(
                    Concept.workspace_id == ws_id, func.lower(Concept.name) == key
                )
            )
        ).scalar_one()
        await _audit(
            session,
            workspace_id=ws_id,
            actor=user,
            role=role,
            action="concept.create",
            entity_type="concept",
            entity_id=concept.id,
            after=_concept_snap(concept),
        )
        await touch_workspace(session, ws_id)
        await session.commit()
    return ConceptOut(**_id_fields(concept))


@router.patch("/concepts/{concept_id}", response_model=ConceptOut)
async def update_concept(
    concept_id: uuid.UUID,
    body: ConceptUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConceptOut:
    concept, role = await _concept_for_edit(session, user, concept_id)
    fields = body.model_dump(exclude_unset=True)
    async with _merge_lock(request, concept.workspace_id):
        before = _concept_snap(concept)
        if fields.get("name"):
            concept.name = fields["name"].strip()
        if "description" in fields:
            concept.description = fields["description"]
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT, "a concept with that name already exists"
            )
        await _audit(
            session,
            workspace_id=concept.workspace_id,
            actor=user,
            role=role,
            action="concept.update",
            entity_type="concept",
            entity_id=concept.id,
            before=before,
            after=_concept_snap(concept),
        )
        await touch_workspace(session, concept.workspace_id)
        await session.commit()
    return ConceptOut(**_id_fields(concept))


@router.delete("/concepts/{concept_id}", response_model=DeleteResult)
async def delete_concept(
    concept_id: uuid.UUID,
    request: Request,
    cascade: bool = Query(default=False),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeleteResult:
    """Delete a concept. The caller chooses the scope in the UI:
    ``cascade=false`` (default) removes only this node and its own edges, leaving
    the connected concepts in place; ``cascade=true`` also removes the directly-
    connected neighbour concepts (one hop — not the whole connected component)."""
    concept, role = await _concept_for_edit(session, user, concept_id)
    ws_id = concept.workspace_id
    async with _merge_lock(request, ws_id):
        # The concepts to remove: just this one, or this one + its direct
        # neighbours when cascading.
        victim_ids: list[uuid.UUID] = [concept_id]
        if cascade:
            neighbour_rows = (
                await session.execute(
                    select(Edge.source_concept_id, Edge.target_concept_id).where(
                        (Edge.source_concept_id == concept_id)
                        | (Edge.target_concept_id == concept_id)
                    )
                )
            ).all()
            seen = {concept_id}
            for s, t in neighbour_rows:
                other = t if s == concept_id else s
                if other not in seen:
                    seen.add(other)
                    victim_ids.append(other)

        victims = (
            await session.execute(
                select(Concept).where(
                    Concept.workspace_id == ws_id, Concept.id.in_(victim_ids)
                )
            )
        ).scalars().all()
        # Every edge touching any victim — snapshotted for undo, then removed by
        # the DB's FK cascade when the concepts go.
        edges = (
            await session.execute(
                select(Edge).where(
                    Edge.source_concept_id.in_(victim_ids)
                    | Edge.target_concept_id.in_(victim_ids)
                )
            )
        ).scalars().all()
        edge_snaps = [_edge_snap(e) for e in edges]

        if cascade:
            before = {"concepts": [_concept_snap(c) for c in victims], "edges": edge_snaps}
        else:
            before = {"concept": _concept_snap(concept), "edges": edge_snaps}

        await session.execute(
            delete(Concept).where(
                Concept.workspace_id == ws_id, Concept.id.in_(victim_ids)
            )
        )  # FK cascade clears each victim's edges / aliases / mentions
        await session.flush()
        await _orphan_cluster_sweep(session, ws_id)
        await _audit(
            session,
            workspace_id=ws_id,
            actor=user,
            role=role,
            action="concept.delete",
            entity_type="concept",
            entity_id=concept_id,
            before=before,
        )
        await touch_workspace(session, ws_id)
        await session.commit()
    return DeleteResult(deleted_concepts=len(victims))


# --- edge mutations ----------------------------------------------------------


@router.post("/edges", response_model=EdgeOut, status_code=status.HTTP_201_CREATED)
async def create_edge(
    body: EdgeCreate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> EdgeOut:
    if body.source_concept_id == body.target_concept_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "no self-loops")
    src = await session.get(Concept, body.source_concept_id)
    tgt = await session.get(Concept, body.target_concept_id)
    if src is None or tgt is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    if src.workspace_id != tgt.workspace_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "concepts are in different workspaces"
        )
    ws_id = src.workspace_id
    _, role = await require_workspace_role(session, user.id, ws_id)
    if not can_edit_graph(role):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "no edit access to this graph")

    relation = body.relation.strip()
    async with _merge_lock(request, ws_id):
        await upsert_edge(
            session, ws_id, body.source_concept_id, body.target_concept_id, relation
        )
        edge = (
            await session.execute(
                select(Edge).where(
                    Edge.workspace_id == ws_id,
                    Edge.source_concept_id == body.source_concept_id,
                    Edge.target_concept_id == body.target_concept_id,
                    Edge.relation == relation,
                )
            )
        ).scalar_one()
        await _audit(
            session,
            workspace_id=ws_id,
            actor=user,
            role=role,
            action="edge.create",
            entity_type="edge",
            entity_id=edge.id,
            after=_edge_snap(edge),
        )
        await touch_workspace(session, ws_id)
        await session.commit()
    return EdgeOut(**_edge_fields(edge))


@router.patch("/edges/{edge_id}", response_model=EdgeOut)
async def update_edge(
    edge_id: uuid.UUID,
    body: EdgeUpdate,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> EdgeOut:
    edge, role = await _edge_for_edit(session, user, edge_id)
    fields = body.model_dump(exclude_unset=True)
    async with _merge_lock(request, edge.workspace_id):
        before = _edge_snap(edge)
        if fields.get("relation"):
            edge.relation = fields["relation"].strip()
        if fields.get("weight") is not None:
            edge.weight = fields["weight"]
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT, "an identical relation already exists"
            )
        await _audit(
            session,
            workspace_id=edge.workspace_id,
            actor=user,
            role=role,
            action="edge.update",
            entity_type="edge",
            entity_id=edge.id,
            before=before,
            after=_edge_snap(edge),
        )
        await touch_workspace(session, edge.workspace_id)
        await session.commit()
    return EdgeOut(**_edge_fields(edge))


@router.delete("/edges/{edge_id}", response_model=DeleteResult)
async def delete_edge(
    edge_id: uuid.UUID,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeleteResult:
    edge, role = await _edge_for_edit(session, user, edge_id)
    ws_id = edge.workspace_id
    async with _merge_lock(request, ws_id):
        before = _edge_snap(edge)
        entity_id = edge.id
        await session.delete(edge)
        await _audit(
            session,
            workspace_id=ws_id,
            actor=user,
            role=role,
            action="edge.delete",
            entity_type="edge",
            entity_id=entity_id,
            before=before,
        )
        await touch_workspace(session, ws_id)
        await session.commit()
    return DeleteResult()


# --- audit feed + undo -------------------------------------------------------


def _concept_name(e: GraphAudit) -> tuple[str, int]:
    """A concept audit's display name, plus how many *extra* nodes it touched.

    Snapshot shapes vary: a create/update stores the node's fields directly
    under ``after``; a single delete nests them under ``before.concept``; a
    cascade delete — and the undo/redo rows it spawns — store a *list* under
    ``concepts`` (the targeted node plus its removed neighbours). The targeted
    node is the one whose id matches the row's ``entity_id``."""
    for blob in (e.after or {}, e.before or {}):
        nodes = blob.get("concepts")
        if nodes:
            primary = next(
                (c for c in nodes if c.get("id") == str(e.entity_id)), nodes[0]
            )
            return primary.get("name") or "concept", max(0, len(nodes) - 1)
        single = blob.get("concept")
        name = (single if isinstance(single, dict) else blob).get("name")
        if name:
            return name, 0
    return "concept", 0


def _summary(e: GraphAudit) -> str:
    suffix = ""
    if e.entity_type == "concept":
        name, extra = _concept_name(e)
        if extra:
            suffix = f" + {extra} more"
    else:
        after, before = e.after or {}, e.before or {}
        name = after.get("relation") or before.get("relation") or "relation"
    verb = {
        "concept.create": "Added concept",
        "concept.update": "Edited concept",
        "concept.delete": "Deleted concept",
        "edge.create": "Added relation",
        "edge.update": "Edited relation",
        "edge.delete": "Deleted relation",
    }.get(e.action, e.action)
    return f'{verb} "{name}"{suffix}'


def _audit_out(e: GraphAudit, user: CurrentUser, role: str) -> AuditOut:
    can_undo = (
        e.undone_by is None
        and (role == "owner" or e.actor_id == user.id)
        and can_edit_graph(role)
    )
    return AuditOut(
        id=e.id,
        actor_id=e.actor_id,
        actor_role=e.actor_role,
        actor_is_you=e.actor_id == user.id,
        action=e.action,
        entity_type=e.entity_type,
        entity_id=e.entity_id,
        summary=_summary(e),
        before=e.before,
        after=e.after,
        source=e.source,
        undone=e.undone_by is not None,
        can_undo=can_undo,
        created_at=e.created_at,
    )


@router.get("/audit", response_model=list[AuditOut])
async def get_audit(
    workspace_id: uuid.UUID = Query(...),
    before: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AuditOut]:
    """The change feed for async review: newest human edits first, each tagged
    with whether the caller may undo it."""
    _, role = await require_workspace_role(session, user.id, workspace_id)
    query = (
        select(GraphAudit)
        .where(GraphAudit.workspace_id == workspace_id)
        .order_by(GraphAudit.created_at.desc())
        .limit(limit)
    )
    if before is not None:
        query = query.where(GraphAudit.created_at < before)
    rows = (await session.execute(query)).scalars().all()
    return [_audit_out(r, user, role) for r in rows]


@router.post("/audit/{audit_id}/undo", response_model=AuditOut)
async def undo_audit(
    audit_id: uuid.UUID,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AuditOut:
    """Revert a recorded change by replaying its inverse from the before/after
    snapshot. Owners can undo anyone's edit; others only their own."""
    entry = await session.get(GraphAudit, audit_id)
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "audit entry not found")
    _, role = await require_workspace_role(session, user.id, entry.workspace_id)
    if entry.undone_by is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "already undone")
    if not (role == "owner" or entry.actor_id == user.id) or not can_edit_graph(role):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "you can only undo your own changes"
        )

    ws_id = entry.workspace_id
    async with _merge_lock(request, ws_id):
        new_entry = await _apply_undo(session, entry, user, role, ws_id)
        entry.undone_by = new_entry.id
        await touch_workspace(session, ws_id)
        await session.commit()
    return _audit_out(new_entry, user, role)


def _maybe_uuid(value) -> uuid.UUID | None:
    try:
        return uuid.UUID(value) if value else None
    except (ValueError, TypeError, AttributeError):
        return None


async def _both_exist(
    session: AsyncSession, ws_id: uuid.UUID, a: uuid.UUID, b: uuid.UUID
) -> bool:
    n = (
        await session.execute(
            select(func.count())
            .select_from(Concept)
            .where(Concept.workspace_id == ws_id, Concept.id.in_([a, b]))
        )
    ).scalar_one()
    return n == 2


async def _recreate_concept(
    session: AsyncSession, ws_id: uuid.UUID, snap: dict
) -> uuid.UUID:
    name = (snap.get("name") or "Restored concept").strip()
    key = name.lower()
    await session.execute(
        pg_insert(Concept)
        .values(
            workspace_id=ws_id,
            name=name,
            description=snap.get("description"),
            origin=snap.get("origin") or "manual",
        )
        .on_conflict_do_nothing(
            index_elements=[Concept.workspace_id, func.lower(Concept.name)]
        )
    )
    return (
        await session.execute(
            select(Concept.id).where(
                Concept.workspace_id == ws_id, func.lower(Concept.name) == key
            )
        )
    ).scalar_one()


async def _apply_undo(
    session: AsyncSession,
    entry: GraphAudit,
    user: CurrentUser,
    role: str,
    ws_id: uuid.UUID,
) -> GraphAudit:
    """Apply the inverse of one audit entry and return the new (undo) audit row.

    Limitations (acceptable for v1): undoing a concept delete recreates the node
    with a NEW id plus its captured edges (to still-present endpoints); source
    citations (mentions) are not resurrected — they re-attach on the next ingest
    of their document.
    """
    action = entry.action
    if action == "concept.create":
        after = entry.after or {}
        # A cascade delete's undo recreated many concepts (recorded under
        # "concepts"); redoing it (undo of the undo) must delete them all again.
        if isinstance(after, dict) and "concepts" in after:
            ids = [i for i in (_maybe_uuid(s.get("id")) for s in (after.get("concepts") or [])) if i]
            if ids:
                await session.execute(
                    delete(Concept).where(
                        Concept.workspace_id == ws_id, Concept.id.in_(ids)
                    )
                )
                await session.flush()
                await _orphan_cluster_sweep(session, ws_id)
            return await _audit(
                session, workspace_id=ws_id, actor=user, role=role,
                action="concept.delete", entity_type="concept",
                entity_id=entry.entity_id, before=after,
            )
        c = await session.get(Concept, entry.entity_id)
        if c is not None:
            await session.delete(c)
            await session.flush()
            await _orphan_cluster_sweep(session, ws_id)
        return await _audit(
            session, workspace_id=ws_id, actor=user, role=role,
            action="concept.delete", entity_type="concept",
            entity_id=entry.entity_id, before=entry.after,
        )

    if action == "concept.delete":
        before = entry.before or {}
        # A single delete snapshots one "concept"; a cascade delete snapshots
        # "concepts" (the node + its neighbours). Recreate them all with new ids,
        # mapping old→new so the captured edges can be re-wired.
        snaps = before.get("concepts") or [before.get("concept") or {}]
        id_map: dict[str, uuid.UUID] = {}
        new_snaps: list[dict] = []
        first_new_id: uuid.UUID | None = None
        for snap in snaps:
            new_id = await _recreate_concept(session, ws_id, snap)
            if first_new_id is None:
                first_new_id = new_id
            if snap.get("id"):
                id_map[str(snap["id"])] = new_id
            c = await session.get(Concept, new_id)
            if c is not None:
                new_snaps.append(_concept_snap(c))
        for e in before.get("edges") or []:
            # Remap each endpoint to its new id; an endpoint not in the map is a
            # surviving external concept, kept by its original id.
            s = id_map.get(str(e.get("source_concept_id"))) or _maybe_uuid(e.get("source_concept_id"))
            t = id_map.get(str(e.get("target_concept_id"))) or _maybe_uuid(e.get("target_concept_id"))
            if s and t and s != t and await _both_exist(session, ws_id, s, t):
                await upsert_edge(session, ws_id, s, t, e.get("relation") or "related to")
        cascade = "concepts" in before
        primary_new = id_map.get(str(entry.entity_id)) or first_new_id
        return await _audit(
            session, workspace_id=ws_id, actor=user, role=role,
            action="concept.create", entity_type="concept",
            entity_id=primary_new,
            after=({"concepts": new_snaps} if cascade else (new_snaps[0] if new_snaps else None)),
        )

    if action == "concept.update":
        c = await session.get(Concept, entry.entity_id)
        if c is None:
            raise HTTPException(status.HTTP_409_CONFLICT, "the concept no longer exists")
        before_now = _concept_snap(c)
        snap = entry.before or {}
        c.name = snap.get("name") or c.name
        c.description = snap.get("description")
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT, "undo conflicts with an existing name"
            )
        return await _audit(
            session, workspace_id=ws_id, actor=user, role=role,
            action="concept.update", entity_type="concept",
            entity_id=c.id, before=before_now, after=_concept_snap(c),
        )

    if action == "edge.create":
        e = await session.get(Edge, entry.entity_id)
        if e is not None:
            await session.delete(e)
            await session.flush()
        return await _audit(
            session, workspace_id=ws_id, actor=user, role=role,
            action="edge.delete", entity_type="edge",
            entity_id=entry.entity_id, before=entry.after,
        )

    if action == "edge.delete":
        snap = entry.before or {}
        s = _maybe_uuid(snap.get("source_concept_id"))
        t = _maybe_uuid(snap.get("target_concept_id"))
        relation = snap.get("relation") or "related to"
        new_id = entry.entity_id
        if s and t and s != t and await _both_exist(session, ws_id, s, t):
            await upsert_edge(session, ws_id, s, t, relation)
            edge = (
                await session.execute(
                    select(Edge).where(
                        Edge.workspace_id == ws_id,
                        Edge.source_concept_id == s,
                        Edge.target_concept_id == t,
                        Edge.relation == relation,
                    )
                )
            ).scalar_one_or_none()
            if edge is not None:
                new_id = edge.id
        return await _audit(
            session, workspace_id=ws_id, actor=user, role=role,
            action="edge.create", entity_type="edge", entity_id=new_id,
            after=snap,
        )

    if action == "edge.update":
        e = await session.get(Edge, entry.entity_id)
        if e is None:
            raise HTTPException(status.HTTP_409_CONFLICT, "the relation no longer exists")
        before_now = _edge_snap(e)
        snap = entry.before or {}
        e.relation = snap.get("relation") or e.relation
        if snap.get("weight") is not None:
            e.weight = snap["weight"]
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "undo conflicts with an existing relation")
        return await _audit(
            session, workspace_id=ws_id, actor=user, role=role,
            action="edge.update", entity_type="edge",
            entity_id=e.id, before=before_now, after=_edge_snap(e),
        )

    raise HTTPException(status.HTTP_400_BAD_REQUEST, "this change can't be undone")


# --- small mappers -----------------------------------------------------------


def _id_fields(c: Concept) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "cluster_id": c.cluster_id,
        "origin": c.origin,
    }


def _edge_fields(e: Edge) -> dict:
    return {
        "id": e.id,
        "source_concept_id": e.source_concept_id,
        "target_concept_id": e.target_concept_id,
        "relation": e.relation,
        "weight": e.weight,
    }
