"""Conversations + messages (in-product research-agent chat)

The web app gains a first-party, multi-turn conversational agent over a
workspace's library (the external MCP path already serves Claude clients; this is
the in-product equivalent). A ``conversation`` is PRIVATE to the user who started
it — scoped by ``(workspace_id, owner_id)``, unlike the shared graph. A
``message`` is one turn; the assistant turn keeps the agent's tool trace and the
concept ids it cited (for the activity UI and graph highlight).

Additive only — two new tables, no existing column or the embedding dimension
changes. Hand-authored to match the project convention. Staged, NOT auto-applied.

Revision ID: 0017
Revises: 0016
Create Date: 2026-06-28
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "workspace_id",
            sa.Uuid(),
            sa.ForeignKey("workspaces.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
    )
    op.create_index(
        "ix_conversations_ws_owner_created",
        "conversations",
        ["workspace_id", "owner_id", "created_at"],
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "conversation_id",
            sa.Uuid(),
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("tool_calls", postgresql.JSONB(), nullable=True),
        sa.Column("cited_concept_ids", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")
        ),
    )
    op.create_index(
        "ix_messages_conversation_created",
        "messages",
        ["conversation_id", "created_at"],
    )


def downgrade() -> None:
    # messages references conversations → drop the child table first.
    op.drop_index("ix_messages_conversation_created", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_conversations_ws_owner_created", table_name="conversations")
    op.drop_table("conversations")
