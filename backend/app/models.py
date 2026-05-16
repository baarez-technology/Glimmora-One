from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base
from .ids import new_id


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Identity
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("u"))
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="member")  # superadmin | admin | creator | member
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    subscription_tier: Mapped[str] = mapped_column(String(32), default="free")  # free | premium
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    reflections: Mapped[list["Reflection"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    progress: Mapped[list["WatchProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# OTT Content
# ---------------------------------------------------------------------------

class Series(Base):
    __tablename__ = "series"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("s"))
    title: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    tagline: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(64), default="wisdom")
    cover_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    hero_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    accent_color: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    tier: Mapped[str] = mapped_column(String(32), default="free")  # free | premium
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    creator_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    episodes: Mapped[list["Episode"]] = relationship(
        back_populates="series", cascade="all, delete-orphan", order_by="Episode.order_index"
    )


class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("e"))
    series_id: Mapped[str] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), index=True)
    synopsis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    video_url: Mapped[str] = mapped_column(String(1024))  # HLS .m3u8 or mp4
    poster_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    reflection_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tier: Mapped[str] = mapped_column(String(32), default="free")
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    series: Mapped["Series"] = relationship(back_populates="episodes")

    __table_args__ = (UniqueConstraint("series_id", "slug", name="uq_episode_series_slug"),)


class WatchProgress(Base):
    __tablename__ = "watch_progress"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("wp"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    episode_id: Mapped[str] = mapped_column(ForeignKey("episodes.id", ondelete="CASCADE"), index=True)
    position_seconds: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped["User"] = relationship(back_populates="progress")

    __table_args__ = (UniqueConstraint("user_id", "episode_id", name="uq_progress_user_episode"),)


# ---------------------------------------------------------------------------
# AI companion + reflection
# ---------------------------------------------------------------------------

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("cv"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), default="New conversation")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("m"))
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(16))  # user | assistant | system
    content: Mapped[str] = mapped_column(Text)
    emotion: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class Reflection(Base):
    __tablename__ = "reflections"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("r"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text)
    mood: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    intensity: Mapped[int] = mapped_column(Integer, default=5)  # 1..10
    tags: Mapped[list] = mapped_column(JSON, default=list)
    episode_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("episodes.id", ondelete="SET NULL"), nullable=True
    )
    insights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # AI-generated synthesis
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="reflections")


# ---------------------------------------------------------------------------
# Community + creator + audit
# ---------------------------------------------------------------------------

class Circle(Base):
    __tablename__ = "circles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("cl"))
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    theme: Mapped[str] = mapped_column(String(64), default="general")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    posts: Mapped[list["CirclePost"]] = relationship(
        back_populates="circle", cascade="all, delete-orphan", order_by="CirclePost.created_at.desc()"
    )


class CirclePost(Base):
    __tablename__ = "circle_posts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("cp"))
    circle_id: Mapped[str] = mapped_column(ForeignKey("circles.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    anonymous_handle: Mapped[str] = mapped_column(String(64))
    body: Mapped[str] = mapped_column(Text)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    circle: Mapped["Circle"] = relationship(back_populates="posts")


class CreatorApplication(Base):
    __tablename__ = "creator_applications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("ca"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    pitch: Mapped[str] = mapped_column(Text)
    sample_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | approved | denied
    decided_by: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("pr"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("al"))
    actor_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    target: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
