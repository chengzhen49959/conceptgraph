"""Full-text search vectors for hybrid retrieval (chunks + concepts)

The conversational agent's retrieval (services/search.py) fuses a lexical ranking
with the vector ANN so exact terms — acronyms, method names — aren't lost to pure
semantics. This adds the lexical side: a GENERATED ``tsvector`` column on
``chunks`` (over content) and ``concepts`` (over name + description), each with a
GIN index.

GENERATED ALWAYS ... STORED (not a trigger) keeps the vector in lockstep with the
source text automatically — the two-arg ``to_tsvector('english', ...)`` is
IMMUTABLE with a constant config, which a generated column requires. Additive and
DDL-only: no row backfill, no embedding-dimension change.

Revision ID: 0018
Revises: 0017
Create Date: 2026-06-28
"""

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE chunks ADD COLUMN content_tsv tsvector "
        "GENERATED ALWAYS AS (to_tsvector('english', content)) STORED"
    )
    op.execute(
        "CREATE INDEX ix_chunks_content_tsv ON chunks USING gin (content_tsv)"
    )
    op.execute(
        "ALTER TABLE concepts ADD COLUMN text_tsv tsvector "
        "GENERATED ALWAYS AS "
        "(to_tsvector('english', name || ' ' || coalesce(description, ''))) STORED"
    )
    op.execute(
        "CREATE INDEX ix_concepts_text_tsv ON concepts USING gin (text_tsv)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_concepts_text_tsv")
    op.execute("ALTER TABLE concepts DROP COLUMN IF EXISTS text_tsv")
    op.execute("DROP INDEX IF EXISTS ix_chunks_content_tsv")
    op.execute("ALTER TABLE chunks DROP COLUMN IF EXISTS content_tsv")
