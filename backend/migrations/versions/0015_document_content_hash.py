"""Document content-hash de-dup

Adds ``documents.content_hash`` (sha256 of the raw uploaded bytes) and
``documents.duplicate_of`` (FK to the original it duplicates). The worker hashes
the object after fetching it from S3; if a non-duplicate document with the same
hash already exists in the workspace it marks the new row status='duplicate',
links ``duplicate_of``, and skips the pipeline — so a paper read once contributes
its concepts/edges exactly once and edge weight means "papers that agree", not
"times re-uploaded". Indexed by (workspace_id, content_hash) for the lookup.

Additive only — no existing column or the embedding dimension changes. Existing
rows are left NULL (no retroactive de-dup). Staged, NOT auto-applied.

Revision ID: 0015
Revises: 0014
Create Date: 2026-06-27
"""

import sqlalchemy as sa
from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("content_hash", sa.String(), nullable=True))
    op.add_column("documents", sa.Column("duplicate_of", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_documents_duplicate_of",
        "documents",
        "documents",
        ["duplicate_of"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_documents_workspace_content_hash",
        "documents",
        ["workspace_id", "content_hash"],
    )


def downgrade() -> None:
    op.drop_index("ix_documents_workspace_content_hash", table_name="documents")
    op.drop_constraint("fk_documents_duplicate_of", "documents", type_="foreignkey")
    op.drop_column("documents", "duplicate_of")
    op.drop_column("documents", "content_hash")
