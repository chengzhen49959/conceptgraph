"""Document upload + status — the frontend's ingestion contract.

Upload is two steps: POST here to get a presigned `upload_url`, then PUT the raw
bytes straight to S3 (NOT through the JSON API client). The backend inserts the
document as `pending` and enqueues the worker; the frontend polls GET /{id} for
`status`.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Cluster, Concept, ConceptMention, Document
from app.services.storage import delete_objects, presign_put_url
from app.services.workspaces import ensure_personal_workspace, require_workspace

router = APIRouter(prefix="/api/documents", tags=["documents"])


class CreateDocumentRequest(BaseModel):
    filename: str
    content_type: str
    title: str | None = None
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace


class CreateDocumentResponse(BaseModel):
    document_id: uuid.UUID
    upload_url: str
    job_id: str | None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str
    source_type: str
    status: str
    error: str | None


class DeleteDocumentsRequest(BaseModel):
    ids: list[uuid.UUID]
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace


class DeleteDocumentsResponse(BaseModel):
    deleted_documents: int
    deleted_concepts: int  # orphans garbage-collected as a side effect


def _source_type(filename: str, content_type: str) -> str:
    name = filename.lower()
    if content_type == "application/pdf" or name.endswith(".pdf"):
        return "pdf"
    if "markdown" in content_type or name.endswith((".md", ".markdown")):
        return "markdown"
    return "text"


@router.post("", response_model=CreateDocumentResponse)
async def create_document(
    body: CreateDocumentRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CreateDocumentResponse:
    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
    else:
        workspace = await require_workspace(session, user.id, body.workspace_id)

    arq = request.app.state.arq
    if arq is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "ingestion queue unavailable (REDIS_URL not configured)",
        )

    document_id = uuid.uuid4()
    s3_key = f"{workspace.id}/{document_id}/{body.filename}"
    # Presign first so an S3 misconfig fails before we persist an orphan row.
    upload_url = await presign_put_url(s3_key, body.content_type)

    session.add(
        Document(
            id=document_id,
            workspace_id=workspace.id,
            title=body.title or body.filename,
            source_type=_source_type(body.filename, body.content_type),
            status="pending",
            s3_key=s3_key,
        )
    )
    await session.commit()

    job = await arq.enqueue_job("ingest_document", str(document_id))
    return CreateDocumentResponse(
        document_id=document_id,
        upload_url=upload_url,
        job_id=job.job_id if job else None,
    )


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Document:
    document = await session.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "document not found")
    await require_workspace(session, user.id, document.workspace_id)
    return document


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    workspace_id: uuid.UUID | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[Document]:
    if workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
        await session.commit()
        workspace_id = workspace.id
    else:
        await require_workspace(session, user.id, workspace_id)
    rows = (
        await session.execute(
            select(Document)
            .where(Document.workspace_id == workspace_id)
            .order_by(Document.created_at.desc())
        )
    ).scalars().all()
    return list(rows)


@router.post("/delete", response_model=DeleteDocumentsResponse)
async def delete_documents(
    body: DeleteDocumentsRequest,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DeleteDocumentsResponse:
    """Delete documents and garbage-collect anything only they supported.

    Deleting a document cascades its chunks and mentions away (FK ON DELETE
    CASCADE). Concepts are workspace-scoped, so one that was mentioned *only* by
    the deleted documents would otherwise linger as a 0-mention ghost node — we
    sweep those out (their edges and aliases cascade in turn), then drop any
    cluster left with no concepts. Concepts still cited by other documents stay.

    Workspace ownership is enforced by the WHERE clause, and missing ids are
    simply skipped, so deleting the same id twice is a no-op success.
    """
    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
    else:
        workspace = await require_workspace(session, user.id, body.workspace_id)

    if not body.ids:
        return DeleteDocumentsResponse(deleted_documents=0, deleted_concepts=0)

    # Capture S3 keys before the rows vanish, for best-effort cleanup post-commit.
    s3_keys = (
        await session.execute(
            select(Document.s3_key).where(
                Document.workspace_id == workspace.id,
                Document.id.in_(body.ids),
            )
        )
    ).scalars().all()

    # 1. Documents → cascade removes their chunks and concept_mentions.
    doc_result = await session.execute(
        delete(Document).where(
            Document.workspace_id == workspace.id,
            Document.id.in_(body.ids),
        )
    )

    # 2. Orphan concepts: none mentioned anywhere → cascade removes edges/aliases.
    has_mention = (
        select(ConceptMention.concept_id)
        .where(ConceptMention.concept_id == Concept.id)
        .exists()
    )
    concept_result = await session.execute(
        delete(Concept).where(
            Concept.workspace_id == workspace.id,
            ~has_mention,
        )
    )

    # 3. Clusters left with no concepts after the sweep.
    has_concept = select(Concept.id).where(Concept.cluster_id == Cluster.id).exists()
    await session.execute(
        delete(Cluster).where(
            Cluster.workspace_id == workspace.id,
            ~has_concept,
        )
    )

    await session.commit()
    await delete_objects(list(s3_keys))

    return DeleteDocumentsResponse(
        deleted_documents=doc_result.rowcount or 0,
        deleted_concepts=concept_result.rowcount or 0,
    )
