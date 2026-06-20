"""Workspace project icon (Notion-style)

Adds two nullable, presentational columns to ``workspaces``: ``icon`` (an
IconPark icon name, e.g. "Microscope") and ``icon_color`` (an accent hex, e.g.
"#2F88FF"). Both nullable so the ALTER is backfill-free; a workspace without an
icon renders a default in the UI. No access-control or data meaning.

Mirrors 0002's additive column convention.

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-21
"""

import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("workspaces", sa.Column("icon", sa.String(), nullable=True))
    op.add_column("workspaces", sa.Column("icon_color", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("workspaces", "icon_color")
    op.drop_column("workspaces", "icon")
