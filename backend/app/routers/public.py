"""Public demo graph — the login-free surface at the frontend's "/".

Lets an anonymous visitor experience the whole product (upload → extract → graph
→ search → ask → edit) without an account, on their OWN isolated workspace.

Design: a demo session is an opaque token minted by ``POST /session``; the
visitor's workspace is owned by the synthetic id ``anon:<token>``. Because the
existing authed handlers derive access from ``CurrentUser.id`` via
``require_workspace_role`` / ``ensure_personal_workspace``, a ``CurrentUser`` whose
id IS that ``anon:<token>`` resolves the demo workspace as its "owner" — so every
endpoint below is a thin forward to the SAME handler the dashboard uses, with no
duplicated graph/upload/edit logic. The ONLY divergences are auth (a session
header instead of a Cognito bearer) and abuse ceilings (services/public_limits).

Security invariant: the workspace is ALWAYS the session's own. Forwarded request
bodies have ``workspace_id`` forced to ``None`` (→ the session's personal
workspace), and entity-scoped edits are guarded by the handlers' own
``require_workspace_role``, so a demo token can never read or mutate a real user's
workspace.
"""

from __future__ import annotations

import secrets
import uuid
from dataclasses import dataclass

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.config import get_settings
from app.db import get_session
from app.models import Document, Workspace
from app.routers import clusters, concepts, documents, graph, graph_edit, search
from app.routers.ask import AskIn, ask
from app.routers.clusters import DeleteClustersRequest, DeleteClustersResponse
from app.routers.documents import (
    CreateDocumentRequest,
    CreateDocumentResponse,
    DeleteDocumentsRequest,
    DeleteDocumentsResponse,
    DocumentDownloadOut,
    DocumentOut,
    IngestResponse,
)
from app.routers.graph_edit import (
    ConceptCreate,
    ConceptOut,
    ConceptUpdate,
    DeleteResult,
    EdgeCreate,
    EdgeOut,
    EdgeUpdate,
)
from app.services.concept_read import ConceptDetail, ConceptPassages
from app.services.graph_read import GraphOut
from app.services.public_limits import (
    client_ip,
    enforce_ask,
    enforce_search,
    enforce_session_create,
    enforce_upload,
)
from app.services.public_seed import clone_workspace_graph
from app.services.search import DEFAULT_LIMIT, MAX_LIMIT

router = APIRouter(prefix="/api/public", tags=["public"])

# The synthetic owner-id namespace for demo workspaces. The opaque session token
# is everything after the prefix; possessing it IS the authorization (the token is
# a 32-byte secret, so a leaked workspace_id alone grants nothing).
PUBLIC_OWNER_PREFIX = "anon:"


def _require_enabled() -> None:
    """404 the whole demo surface when it's switched off (config flag)."""
    if not get_settings().public_demo_enabled:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "public demo is disabled")


@dataclass
class PublicCtx:
    """Resolved demo session: the synthetic owner, its workspace, and the token."""

    user: CurrentUser
    workspace_id: uuid.UUID
    token: str


async def get_public_session(
    x_public_session: str = Header(default=""),
    session: AsyncSession = Depends(get_session),
) -> PublicCtx:
    """Resolve the ``X-Public-Session`` header to a demo workspace, or 401.

    Verifies the token maps to an existing demo workspace (rejecting forged or
    swept-away tokens) rather than auto-creating one — minting is gated by
    ``POST /session`` so it can be rate-limited and seeded. The returned
    ``CurrentUser.id`` is the workspace's ``owner_id``, which is what makes the
    forwarded handlers treat the caller as the workspace owner.
    """
    _require_enabled()
    token = x_public_session.strip()
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing public session")
    owner_id = PUBLIC_OWNER_PREFIX + token
    ws_id = await session.scalar(
        select(Workspace.id).where(
            Workspace.owner_id == owner_id, Workspace.type == "private"
        )
    )
    if ws_id is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "invalid or expired public session"
        )
    return PublicCtx(
        user=CurrentUser(id=owner_id, email=None, token=""),
        workspace_id=ws_id,
        token=token,
    )


# --- session bootstrap -------------------------------------------------------


class PublicSessionOut(BaseModel):
    token: str  # store client-side; send as the X-Public-Session header
    workspace_id: uuid.UUID
    seeded_concepts: int  # how many concepts the seed clone produced (0 if no template)


