"""Document source text (parsed Markdown)

Adds ``documents.body_markdown`` — the full parsed source the pipeline chunked,
kept verbatim so the reader view can show the original (PDFs rendered to
Markdown, md/text decoded). Nullable: pre-feature rows have none until the
content endpoint lazily backfills them by re-parsing from S3.

Additive only — no existing column or the embedding dimension changes. Staged,
NOT auto-applied.

Revision ID: 0014
Revises: 0013
Create Date: 2026-06-25
"""

import sqlalchemy as sa
from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("body_markdown", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "body_markdown")
