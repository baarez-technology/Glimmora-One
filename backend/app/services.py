"""Small cross-router helpers."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import CreatorApplication, Subscription, User


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


async def active_tier(db: AsyncSession, user_id: str) -> str:
    """Return 'premium' if user has any subscription whose [start, end] covers
    now, else 'standard'."""
    now = datetime.now(timezone.utc)
    subs = (
        await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    ).scalars().all()
    for s in subs:
        if _aware(s.start_date) <= now <= _aware(s.end_date) and s.tier == "premium":
            return "premium"
    return "standard"


async def has_pending_application(db: AsyncSession, user_id: str) -> bool:
    row = (
        await db.execute(
            select(CreatorApplication.id)
            .where(
                CreatorApplication.user_id == user_id,
                CreatorApplication.status == "pending",
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    return row is not None


async def hydrate_user(db: AsyncSession, user: User) -> dict:
    """Build the camelCase-ready payload for UserPublic, with derived fields."""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "fullName": user.full_name,
        "role": user.role,
        "isActive": user.is_active,
        "avatarUrl": user.avatar_url,
        "bio": user.bio,
        "preferences": user.preferences,
        "subscriptionTier": await active_tier(db, user.id),
        "hasPendingApplication": await has_pending_application(db, user.id),
        "createdAt": user.created_at,
    }
