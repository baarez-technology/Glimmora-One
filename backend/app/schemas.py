from datetime import datetime
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


T = TypeVar("T")


class Envelope(CamelModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    error: Optional[str] = None


# ---------------- Auth ----------------

class LoginRequest(CamelModel):
    username: str
    password: str


class SignupRequest(CamelModel):
    username: str = Field(min_length=1, max_length=64)
    email: Optional[EmailStr] = None
    password: str = Field(min_length=1, max_length=128)
    full_name: Optional[str] = None


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ---------------- Users ----------------

class UserPublic(CamelModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool = True
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: dict = Field(default_factory=dict)
    subscription_tier: str       # active tier ("standard" | "premium") computed from subscriptions
    has_pending_application: bool = False
    is_creator_approved: bool = True
    created_at: datetime


class UserUpdate(CamelModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[dict] = None


class OnboardingPayload(CamelModel):
    full_name: Optional[str] = None
    reason: Optional[str] = None
    intention: Optional[str] = None
    focus_areas: list[str] = Field(default_factory=list)
    skipped: bool = False


# ---------------- Daily ritual ----------------

class DailyStep(CamelModel):
    key: str
    title: str
    description: str
    done: bool
    href: str
    cta: str


class DailyPlan(CamelModel):
    date: str
    intention: Optional[str] = None
    focus_areas: list[str] = Field(default_factory=list)
    steps: list[DailyStep]
    streak: int
    all_done: bool


# ---------------- Content ----------------

class EpisodePublic(CamelModel):
    id: str
    series_id: str
    title: str
    slug: str
    synopsis: Optional[str] = None
    duration_seconds: int
    order_index: int
    video_url: str
    poster_url: Optional[str] = None
    reflection_prompt: Optional[str] = None
    tier: str


class SeriesPublic(CamelModel):
    id: str
    title: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    category: str
    cover_url: Optional[str] = None
    hero_url: Optional[str] = None
    accent_color: Optional[str] = None
    tier: str
    tags: list[str] = Field(default_factory=list)
    episodes: list[EpisodePublic] = Field(default_factory=list)


class WatchProgressUpdate(CamelModel):
    episode_id: str
    position_seconds: int
    completed: bool = False


class WatchProgressPublic(CamelModel):
    episode_id: str
    position_seconds: int
    completed: bool
    updated_at: datetime


class ContinueWatchingItem(CamelModel):
    episode: EpisodePublic
    series_title: str
    series_slug: str
    series_cover_url: Optional[str] = None
    progress: WatchProgressPublic


# ---------------- AI / Conversation ----------------

class ChatRequest(CamelModel):
    message: str
    conversation_id: Optional[str] = None


class ChatMessage(CamelModel):
    id: str
    role: str
    content: str
    emotion: Optional[str] = None
    created_at: datetime


class ChatResponse(CamelModel):
    conversation_id: str
    user_message: ChatMessage
    assistant_message: ChatMessage
    detected_emotion: Optional[str] = None
    suggested_reflection: Optional[str] = None
    crisis: bool = False


# ---------------- Reflection ----------------

class ReflectionCreate(CamelModel):
    content: str = Field(min_length=1, max_length=10000)
    prompt: Optional[str] = None
    mood: Optional[str] = None
    intensity: int = Field(default=5, ge=1, le=10)
    tags: list[str] = Field(default_factory=list)
    episode_id: Optional[str] = None


class ReflectionPublic(CamelModel):
    id: str
    content: str
    prompt: Optional[str] = None
    mood: Optional[str] = None
    intensity: int
    tags: list[str]
    episode_id: Optional[str] = None
    insights: Optional[str] = None
    created_at: datetime


class EmotionTrendPoint(CamelModel):
    date: str
    mood: Optional[str]
    intensity: float
    count: int


class DigitalTwinSnapshot(CamelModel):
    total_reflections: int
    streak_days: int
    dominant_mood: Optional[str]
    average_intensity: float
    last_30_days: list[EmotionTrendPoint]
    growth_milestones: list[str]
    tag_cloud: list[dict[str, Any]]


# ---------------- Spiritual Knowledge Graph (SKG) ----------------

class WisdomFramework(CamelModel):
    slug: str
    name: str
    tradition: str  # e.g. "Buddhism", "Stoicism", "Modern psychology"
    summary: str    # one-paragraph framework


class WisdomPractice(CamelModel):
    slug: str
    name: str
    instruction: str  # one-line actionable practice


class LifeSituation(CamelModel):
    slug: str
    title: str             # how the user picks it: "I'm dealing with a breakup"
    tagline: str
    description: str
    emotional_patterns: list[str]
    common_thoughts: list[str]
    keywords: list[str]    # for free-text → situation classifier later
    frameworks: list[WisdomFramework]
    practices: list[WisdomPractice]


class LifeSituationSummary(CamelModel):
    """Lightweight version for list views."""
    slug: str
    title: str
    tagline: str
    emotional_patterns: list[str]


# ---------------- Creator applications ----------------

class CreatorApplicationCreate(CamelModel):
    """Public form payload — creates account AND application in one shot."""
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    pitch: Optional[str] = None
    links: list[str] = Field(default_factory=list)
    attachments: list[str] = Field(default_factory=list)


class CreatorApplicationPublic(CamelModel):
    id: str
    user_id: str
    username: str
    full_name: str
    email: str
    pitch: Optional[str] = None
    links: list[str]
    attachments: list[str]
    status: str
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    decision_note: Optional[str] = None
    created_at: datetime


class CreatorDecisionPayload(CamelModel):
    decision: str  # "approve" | "reject"
    note: Optional[str] = None


# ---------------- Subscriptions ----------------

class SubscriptionCreate(CamelModel):
    tier: str = Field(pattern="^(standard|premium)$")
    start_date: datetime
    end_date: datetime
    note: Optional[str] = None


class SubscriptionUpdate(CamelModel):
    tier: Optional[str] = Field(default=None, pattern="^(standard|premium)$")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    note: Optional[str] = None


class SubscriptionPublic(CamelModel):
    id: str
    user_id: str
    tier: str
    start_date: datetime
    end_date: datetime
    note: Optional[str] = None
    created_by: str
    created_at: datetime
    is_active: bool


# ---------------- Notifications ----------------

class NotificationPublic(CamelModel):
    id: str
    kind: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: datetime


class NotificationUnreadCount(CamelModel):
    unread: int


# ---------------- Admin ----------------

class AdminUserRow(CamelModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    subscription_tier: str
    is_active: bool
    has_pending_application: bool = False
    is_creator_approved: bool = True
    created_at: datetime


class AdminUserUpdate(CamelModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(default=None, pattern="^(customer|creator|moderator)$")
    is_active: Optional[bool] = None
    bio: Optional[str] = None


class ModeratorCreate(CamelModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
