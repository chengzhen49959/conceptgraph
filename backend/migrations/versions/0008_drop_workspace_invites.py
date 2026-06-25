"""Drop workspace_invites: sharing is link-only now

The email-bound, single-use invite flow (``workspace_invites`` + SES delivery)
was removed in favour of the reusable share link (``workspace_share_links``,
added in 0007). With no code reading or writing the table, it is dropped here.

``downgrade`` recreates the table and its indexes exactly as 0002 did, so a
downgrade past 0007 (whose role-rename UPDATEs touch ``workspace_invites``) still
finds a table to update.

Revision ID: 0008
Revises: 0007
Create Date: 2026-06-23
"""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The three indexes (ix_workspace_invites_workspace, uq_invites_token,
    # uq_invites_ws_email_pending) drop with the table.
    op.drop_table("workspace_invites")


def downgrade() -> None:
    # Recreate exactly as 0002 did (table + its three indexes).
    op.create_table(
        "workspace_invites",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "workspace_id",
            sa.Uuid(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("invited_by", sa.String(), nullable=False),
        sa.Column(
            "status", sa.String(), nullable=False, server_default=sa.text("'pending'")
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_by", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_workspace_invites_workspace", "workspace_invites", ["workspace_id"]
    )
    op.execute("CREATE UNIQUE INDEX uq_invites_token ON workspace_invites (token)")
    op.execute(
        "CREATE UNIQUE INDEX uq_invites_ws_email_pending "
        "ON workspace_invites (workspace_id, lower(email)) WHERE status = 'pending'"
    )
