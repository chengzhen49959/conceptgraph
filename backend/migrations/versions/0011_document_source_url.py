"""Document.source_url — web origin for clipped documents

The Chrome clipper extension extracts a page's clean main text and ingests it via
``POST /api/imports/clip``; the page URL is recorded here for provenance. NULL for
file uploads, which have no source URL. Additive only — no existing column changes
and an existing document keeps NULL. Staged, NOT auto-applied.

Revision ID: 0011
Revises: 0010
Create Date: 2026-06-24
"""

import sqlalchemy as sa
from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("source_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "source_url")
