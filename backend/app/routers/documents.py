"""Document upload + status — the frontend's ingestion contract.

Upload is three steps so the worker never reads an S3 object before it exists:
POST here for a presigned `upload_url` (inserts the document as `pending`, no job
yet), PUT the raw bytes straight to S3 (NOT through the JSON API client), then
POST /{id}/ingest to enqueue the worker. The frontend polls GET /{id} for
`status`. (Enqueuing at create time raced the browser's PUT — the worker's
`get_object` 404'd with `NoSuchKey` before the bytes landed.)
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Document
from app.services.concepts import sweep_orphan_concepts
from app.services.storage import delete_objects, presign_get_url, presign_put_url
from app.services.workspaces import (
    can_edit_graph,
    ensure_personal_workspace,
    require_workspace,
    require_workspace_role,
)

router = APIRouter(prefix="/api/documents", tags=["documents"])


class CreateDocumentRequest(BaseModel):
    filename: str
    content_type: str
    title: str | None = None
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace


class CreateDocumentResponse(BaseModel):
    document_id: uuid.UUID
    upload_url: str


class IngestResponse(BaseModel):
    job_id: str | None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str
    source_type: str
    status: str
    error: str | None
    # Merge-phase progress: concepts resolved / total. Both null outside merging; the
    # UI shows a live "Merging 30/62" + rough ETA from how fast `current` climbs.
    progress_current: int | None = None
    progress_total: int | None = None
    summary: str | None = None  # doc-level summary, filled once ingest completes
    source_url: str | None = None  # web origin if clipped, else null (file upload)
    doc_metadata: dict | None = None  # clip-time page metadata (author/date/site/…), else null


class DocumentDownloadOut(BaseModel):
    """A short-lived presigned URL to the uploaded source file in S3."""

    url: str


class DeleteDocumentsRequest(BaseModel):
    ids: list[uuid.UUID]
    workspace_id: uuid.UUID | None = None  # defaults to the caller's personal workspace


class DeleteDocumentsResponse(BaseModel):
    deleted_documents: int
    deleted_concepts: int  # orphans garbage-collected as a side effect


# Images have no extractable text without OCR, which the pipeline doesn't do.
# Reject them at upload (see _reject_if_unsupported) rather than letting them
# fall through to the "text" branch, where PyMuPDF-less decode would turn raw
# image bytes into replacement-character garbage and pollute the graph.
_IMAGE_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".heic", ".tiff", ".tif",
)


def _reject_if_unsupported(filename: str, content_type: str) -> None:
    """Raise 415 for file types the parser can't turn into meaningful text."""
    name = filename.lower()
    if content_type.startswith("image/") or name.endswith(_IMAGE_EXTENSIONS):
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Images aren't supported — text can't be extracted from them. "
            "Upload a PDF, Markdown, or text file instead.",
        )


def _source_type(filename: str, content_type: str) -> str:
    name = filename.lower()
    if content_type == "application/pdf" or name.endswith(".pdf"):
        return "pdf"
    if "markdown" in content_type or name.endswith((".md", ".markdown")):
        return "markdown"
    return "text"


async def persist_pending_document(
    session: AsyncSession,
    *,
    document_id: uuid.UUID,
    workspace_id: uuid.UUID,
    title: str,
    source_type: str,
    s3_key: str,
    source_url: str | None = None,
    source_url_canonical: str | None = None,
    doc_metadata: dict | None = None,
) -> None:
    """Insert a `pending` Document row — the shared head of every ingestion
    entrypoint (file upload here, web clip in routers/imports.py).

    Does NOT enqueue: the worker reads the file's bytes back from S3, so the job
    must not be queued until those bytes exist. The clip path puts them server-side
    first and enqueues straight away (``persist_and_enqueue_document``); the upload
    path enqueues only after the browser's presigned PUT lands (POST /{id}/ingest).
    """
    session.add(
        Document(
            id=document_id,
            workspace_id=workspace_id,
            title=title,
            source_type=source_type,
            status="pending",
            s3_key=s3_key,
            source_url=source_url,
            source_url_canonical=source_url_canonical,
            doc_metadata=doc_metadata,
        )
    )
    await session.commit()


async def enqueue_ingest(arq, document_id: uuid.UUID) -> str | None:
    """Enqueue the ``ingest_document`` job. The caller must have ensured the file's
    bytes are already in S3 — else the worker's ``get_object`` races to a
    ``NoSuchKey``. Returns the arq job id (None if enqueue yielded nothing)."""
    job = await arq.enqueue_job("ingest_document", str(document_id))
    return job.job_id if job else None


async def persist_and_enqueue_document(
    session: AsyncSession,
    arq,
    *,
    document_id: uuid.UUID,
    workspace_id: uuid.UUID,
    title: str,
    source_type: str,
    s3_key: str,
    source_url: str | None = None,
    source_url_canonical: str | None = None,
    doc_metadata: dict | None = None,
) -> str | None:
    """Persist a pending document and enqueue it in one step — for entrypoints that
    have *already* placed the bytes in S3 (the web clip's server-side
    ``put_object``). The file-upload path can't use this: its bytes arrive via a
    later browser PUT, so it persists here and enqueues from POST /{id}/ingest.
    Both entrypoints feed the identical ``ingest_document`` job, so a clipped page
    and an uploaded file merge into one graph through one pipeline.
    """
    await persist_pending_document(
        session,
        document_id=document_id,
        workspace_id=workspace_id,
        title=title,
        source_type=source_type,
        s3_key=s3_key,
        source_url=source_url,
        source_url_canonical=source_url_canonical,
        doc_metadata=doc_metadata,
    )
    return await enqueue_ingest(arq, document_id)


