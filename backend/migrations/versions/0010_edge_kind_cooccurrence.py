"""Edge.kind — co-occurrence vs relation

Adds ``edges.kind`` so the concept graph can carry two edge sets in one table:

- ``'relation'`` — an LLM-extracted directed relation (the existing rows; the
  column backfills to this via its server default), shown in the graph view.
- ``'cooccur'`` — an undirected same-chunk co-occurrence edge (``relation=''``),
  a clustering substrate hidden from the view. It densifies an otherwise sparse
  graph so two-level Leiden finds real communities instead of leaving weakly
  related concepts isolated (and leaning on the orphan kNN rescue).

``kind`` joins ``uq_edges_triple`` so a co-occurrence edge and a directed relation
between the same two concepts coexist rather than collide on upsert.

Additive only — no existing column or the embedding dimension changes. Staged,
NOT auto-applied.

Revision ID: 0010
Revises: 0009
Create Date: 2026-06-24
"""

import sqlalchemy as sa
from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

_OLD_COLS = ["workspace_id", "source_concept_id", "target_concept_id", "relation"]
_NEW_COLS = [*_OLD_COLS, "kind"]


def upgrade() -> None:
    op.add_column(
        "edges",
        sa.Column(
            "kind", sa.String(), nullable=False, server_default=sa.text("'relation'")
        ),
    )
    op.drop_constraint("uq_edges_triple", "edges", type_="unique")
    op.create_unique_constraint("uq_edges_triple", "edges", _NEW_COLS)


def downgrade() -> None:
    # Co-occurrence edges (relation='') would alias onto the narrower key; drop them
    # before restoring the old constraint so it can't fail on a duplicate.
    op.execute("DELETE FROM edges WHERE kind = 'cooccur'")
    op.drop_constraint("uq_edges_triple", "edges", type_="unique")
    op.create_unique_constraint("uq_edges_triple", "edges", _OLD_COLS)
    op.drop_column("edges", "kind")
