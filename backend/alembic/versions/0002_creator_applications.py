"""creator applications

Revision ID: 0002_creator_apps
Revises: 0001_init
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa


revision = "0002_creator_apps"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "creator_applications",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("pitch", sa.Text(), nullable=False),
        sa.Column("sample_url", sa.String(length=1024), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("decided_by", sa.String(length=32), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("creator_applications")