@router.post("", response_model=CreateDocumentResponse)
async def create_document(
    body: CreateDocumentRequest,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CreateDocumentResponse:
    _reject_if_unsupported(body.filename, body.content_type)

    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
    else:
        workspace, role = await require_workspace_role(
            session, user.id, body.workspace_id
        )
        if not can_edit_graph(role):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "only an editor or owner can upload documents",
            )

    # Fail fast if the queue is down — no point uploading bytes that can never
    # ingest. The enqueue itself happens later, in POST /{id}/ingest.
    if request.app.state.arq is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "ingestion queue unavailable (REDIS_URL not configured)",
        )

    document_id = uuid.uuid4()
    s3_key = f"{workspace.id}/{document_id}/{body.filename}"
    # Presign first so an S3 misconfig fails before we persist an orphan row.
    upload_url = await presign_put_url(s3_key, body.content_type)

    # Persist `pending` but DON'T enqueue: the worker reads the bytes back from S3,
    # and the browser hasn't PUT them yet. The client enqueues via /{id}/ingest
    # once its PUT lands (else the worker get_object's a NoSuchKey before upload).
    await persist_pending_document(
        session,
        document_id=document_id,
        workspace_id=workspace.id,
        title=body.title or body.filename,
        source_type=_source_type(body.filename, body.content_type),
        s3_key=s3_key,
    )
    return CreateDocumentResponse(document_id=document_id, upload_url=upload_url)


@router.post("/{document_id}/ingest", response_model=IngestResponse)
async def start_ingest(
    document_id: uuid.UUID,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> IngestResponse:
    """Enqueue ingestion once the browser's presigned PUT has landed the bytes.

    Split from POST /api/documents so the worker never reads an S3 object before it
    exists: create presigns + inserts the `pending` row, the browser PUTs the file,
    then this enqueues the job. Idempotent — a document already past `pending`
    (re-called, or a duplicate) is a no-op, not a re-ingest.
    """
    document = await session.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "document not found")
    _, role = await require_workspace_role(session, user.id, document.workspace_id)
    if not can_edit_graph(role):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "only an editor or owner can upload documents",
        )
    if document.status != "pending":
        return IngestResponse(job_id=None)  # already ingesting / done — no-op

    arq = request.app.state.arq
    if arq is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "ingestion queue unavailable (REDIS_URL not configured)",
        )
    return IngestResponse(job_id=await enqueue_ingest(arq, document_id))


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


@router.get("/{document_id}/download", response_model=DocumentDownloadOut)
async def get_document_download(
    document_id: uuid.UUID,
    download: bool = Query(default=False),
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DocumentDownloadOut:
    """A presigned URL to the user's original uploaded file.

    The UI shows the source file itself (no in-app reader): a file upload links to
    this URL (open inline, or `download=1` to save locally). A web clip has no
    uploaded file — the user opens its `source_url` directly — so this 409s for one.
    """
    document = await session.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "document not found")
    await require_workspace(session, user.id, document.workspace_id)
    if document.source_url is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "this document is a web clip — open its source_url, not a file download",
        )

    filename = document.s3_key.rsplit("/", 1)[-1]
    url = await presign_get_url(document.s3_key, filename=filename, download=download)
    return DocumentDownloadOut(url=url)


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
    CASCADE). Concepts are workspace-scoped, so an *extracted* one mentioned *only*
    by the deleted documents would otherwise linger as a 0-mention ghost node —
    `sweep_orphan_concepts` reaps those (edges and aliases cascade, emptied clusters
    drop). Extracted concepts still cited by other documents stay; manual nodes,
    which legitimately stand alone, are never touched.

    Workspace ownership is enforced by the WHERE clause, and missing ids are
    simply skipped, so deleting the same id twice is a no-op success.
    """
    if body.workspace_id is None:
        workspace = await ensure_personal_workspace(session, user.id)
    else:
        workspace, role = await require_workspace_role(
            session, user.id, body.workspace_id
        )
        if not can_edit_graph(role):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "only an editor or owner can delete documents",
            )

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

    # 2. Garbage-collect concepts the deleted documents were the last to mention,
    #    plus any cluster thereby emptied (edges/aliases cascade). Shared with the
    #    ingest pipeline so the "extracted concept ⇒ some document mentions it"
    #    invariant lives in exactly one place; manual nodes stand alone and are spared.
    deleted_concepts = await sweep_orphan_concepts(session, workspace.id)

    await session.commit()
    await delete_objects(list(s3_keys))

    return DeleteDocumentsResponse(
        deleted_documents=doc_result.rowcount or 0,
        deleted_concepts=deleted_concepts,
    )
