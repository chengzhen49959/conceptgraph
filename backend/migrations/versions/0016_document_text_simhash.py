"""Document text SimHash (lexical near-duplicate key)

Adds ``documents.text_simhash`` — a 64-bit SimHash (hex) of the parsed text. The
content_hash de-dup (0015) only catches byte-identical re-uploads; this catches the
SAME paper from a different file (re-rendered PDF, arxiv v1 vs v2) whose bytes
differ but whose text barely does. The worker fingerprints after parse and, if an
existing document in the workspace is within a few bits (Hamming <= 3), marks the
new row status='duplicate' and skips chunk/embed/extract.

Additive only — no existing column or the embedding dimension changes. Existing
rows are left NULL (backfilled separately from body_markdown). Staged, NOT
auto-applied.

Revision ID: 0016
Revises: 0015
Create Date: 2026-06-27
"""

import sqlalchemy as sa
from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("text_simhash", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "text_simhash")
