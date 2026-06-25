"""Member activity-feed read marker

Adds one nullable column to ``workspace_members``: ``last_seen_activity_at`` — the
last time the member opened the Activity panel. The unread badge counts feed
events by *other* members newer than this. Nullable so the ALTER is backfill-free
(a member who never opened the panel sees everything by others as unread).

Mirrors 0005's additive column convention.

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-23
"""

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "workspace_members",
        sa.Column("last_seen_activity_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("workspace_members", "last_seen_activity_at")
