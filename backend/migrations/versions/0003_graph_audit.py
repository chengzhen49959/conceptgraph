"""M2 collaboration: graph_audit (human graph-edit change history + undo log)

Records human concept/edge mutations (not pipeline writes) with full before/after
field snapshots, so a student can review what a mentor changed and undo it. JSONB
is core Postgres (no extension). Hand-authored to match the project convention.

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-21
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "graph_audit",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "workspace_id",
            sa.Uuid(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("actor_id", sa.String(), nullable=False),
        sa.Column("actor_role", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        # Not a FK: the audited row may be gone (a delete), but the record stays.
        sa.Column("entity_id", sa.Uuid(), nullable=False),
        sa.Column("before", JSONB(), nullable=True),
        sa.Column("after", JSONB(), nullable=True),
        sa.Column(
            "source", sa.String(), nullable=False, server_default=sa.text("'user'")
        ),
        sa.Column("undone_by", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
    )
    op.create_index(
        "ix_graph_audit_workspace_created",
        "graph_audit",
        ["workspace_id", "created_at"],
    )
    op.create_index("ix_graph_audit_entity", "graph_audit", ["entity_id"])


def downgrade() -> None:
    op.drop_table("graph_audit")