@router.post("/session", response_model=PublicSessionOut)
async def create_public_session(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> PublicSessionOut:
    """Mint a fresh demo session: a new isolated workspace seeded from the template.

    Rate-limited per IP. The returned ``token`` is the demo credential — the client
    stores it and sends it as ``X-Public-Session`` on every subsequent call.
    """
    _require_enabled()
    await enforce_session_create(request.app.state.arq, client_ip(request))

    token = secrets.token_urlsafe(32)
    workspace = Workspace(
        owner_id=PUBLIC_OWNER_PREFIX + token, type="private", name="Demo workspace"
    )
    session.add(workspace)
    await session.flush()

    seeded = 0
    src_id = await session.scalar(
        select(Workspace.id).where(
            Workspace.owner_id == get_settings().public_template_owner_id,
            Workspace.type == "private",
        )
    )
    if src_id is not None:
        seeded = await clone_workspace_graph(
            session, src_workspace_id=src_id, dst_workspace_id=workspace.id
        )
    await session.commit()
    return PublicSessionOut(
        token=token, workspace_id=workspace.id, seeded_concepts=seeded
    )


# --- read endpoints (forward to the authed handlers, session workspace) ------


@router.get("/graph", response_model=GraphOut)
async def public_graph(
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> GraphOut:
    return await graph.get_graph(workspace_id=None, user=pub.user, session=session)


@router.get("/documents", response_model=list[DocumentOut])
async def public_list_documents(
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
):
    return await documents.list_documents(
        workspace_id=None, user=pub.user, session=session
    )


@router.get("/documents/{document_id}/download", response_model=DocumentDownloadOut)
async def public_document_download(
    document_id: uuid.UUID,
    download: bool = Query(default=False),
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> DocumentDownloadOut:
    return await documents.get_document_download(
        document_id=document_id, download=download, user=pub.user, session=session
    )


@router.get("/concepts/{concept_id}", response_model=ConceptDetail)
async def public_concept(
    concept_id: uuid.UUID,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> ConceptDetail:
    return await concepts.get_concept(
        concept_id=concept_id, user=pub.user, session=session
    )


@router.get("/concepts/{concept_id}/passages", response_model=ConceptPassages)
async def public_concept_passages(
    concept_id: uuid.UUID,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> ConceptPassages:
    return await concepts.get_concept_passages_route(
        concept_id=concept_id, user=pub.user, session=session
    )


@router.get("/search")
async def public_search(
    request: Request,
    q: str = Query(..., description="natural-language query"),
    limit: int = Query(default=DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
):
    await enforce_search(request.app.state.arq, pub.token)
    return await search.search(
        q=q, workspace_id=None, limit=limit, user=pub.user, session=session
    )


@router.post("/ask")
async def public_ask(
    body: AskIn,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
):
    await enforce_ask(request.app.state.arq, pub.token)
    body.workspace_id = None  # never trust a client-supplied workspace
    return await ask(body=body, user=pub.user, session=session)


# --- upload (rate-limited) ---------------------------------------------------


@router.post("/documents", response_model=CreateDocumentResponse)
async def public_create_document(
    body: CreateDocumentRequest,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> CreateDocumentResponse:
    body.workspace_id = None  # force the session's own workspace
    doc_count = await session.scalar(
        select(func.count())
        .select_from(Document)
        .where(Document.workspace_id == pub.workspace_id)
    )
    await enforce_upload(
        request.app.state.arq, ip=client_ip(request), current_doc_count=doc_count or 0
    )
    return await documents.create_document(
        body=body, request=request, user=pub.user, session=session
    )


@router.post("/documents/{document_id}/ingest", response_model=IngestResponse)
async def public_start_ingest(
    document_id: uuid.UUID,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> IngestResponse:
    return await documents.start_ingest(
        document_id=document_id, request=request, user=pub.user, session=session
    )


@router.post("/documents/delete", response_model=DeleteDocumentsResponse)
async def public_delete_documents(
    body: DeleteDocumentsRequest,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> DeleteDocumentsResponse:
    body.workspace_id = None  # force the session's own workspace
    return await documents.delete_documents(body=body, user=pub.user, session=session)


@router.post("/clusters/delete", response_model=DeleteClustersResponse)
async def public_delete_clusters(
    body: DeleteClustersRequest,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> DeleteClustersResponse:
    body.workspace_id = None  # force the session's own workspace
    return await clusters.delete_clusters(body=body, user=pub.user, session=session)


# --- graph editing (forward to the audited, merge-locked handlers) -----------


@router.post("/graph/concepts", response_model=ConceptOut, status_code=status.HTTP_201_CREATED)
async def public_create_concept(
    body: ConceptCreate,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> ConceptOut:
    body.workspace_id = None
    return await graph_edit.create_concept(
        body=body, request=request, user=pub.user, session=session
    )


@router.patch("/graph/concepts/{concept_id}", response_model=ConceptOut)
async def public_update_concept(
    concept_id: uuid.UUID,
    body: ConceptUpdate,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> ConceptOut:
    return await graph_edit.update_concept(
        concept_id=concept_id, body=body, request=request, user=pub.user, session=session
    )


@router.delete("/graph/concepts/{concept_id}", response_model=DeleteResult)
async def public_delete_concept(
    concept_id: uuid.UUID,
    request: Request,
    cascade: bool = Query(default=False),
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> DeleteResult:
    return await graph_edit.delete_concept(
        concept_id=concept_id, request=request, cascade=cascade, user=pub.user, session=session
    )


@router.post("/graph/edges", response_model=EdgeOut, status_code=status.HTTP_201_CREATED)
async def public_create_edge(
    body: EdgeCreate,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> EdgeOut:
    return await graph_edit.create_edge(
        body=body, request=request, user=pub.user, session=session
    )


@router.patch("/graph/edges/{edge_id}", response_model=EdgeOut)
async def public_update_edge(
    edge_id: uuid.UUID,
    body: EdgeUpdate,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> EdgeOut:
    return await graph_edit.update_edge(
        edge_id=edge_id, body=body, request=request, user=pub.user, session=session
    )


@router.delete("/graph/edges/{edge_id}", response_model=DeleteResult)
async def public_delete_edge(
    edge_id: uuid.UUID,
    request: Request,
    pub: PublicCtx = Depends(get_public_session),
    session: AsyncSession = Depends(get_session),
) -> DeleteResult:
    return await graph_edit.delete_edge(
        edge_id=edge_id, request=request, user=pub.user, session=session
    )
