"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("username", sa.String(length=64), nullable=False, unique=True, index=True),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="member"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("avatar_url", sa.String(length=512), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("preferences", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("subscription_tier", sa.String(length=32), nullable=False, server_default="free"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "series",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False, index=True),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("tagline", sa.String(length=512), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=64), nullable=False, server_default="wisdom"),
        sa.Column("cover_url", sa.String(length=512), nullable=True),
        sa.Column("hero_url", sa.String(length=512), nullable=True),
        sa.Column("accent_color", sa.String(length=16), nullable=True),
        sa.Column("tier", sa.String(length=32), nullable=False, server_default="free"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("creator_id", sa.String(length=32), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "episodes",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("series_id", sa.String(length=32), sa.ForeignKey("series.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, index=True),
        sa.Column("synopsis", sa.Text(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("video_url", sa.String(length=1024), nullable=False),
        sa.Column("poster_url", sa.String(length=512), nullable=True),
        sa.Column("reflection_prompt", sa.Text(), nullable=True),
        sa.Column("tier", sa.String(length=32), nullable=False, server_default="free"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("series_id", "slug", name="uq_episode_series_slug"),
    )

    op.create_table(
        "watch_progress",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("episode_id", sa.String(length=32), sa.ForeignKey("episodes.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("position_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "episode_id", name="uq_progress_user_episode"),
    )

    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(length=255), nullable=False, server_default="New conversation"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("conversation_id", sa.String(length=32), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("emotion", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "reflections",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("mood", sa.String(length=32), nullable=True),
        sa.Column("intensity", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("tags", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("episode_id", sa.String(length=32), sa.ForeignKey("episodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("insights", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "circles",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("theme", sa.String(length=64), nullable=False, server_default="general"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "circle_posts",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("circle_id", sa.String(length=32), sa.ForeignKey("circles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.String(length=32), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("anonymous_handle", sa.String(length=64), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("flagged", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("actor_id", sa.String(length=32), nullable=True, index=True),
        sa.Column("action", sa.String(length=128), nullable=False, index=True),
        sa.Column("target", sa.String(length=255), nullable=True),
        sa.Column("meta", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), index=True),
    )


def downgrade() -> None:
    for t in (
        "audit_logs",
        "circle_posts",
        "circles",
        "reflections",
        "messages",
        "conversations",
        "watch_progress",
        "episodes",
        "series",
        "users",
    ):
        op.drop_table(t)
