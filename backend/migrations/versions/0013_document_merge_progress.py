"""Document merge-phase progress counters

Adds ``documents.progress_current`` / ``documents.progress_total`` — the
"30 of 62 concepts resolved" pair the worker writes during the slow merge phase
so the UI can show a live count + rough ETA instead of an opaque spinner. Both
nullable and NULL outside merging (every status transition clears them).

Additive only — no existing column or the embedding dimension changes. Staged,
NOT auto-applied.

Revision ID: 0013
Revises: 0012
Create Date: 2026-06-25
"""

import sqlalchemy as sa
from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("progress_current", sa.Integer(), nullable=True))
    op.add_column("documents", sa.Column("progress_total", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("documents", "progress_total")
    op.drop_column("documents", "progress_current")
