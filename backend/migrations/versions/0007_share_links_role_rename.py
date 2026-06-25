"""Notion-style sharing: workspace_share_links + role vocabulary rename

Two changes shipped together so they're atomic:

1. The ``workspace_share_links`` table — a reusable, non-email-bound invite link
   (Notion "Copy link"), one row per workspace. Mirrors 0002's invites
   conventions (functional/partial unique-index DDL via ``op.execute``).
2. Rename the role vocabulary to Notion's: ``mentor → editor`` and
   ``member → commenter`` across every place a role string is stored
   (workspace_members, workspace_invites, and the graph_audit history columns so
   the activity feed's badges stay consistent). ``owner`` is unchanged, and the
   new ``viewer`` role only ever appears in rows created after this migration.
   Role columns are plain String (no CHECK/enum), so this is pure data UPDATE.

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-23
"""

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- workspace_share_links: reusable "anyone with the link" join link ---
    op.create_table(
        "workspace_share_links",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "workspace_id",
            sa.Uuid(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column(
            "enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    # One share link per workspace; unique token (mirrors uq_invites_token).
    op.create_index(
        "uq_share_links_workspace", "workspace_share_links", ["workspace_id"], unique=True
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_share_links_token ON workspace_share_links (token)"
    )

    # --- role vocabulary rename: mentor → editor, member → commenter ---
    op.execute("UPDATE workspace_members SET role = 'editor' WHERE role = 'mentor'")
    op.execute("UPDATE workspace_members SET role = 'commenter' WHERE role = 'member'")
    op.execute("UPDATE workspace_invites SET role = 'editor' WHERE role = 'mentor'")
    op.execute("UPDATE workspace_invites SET role = 'commenter' WHERE role = 'member'")
    # graph_audit snapshots the role at edit time + a `source` display tag; migrate
    # both so the activity feed's "editor" badge matches old and new rows.
    op.execute("UPDATE graph_audit SET actor_role = 'editor' WHERE actor_role = 'mentor'")
    op.execute("UPDATE graph_audit SET actor_role = 'commenter' WHERE actor_role = 'member'")
    op.execute("UPDATE graph_audit SET source = 'editor' WHERE source = 'mentor'")


def downgrade() -> None:
    # Reverse the rename, then drop the table (its indexes drop with it).
    op.execute("UPDATE graph_audit SET source = 'mentor' WHERE source = 'editor'")
    op.execute("UPDATE graph_audit SET actor_role = 'member' WHERE actor_role = 'commenter'")
    op.execute("UPDATE graph_audit SET actor_role = 'mentor' WHERE actor_role = 'editor'")
    op.execute("UPDATE workspace_invites SET role = 'member' WHERE role = 'commenter'")
    op.execute("UPDATE workspace_invites SET role = 'mentor' WHERE role = 'editor'")
    op.execute("UPDATE workspace_members SET role = 'member' WHERE role = 'commenter'")
    op.execute("UPDATE workspace_members SET role = 'mentor' WHERE role = 'editor'")
    op.drop_table("workspace_share_links")
