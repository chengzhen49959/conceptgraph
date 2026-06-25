"""Document de-dup key + clip metadata — source_url_canonical & doc_metadata

Two additive columns on ``documents``, both for the web clipper:

- ``source_url_canonical`` — the normalised source URL (tracking params + fragment
  stripped, see ``app/services/urls.py``). With the new index
  ``(workspace_id, source_url_canonical)`` the clip endpoint finds a page already
  clipped into the workspace and returns it instead of ingesting a duplicate.
  NULL for file uploads (no URL) and for "save link only" stubs (which must not
  claim the key, so a later real clip can still ingest).
- ``doc_metadata`` (JSONB) — author / published date / site name / image /
  description, scraped client-side at clip time. NULL for uploads. Provenance and
  display only — never a pipeline input.

Additive only — no existing column changes; existing rows keep NULL. Staged, NOT
auto-applied. Apply after 0011.

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-24
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "documents", sa.Column("source_url_canonical", sa.Text(), nullable=True)
    )
    op.add_column("documents", sa.Column("doc_metadata", JSONB(), nullable=True))
    op.create_index(
        "ix_documents_workspace_canonical",
        "documents",
        ["workspace_id", "source_url_canonical"],
    )


def downgrade() -> None:
    op.drop_index("ix_documents_workspace_canonical", table_name="documents")
    op.drop_column("documents", "doc_metadata")
    op.drop_column("documents", "source_url_canonical")
