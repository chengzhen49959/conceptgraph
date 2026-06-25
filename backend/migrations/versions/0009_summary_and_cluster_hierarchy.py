"""Doc summary + hierarchical cluster parent_id

Borrowed from the knowledge-pipeline spec, mapped onto our table names:

- ``documents.summary`` / ``documents.summary_embedding`` — one doc-level summary
  (the spec's ``resource.summary``), produced by aggregating the per-chunk
  summaries the extractor now returns, and embedded so it can later back a
  document search. Both nullable; an existing document gains them on re-ingest.
- ``clusters.parent_id`` — a self-FK that turns the flat topic list into an
  emergent hierarchy (multi-level Leiden). Leaf clusters carry the concepts;
  parent clusters group leaves. ``ON DELETE CASCADE`` because ``recompute_clusters``
  rebuilds the whole workspace each run, so a parent and its subtree drop together.

Additive only — no existing column or the embedding dimension changes. Staged,
NOT auto-applied.

Revision ID: 0009
Revises: 0008
Create Date: 2026-06-23
"""

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None

EMBED_DIM = 1536  # keep in sync with app.models.EMBED_DIM


def upgrade() -> None:
    op.add_column("documents", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column(
        "documents",
        sa.Column("summary_embedding", Vector(EMBED_DIM), nullable=True),
    )
    op.add_column("clusters", sa.Column("parent_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_clusters_parent_id",
        "clusters",
        "clusters",
        ["parent_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_clusters_parent", "clusters", ["parent_id"])


def downgrade() -> None:
    op.drop_index("ix_clusters_parent", table_name="clusters")
    op.drop_constraint("fk_clusters_parent_id", "clusters", type_="foreignkey")
    op.drop_column("clusters", "parent_id")
    op.drop_column("documents", "summary_embedding")
    op.drop_column("documents", "summary")
