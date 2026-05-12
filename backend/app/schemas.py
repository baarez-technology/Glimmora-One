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
    email: str  # may be a `<username>@noemail.local` placeholder; not validated as an address
    full_name: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: dict = Field(default_factory=dict)
    subscription_tier: str
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
    key: str  # arrive | notice | reflect
    title: str
    description: str
    done: bool
    href: str
    cta: str


class DailyPlan(CamelModel):
    date: str  # YYYY-MM-DD
    intention: Optional[str] = None
    focus_areas: list[str] = Field(default_factory=list)
    steps: list[DailyStep]
    streak: int
    all_done: bool


# ---------------- Creator application ----------------

class CreatorApplicationCreate(CamelModel):
    pitch: str = Field(min_length=1, max_length=2000)
    sample_url: Optional[str] = None


class CreatorApplicationPublic(CamelModel):
    id: str
    user_id: str
    username: str
    pitch: str
    sample_url: Optional[str] = None
    status: str
    decided_by: Optional[str] = None
    decided_at: Optional[datetime] = None
    created_at: datetime


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
    recommended_episode_ids: list[str] = Field(default_factory=list)
    crisis: bool = False


class ConversationSummary(CamelModel):
    id: str
    title: str
    updated_at: datetime
    last_message_preview: Optional[str] = None


class ConversationDetail(CamelModel):
    id: str
    title: str
    created_at: datetime
    messages: list[ChatMessage]


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
    date: str  # YYYY-MM-DD
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
    tag_cloud: list[dict[str, Any]]  # [{tag, count}]


# ---------------- Community ----------------

class CirclePublic(CamelModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    theme: str
    post_count: int = 0


class CirclePostCreate(CamelModel):
    body: str = Field(min_length=1, max_length=4000)


class CirclePostPublic(CamelModel):
    id: str
    circle_id: str
    anonymous_handle: str
    body: str
    flagged: bool
    created_at: datetime


# ---------------- Creator ----------------

class SeriesCreate(CamelModel):
    title: str
    slug: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    category: str = "wisdom"
    tier: str = "free"
    cover_url: Optional[str] = None
    hero_url: Optional[str] = None
    accent_color: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class EpisodeCreate(CamelModel):
    series_id: str
    title: str
    slug: str
    synopsis: Optional[str] = None
    duration_seconds: int = 0
    order_index: int = 0
    video_url: str
    poster_url: Optional[str] = None
    reflection_prompt: Optional[str] = None
    tier: str = "free"


# ---------------- Admin ----------------

class AdminUserRow(CamelModel):
    id: str
    username: str
    email: str
    role: str
    subscription_tier: str
    is_active: bool
    created_at: datetime


class AdminStats(CamelModel):
    users: int
    series: int
    episodes: int
    reflections: int
    conversations: int
    posts: int
