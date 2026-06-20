"""M3 collaboration: annotations (mentor highlight / flag / comment threads)

A mentor (or member) annotates the graph: highlight a promising node, flag a
wrong direction, or comment + reply in a thread; the student reviews these
asynchronously. Target FKs are SET NULL so a note survives the pipeline merging
or GC-ing its concept. Clusters are referenced by label (their ids are rebuilt
each ingest). Hand-authored to match the project convention.

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "annotations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "workspace_id",
            sa.Uuid(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("author_id", sa.String(), nullable=False),
        sa.Column("target_type", sa.String(), nullable=False),
        sa.Column(
            "target_concept_id",
            sa.Uuid(),
            sa.ForeignKey("concepts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "target_edge_id",
            sa.Uuid(),
            sa.ForeignKey("edges.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("target_cluster_label", sa.String(), nullable=True),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column(
            "status", sa.String(), nullable=False, server_default=sa.text("'open'")
        ),
        sa.Column(
            "parent_id",
            sa.Uuid(),
            sa.ForeignKey("annotations.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
    )
    op.create_index("ix_annotations_workspace", "annotations", ["workspace_id"])
    op.create_index("ix_annotations_concept", "annotations", ["target_concept_id"])
    op.create_index("ix_annotations_edge", "annotations", ["target_edge_id"])
    op.create_index("ix_annotations_parent", "annotations", ["parent_id"])
    # Fast count of open notes/flags per workspace for the review tray.
    op.execute(
        "CREATE INDEX ix_annotations_open ON annotations (workspace_id) "
        "WHERE status = 'open'"
    )


def downgrade() -> None:
    op.drop_table("annotations")
