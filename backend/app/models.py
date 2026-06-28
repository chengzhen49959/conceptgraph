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
    Boolean,
    Computed,
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
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
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
    # Notion-style roles: owner (project owner: full access) | editor (edit graph
    # + annotate) | commenter (read + comment) | viewer (read only). Free-form
    # string so widening the vocabulary is a convention change, not a migration.
    role: Mapped[str] = mapped_column(String, nullable=False, default="owner")
    # High-water mark for the activity feed's unread badge: the last time this
    # member opened the Activity panel. Unread = events by *others* newer than
    # this. Nullable (never opened → everything by others counts as unread).
    last_seen_activity_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class WorkspaceShareLink(Base):
    __tablename__ = "workspace_share_links"

    # A reusable, non-email-bound invite link (Notion "Copy link"). Exactly one
    # row per workspace: anyone who opens the link and logs in joins as `role`.
    # Multi-use, toggled on/off via `enabled`, with a mutable role and a rotatable
    # token. Disabling (or rotating the token) is how a link is revoked.
    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String, nullable=False)  # role granted on join
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    token: Mapped[str] = mapped_column(String, nullable=False)  # URL-safe secret
    created_by: Mapped[str] = mapped_column(String, nullable=False)  # Cognito sub
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        # One share link per workspace. The unique token index is created in the
        # migration (op.execute), mirroring uq_invites_token.
        Index("uq_share_links_workspace", "workspace_id", unique=True),
    )


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)  # pdf | markdown | text
    # pending → parsing → chunking → embedding → extracting → merging → clustering
    #   → done | failed  (worker advances this at each phase boundary; the frontend polls it)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    # Sub-stage progress for the slow merge phase: how many distinct concepts have been
    # resolved (current) out of the total this document contributes (total). Both NULL
    # outside merging — every status transition clears them (worker._set_status) — so the
    # UI renders a live "Merging 30/62" only while it's meaningful. Display only; the
    # pipeline never reads them back.
    progress_current: Mapped[int | None] = mapped_column(Integer, nullable=True)
    progress_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    s3_key: Mapped[str] = mapped_column(String, nullable=False)  # object location to fetch + parse
    # Web origin this document was clipped from (Chrome extension's POST /api/imports/clip).
    # NULL for file uploads, which have no source URL. Provenance only — the pipeline
    # doesn't read it; it's surfaced in the UI so a concept can link back to its source page.
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Normalised source_url (tracking params + fragment stripped — see services/urls.py),
    # the per-workspace de-dup key: clip() looks one up before ingesting so re-clipping a
    # page returns the existing document instead of a duplicate. NULL for uploads. Derived
    # from source_url; never read by the pipeline.
    source_url_canonical: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Page metadata scraped client-side at clip time (author, published date, site name,
    # image, description). NULL for uploads. Provenance/display only — not a pipeline input.
    # Attribute is `doc_metadata`; plain `metadata` is reserved by the Declarative base.
    doc_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)  # failure message when status=failed
    # One doc-level summary (spec: resource.summary), aggregated from the per-chunk
    # summaries the extractor returns and embedded for future document search.
    # Populated on ingest; nullable so a pre-summary document stays valid.
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_embedding: Mapped[list[float] | None] = mapped_column(
        Vector(EMBED_DIM), nullable=True
    )
    # The full parsed source as Markdown (PDFs rendered, md/text decoded) — the
    # exact text the pipeline chunked, kept so the reader can show the original.
    # Nullable: pre-feature documents have none until the content endpoint lazily
    # backfills them by re-parsing from S3. Web clips keep `source_url` as well.
    body_markdown: Mapped[str | None] = mapped_column(Text, nullable=True)
    # sha256 of the raw uploaded bytes — the per-workspace file-content de-dup key
    # (the upload counterpart to source_url_canonical for clips). NULL until the
    # worker computes it after fetching the object from S3. Re-uploading the same
    # file lands a row whose hash matches an existing document; the worker then
    # marks this one status='duplicate' and skips the pipeline, so a paper read once
    # contributes its concepts/edges exactly once (edge weight = papers that agree).
    content_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    # 64-bit SimHash (hex) of the parsed text — the lexical near-duplicate key that
    # content_hash can't catch: a re-rendered PDF / arxiv v1-vs-v2 has different bytes
    # but near-identical text, so its fingerprint is within a few bits. Set after parse;
    # see services/simhash.py and the worker's near-duplicate check.
    text_simhash: Mapped[str | None] = mapped_column(String, nullable=True)
    # The original this document duplicates (same content_hash, or near-identical text,
    # in the workspace). Set alongside status='duplicate'; SET NULL if the original is
    # deleted.
    duplicate_of: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_documents_workspace_status", "workspace_id", "status"),
        # De-dup lookup: find a workspace's existing clip of a page by canonical URL.
        Index("ix_documents_workspace_canonical", "workspace_id", "source_url_canonical"),
        # De-dup lookup: find a workspace's existing copy of a file by content hash.
        Index("ix_documents_workspace_content_hash", "workspace_id", "content_hash"),
    )


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = _pk()
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String, nullable=False)  # sha256, for idempotency
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBED_DIM), nullable=True)
    # Generated full-text vector for hybrid lexical retrieval (Phase 3, search.py).
    # DB-maintained (GENERATED ALWAYS ... STORED), so it is read-only here: Computed
    # stops the ORM ever writing it; deferred keeps the tsvector blob off ordinary
    # Chunk loads (only the lexical query reads it). The GIN index is in the migration.
    content_tsv: Mapped[str | None] = mapped_column(
        TSVECTOR,
        Computed("to_tsvector('english', content)", persisted=True),
        nullable=True,
        deferred=True,
    )

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
    # Emergent hierarchy (multi-level Leiden): a leaf cluster carries concepts; a
    # parent groups leaf clusters. NULL for a top-level cluster.
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clusters.id", ondelete="CASCADE"), nullable=True
    )

    __table_args__ = (
        Index("ix_clusters_workspace", "workspace_id"),
        Index("ix_clusters_parent", "parent_id"),
    )


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
    # Generated full-text vector over name + description (Phase 3 hybrid retrieval).
    # Read-only / deferred for the same reasons as Chunk.content_tsv; GIN in migration.
    text_tsv: Mapped[str | None] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', name || ' ' || coalesce(description, ''))",
            persisted=True,
        ),
        nullable=True,
        deferred=True,
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
    # 'relation' — an LLM-extracted directed relation, shown in the graph view.
    # 'cooccur' — an undirected same-chunk co-occurrence edge (relation=''), a
    # clustering substrate hidden from the view: it densifies the graph so Leiden
    # finds real communities instead of leaving sparsely-related concepts isolated.
    # Both kinds live in one table so the partition reads a single weighted edge set.
    kind: Mapped[str] = mapped_column(String, nullable=False, server_default=text("'relation'"))
    weight: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))

    __table_args__ = (
        # A repeated edge increments weight instead of inserting a new row. `kind` is
        # part of the key so a co-occurrence edge and a directed relation between the
        # same two concepts coexist rather than collide.
        UniqueConstraint(
            "workspace_id",
            "source_concept_id",
            "target_concept_id",
            "relation",
            "kind",
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
    # user | editor | pipeline — lets the feed distinguish a non-owner editor's edits.
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
    # Fetch server-evaluated defaults (the ``onupdate=now()`` on ``updated_at``)
    # via RETURNING on INSERT *and UPDATE*. Without this, a status change expires
    # ``updated_at`` after commit; reading it in ``_ann_out`` then triggers a sync
    # lazy-load on the AsyncSession → ``MissingGreenlet`` → 500. See annotations.py.
    __mapper_args__ = {"eager_defaults": True}

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


class Conversation(Base):
    __tablename__ = "conversations"

    # A multi-turn chat between one user and the in-product research agent, over a
    # workspace's library. Unlike the graph (shared by all members), a conversation
    # is PRIVATE to the user who started it — scoped by (workspace_id, owner_id), so
    # `owner_id` is part of every lookup, not just `workspace_id`.
    id: Mapped[uuid.UUID] = _pk()
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    owner_id: Mapped[str] = mapped_column(String, nullable=False)  # Cognito sub
    # Derived from the first user message (the UI shows it in the conversation
    # list). Nullable until the first turn names it.
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # Bumped on each new message so the list can sort by recent activity.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index(
            "ix_conversations_ws_owner_created",
            "workspace_id",
            "owner_id",
            "created_at",
        ),
    )


class Message(Base):
    __tablename__ = "messages"
    # Same eager-defaults guard as Annotation: read server-evaluated `created_at`
    # via RETURNING so touching it after commit doesn't trigger a sync lazy-load on
    # the AsyncSession (→ MissingGreenlet → 500).
    __mapper_args__ = {"eager_defaults": True}

    # One turn in a Conversation. `role` is free-form string (user | assistant |
    # tool) per the repo convention — widening it is a convention change, not a
    # migration. The agent's multi-step tool trace is kept on the assistant turn
    # for display/audit (what it searched, which concepts it opened); it is NOT the
    # replayed context (history is rebuilt from user/assistant `content`).
    id: Mapped[uuid.UUID] = _pk()
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String, nullable=False)  # user | assistant | tool
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Assistant turn's tool trace: [{name, status, ...}] — for the activity UI.
    tool_calls: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # Concept ids the answer cited (parsed from [n] markers), for graph highlight.
    cited_concept_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_messages_conversation_created", "conversation_id", "created_at"),
    )
