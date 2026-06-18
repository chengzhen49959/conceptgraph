"""Aurora schema for the concept-graph knowledge base.

Every row belongs to a workspace; user identity (`owner_id`, member `user_id`)
is the Cognito `sub`. `chunks` and `concepts` carry a pgvector embedding column
with an HNSW index (created in the first migration). Alembic autogenerates later
deltas from ``Base.metadata`` — but the FIRST migration is hand-authored
(``migrations/versions/0001_initial.py``) because autogenerate can't emit
``CREATE EXTENSION vector`` or HNSW index DDL.
"""

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Embedding width = output dim of text-embedding-3-small. This is DDL-fixed: the
# vector(N) column literal below and in the migration must match the embedding
# model. Changing the model means a new migration, not just a config tweak.
EMBED_DIM = 1536


class Base(DeclarativeBase):
    """Shared declarative base for Aurora tables."""


def _pk() -> Mapped[uuid.UUID]:
    """A UUID primary key generated app-side (no DB function dependency)."""
    return mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = _pk()
    owner_id: Mapped[str] = mapped_column(String, nullable=False)  # Cognito sub
    type: Mapped[str] = mapped_column(String, nullable=False, default="private")  # private | shared
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        # Exactly one personal (private) workspace per user. Shared workspaces
        # (F10, later) are unconstrained.
        Index(
            "uq_workspaces_owner_private",
            "owner_id",
            unique=True,
            postgresql_where=text("type = 'private'"),
        ),
    )


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(String, primary_key=True)  # Cognito sub
    role: Mapped[str] = mapped_column(String, nullable=False, default="owner")  # owner | member


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)  # pdf | markdown | text
    # pending → parsing → chunking → embedding → done | failed
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    s3_key: Mapped[str] = mapped_column(String, nullable=False)  # object location to fetch + parse
    error: Mapped[str | None] = mapped_column(Text, nullable=True)  # failure message when status=failed
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (Index("ix_documents_workspace_status", "workspace_id", "status"),)


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = _pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String, nullable=False)  # sha256, for idempotency
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBED_DIM), nullable=True)

    __table_args__ = (
        Index("ix_chunks_document", "document_id"),
        UniqueConstraint("document_id", "content_hash", name="uq_chunks_document_hash"),
        # HNSW index on `embedding` is created in the migration (op.execute) —
        # autogenerate can't express the `vector_cosine_ops` opclass.
    )


class Cluster(Base):
    __tablename__ = "clusters"

    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str | None] = mapped_column(String, nullable=True)  # LLM-generated topic label

    __table_args__ = (Index("ix_clusters_workspace", "workspace_id"),)


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    canonical: Mapped[bool] = mapped_column(nullable=False, server_default=text("true"))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBED_DIM), nullable=True)
    cluster_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clusters.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (
        # Race backstop for merge/dedup: a lost lock degrades to "found existing"
        # via INSERT ... ON CONFLICT, never a duplicate node. Case-insensitive on
        # name, so the functional unique index lives in the migration (op.execute).
        Index("ix_concepts_workspace", "workspace_id"),
        Index("ix_concepts_cluster", "cluster_id"),
        # HNSW index on `embedding` + the unique(workspace_id, lower(name)) index
        # are created in the migration.
    )


class ConceptAlias(Base):
    __tablename__ = "concept_aliases"

    # Merged synonyms attach here instead of spawning a new node. (concept_id,
    # alias) is the natural key.
    concept_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True
    )
    alias: Mapped[str] = mapped_column(String, primary_key=True)


class ConceptMention(Base):
    __tablename__ = "concept_mentions"

    # Provenance / citation source. A concept is mentioned once per chunk; the
    # (concept_id, chunk_id) pair is the natural key. document_id is denormalized
    # for fast per-document provenance lookups and deletes.
    concept_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("concepts.id", ondelete="CASCADE"), primary_key=True
    )
    chunk_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chunks.id", ondelete="CASCADE"), primary_key=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (Index("ix_concept_mentions_document", "document_id"),)


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    source_concept_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False
    )
    target_concept_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False
    )
    relation: Mapped[str] = mapped_column(String, nullable=False)
    weight: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))

    __table_args__ = (
        # A repeated relation increments weight instead of inserting a new row.
        UniqueConstraint(
            "workspace_id",
            "source_concept_id",
            "target_concept_id",
            "relation",
            name="uq_edges_triple",
        ),
        Index("ix_edges_workspace", "workspace_id"),
        Index("ix_edges_endpoints", "source_concept_id", "target_concept_id"),
    )
