from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base
from .ids import new_id


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("u"))
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="customer")  # customer | creator | moderator | superadmin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # True for everyone except creators with a pending application.
    # Flipped to False when /apply succeeds, back to True on moderator approve.
    # Stays True for non-creator roles (the field is just irrelevant for them).
    is_creator_approved: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)
    subscription_tier: Mapped[str] = mapped_column(String(32), default="free")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    reflections: Mapped[list["Reflection"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    progress: Mapped[list["WatchProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="user", cascade="all, delete-orphan", order_by="Subscription.start_date.desc()")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan", order_by="Notification.created_at.desc()")
    creator_applications: Mapped[list["CreatorApplication"]] = relationship(back_populates="user", cascade="all, delete-orphan", order_by="CreatorApplication.created_at.desc()")


class Series(Base):
    __tablename__ = "series"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("s"))
    # Owner. Nullable for legacy/seeded catalog series (no specific creator).
    # Creator-authored series always set this; studio CRUD scopes by it.
    creator_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    tagline: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(64), default="wisdom")
    # URLs use Text so signed image URLs / base64 data URLs / Drive links
    # (which routinely exceed 512 chars) don't blow up with a column-length
    # error from the DB.
    cover_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hero_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    accent_color: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    tier: Mapped[str] = mapped_column(String(32), default="free")
    published: Mapped[bool] = mapped_column(Boolean, default=True)
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
    video_url: Mapped[str] = mapped_column(Text)
    poster_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    role: Mapped[str] = mapped_column(String(16))
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
    intensity: Mapped[int] = mapped_column(Integer, default=5)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    episode_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("episodes.id", ondelete="SET NULL"), nullable=True
    )
    insights: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="reflections")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("sub"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    tier: Mapped[str] = mapped_column(String(32))  # standard | premium
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(32))  # superadmin user_id
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="subscriptions")


class CreatorApplication(Base):
    __tablename__ = "creator_applications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("ca"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    pitch: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    links: Mapped[list] = mapped_column(JSON, default=list)        # ["https://...", ...]
    attachments: Mapped[list] = mapped_column(JSON, default=list)  # ["https://..." attachment URLs]
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | approved | rejected
    decided_by: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="creator_applications")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("n"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(64))   # application_submitted | application_approved | application_rejected | subscription_changed | moderator_promoted | ...
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="notifications")
