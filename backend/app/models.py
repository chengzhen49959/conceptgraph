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
from sqlalchemy.dialects.postgresql import JSONB
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
    # Project title shown on the dashboard. Nullable so the migration is
    # backfill-free; the API defaults a display name ("Personal" for the private
    # workspace, "Untitled project" for an unnamed shared one).
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    # Notion-style project icon: an IconPark icon name (e.g. "Microscope") and an
    # accent hex colour (e.g. "#2F88FF"). Both nullable — a workspace without one
    # renders a default icon. Purely presentational; no access-control meaning.
    icon: Mapped[str | None] = mapped_column(String, nullable=True)
    icon_color: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # Bumped on every graph edit / annotation / ingest — drives "last activity"
    # on the dashboard. Nullable: falls back to created_at when never touched.
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
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
    # owner (the student who owns the project) | mentor (advisor: edit + annotate)
    # | member (read + comment). Free-form string so widening the vocabulary is a
    # convention change, not a migration.
    role: Mapped[str] = mapped_column(String, nullable=False, default="owner")


class WorkspaceInvite(Base):
    __tablename__ = "workspace_invites"

    # Invite-before-account: there is no users table, so we can't resolve an email
    # to a Cognito sub at invite time. We key the invite by email and bind the
    # accepter's sub only when they log in and POST /accept (their id token then
    # carries the email). One live (pending) invite per email per workspace is
    # enforced by a partial unique index created in the migration.
    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # role granted on accept
    token: Mapped[str] = mapped_column(String, nullable=False)  # URL-safe secret
    invited_by: Mapped[str] = mapped_column(String, nullable=False)  # Cognito sub
    # pending → accepted | revoked
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    accepted_by: Mapped[str | None] = mapped_column(String, nullable=True)  # Cognito sub

    __table_args__ = (
        # ix on workspace_id for the members/invites panel; the unique token index
        # and the partial "one pending invite per (workspace, lower(email))" index
        # are created in the migration (op.execute) — functional/partial DDL.
        Index("ix_workspace_invites_workspace", "workspace_id"),
    )


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
    # How this node entered the graph: 'extracted' (pipeline) or 'manual' (a
    # hand-authored research-direction node — research question / hypothesis /
    # next step). Manual nodes carry no embedding, so they never become a merge
    # candidate, but an exact-name insert still folds into them. server_default
    # backfills existing rows and covers the worker's core INSERTs (which don't
    # set origin).
    origin: Mapped[str] = mapped_column(
        String, nullable=False, server_default=text("'extracted'")
    )
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


class GraphAudit(Base):
    __tablename__ = "graph_audit"

    # Change history for HUMAN graph edits (concepts/edges) — the "what did my
    # collaborator change" feed that powers async mentor review + undo. The
    # pipeline's own writes are NOT audited (they'd flood the log). `before`/
    # `after` are full field snapshots, enough to replay the inverse for undo.
    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[str] = mapped_column(String, nullable=False)  # Cognito sub
    actor_role: Mapped[str] = mapped_column(String, nullable=False)  # role at edit time
    # concept.create | concept.update | concept.delete | edge.create | edge.update | edge.delete
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)  # concept | edge
    # The affected row's id. NOT a FK: on delete the row is gone but the audit
    # record (and its `before` snapshot) must survive for review + undo.
    entity_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    before: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # user | mentor | pipeline — lets the feed distinguish a mentor's edits.
    source: Mapped[str] = mapped_column(
        String, nullable=False, server_default=text("'user'")
    )
    # Set when a later entry reverts this one (points at the undo's audit id).
    undone_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_graph_audit_workspace_created", "workspace_id", "created_at"),
        Index("ix_graph_audit_entity", "entity_id"),
    )


class Annotation(Base):
    __tablename__ = "annotations"

    # A mentor's (or member's) note on the graph: highlight a promising node, flag
    # a wrong direction, or comment + reply in a thread. The student reviews these
    # asynchronously. Highlight/flag are restricted to owner/mentor at the router.
    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    author_id: Mapped[str] = mapped_column(String, nullable=False)  # Cognito sub
    target_type: Mapped[str] = mapped_column(String, nullable=False)  # concept | edge | cluster
    # Target FKs are SET NULL (not CASCADE): when the pipeline merges or GCs a
    # concept, the note survives as an orphan so the student still sees "your
    # mentor flagged something here" rather than it silently vanishing.
    target_concept_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True
    )
    target_edge_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("edges.id", ondelete="SET NULL"), nullable=True
    )
    # Clusters are referenced by LABEL, not id: recompute_clusters re-creates
    # cluster rows with fresh ids on every ingest, so an id reference would orphan.
    target_cluster_label: Mapped[str | None] = mapped_column(String, nullable=True)
    kind: Mapped[str] = mapped_column(String, nullable=False)  # highlight | flag | comment
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    # open | resolved — only roots carry a status; a reply points at its root.
    status: Mapped[str] = mapped_column(
        String, nullable=False, server_default=text("'open'")
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("annotations.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_annotations_workspace", "workspace_id"),
        Index("ix_annotations_concept", "target_concept_id"),
        Index("ix_annotations_edge", "target_edge_id"),
        Index("ix_annotations_parent", "parent_id"),
        # Partial index for the open-flag/open-note tray is created in the migration.
    )
