"""Document upload + status — the frontend's ingestion contract.

Upload is two steps: POST here to get a presigned `upload_url`, then PUT the raw
bytes straight to S3 (NOT through the JSON API client). The backend inserts the
document as `pending` and enqueues the worker; the frontend polls GET /{id} for
`status`.
"""

import asyncio
import uuid
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser, get_current_user
from app.db import get_session
from app.models import Concept, ConceptAlias, ConceptMention, Document
from app.services.concepts import sweep_orphan_concepts
from app.services.parse import parse_document
from app.services.storage import delete_objects, get_object, presign_put_url
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


class DocumentConcept(BaseModel):
    """A concept mentioned in a document, with its synonyms — the reader matches
    these strings against the source text to highlight + link them inline."""

    id: uuid.UUID
    name: str
    aliases: list[str]


class DocumentContentOut(BaseModel):
    """The reader payload: the parsed source plus the concepts it gave rise to.

    `markdown` is null only when the source can't be recovered (still processing,
    or a backfill re-parse failed) — the reader degrades to a link-out then.
    """

    id: uuid.UUID
    title: str
    source_type: str
    source_url: str | None
    markdown: str | None
    concepts: list[DocumentConcept]


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
    """Insert a pending Document and enqueue ingestion — the shared tail of every
    ingestion entrypoint (file upload here, web clip in routers/imports.py).

    The caller has already resolved and access-checked the workspace, chosen the
    id, and placed the bytes in S3 (presigned PUT for uploads, server-side
    ``put_object`` for clips). Returns the arq job id (None if enqueue yielded
    nothing). Both entrypoints feed the identical ``ingest_document`` job, so a
    clipped page and an uploaded file merge into one graph through one pipeline.
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
    job = await arq.enqueue_job("ingest_document", str(document_id))
    return job.job_id if job else None


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

    job_id = await persist_and_enqueue_document(
        session,
        arq,
        document_id=document_id,
        workspace_id=workspace.id,
        title=body.title or body.filename,
        source_type=_source_type(body.filename, body.content_type),
        s3_key=s3_key,
    )
    return CreateDocumentResponse(
        document_id=document_id, upload_url=upload_url, job_id=job_id
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


@router.get("/{document_id}/content", response_model=DocumentContentOut)
async def get_document_content(
    document_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DocumentContentOut:
    """The reader payload — the parsed source plus the concepts it produced.

    `body_markdown` is written at ingest. Documents from before that existed get
    it lazily here: re-parse the S3 original once and persist, so the first reader
    open backfills and every later one is a plain column read. A re-parse failure
    is non-fatal — `markdown` returns null and the reader degrades to a link-out.
    """
    document = await session.get(Document, document_id)
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "document not found")
    await require_workspace(session, user.id, document.workspace_id)

    markdown = document.body_markdown
    if markdown is None and document.status == "done":
        try:
            data = await get_object(document.s3_key)
            markdown = await asyncio.to_thread(
                parse_document, data, document.source_type
            )
            document.body_markdown = markdown
            await session.commit()
        except Exception:  # noqa: BLE001 — best-effort backfill; reader links out
            markdown = None

    # Concepts mentioned in THIS document, with their synonyms — the reader's
    # highlight set. Distinct because a concept is mentioned once per chunk.
    concept_rows = (
        await session.execute(
            select(Concept.id, Concept.name)
            .join(ConceptMention, ConceptMention.concept_id == Concept.id)
            .where(ConceptMention.document_id == document_id)
            .distinct()
        )
    ).all()
    concept_ids = [cid for cid, _ in concept_rows]

    aliases_by_concept: dict[uuid.UUID, list[str]] = defaultdict(list)
    if concept_ids:
        alias_rows = (
            await session.execute(
                select(ConceptAlias.concept_id, ConceptAlias.alias).where(
                    ConceptAlias.concept_id.in_(concept_ids)
                )
            )
        ).all()
        for cid, alias in alias_rows:
            aliases_by_concept[cid].append(alias)

    return DocumentContentOut(
        id=document.id,
        title=document.title,
        source_type=document.source_type,
        source_url=document.source_url,
        markdown=markdown,
        concepts=[
            DocumentConcept(id=cid, name=name, aliases=aliases_by_concept[cid])
            for cid, name in concept_rows
        ],
    )


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
