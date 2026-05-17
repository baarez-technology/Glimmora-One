"""Superadmin surface — all customers, all subscriptions, moderator management."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import CreatorApplication, Subscription, User
from ..schemas import (
    AdminUserRow,
    AdminUserUpdate,
    Envelope,
    ModeratorCreate,
    SubscriptionCreate,
    SubscriptionPublic,
    SubscriptionUpdate,
)
from ..security import hash_password
from ..services import active_tier, has_pending_application
from .notifications import notify

router = APIRouter(prefix="/v1/admin", tags=["admin"])


def _ensure_superadmin(user: User):
    if user.role != "superadmin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "superadmin role required")


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _is_active_now(s: Subscription) -> bool:
    now = datetime.now(timezone.utc)
    return _aware(s.start_date) <= now <= _aware(s.end_date)


async def _user_row(db: AsyncSession, u: User) -> AdminUserRow:
    return AdminUserRow(
        id=u.id,
        username=u.username,
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        subscription_tier=await active_tier(db, u.id),
        is_active=u.is_active,
        has_pending_application=await has_pending_application(db, u.id),
        is_creator_approved=u.is_creator_approved,
        created_at=u.created_at,
    )


# ----------------- Customers (all users) -----------------

@router.get("/customers", response_model=Envelope[list[AdminUserRow]])
async def list_customers(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    q: str | None = None,
    role: str | None = None,
):
    _ensure_superadmin(user)
    stmt = select(User)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.username).like(like),
                func.lower(User.email).like(like),
                func.lower(User.full_name).like(like),
            )
        )
    if role in ("customer", "creator", "moderator", "superadmin"):
        stmt = stmt.where(User.role == role)
    stmt = stmt.order_by(desc(User.created_at)).limit(500)
    rows = (await db.execute(stmt)).scalars().all()
    return Envelope(data=[await _user_row(db, u) for u in rows])


@router.get("/customers/{user_id}", response_model=Envelope[AdminUserRow])
async def get_customer(
    user_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_superadmin(user)
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    return Envelope(data=await _user_row(db, u))


@router.delete("/customers/{user_id}", response_model=Envelope[dict])
async def delete_customer(
    user_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_superadmin(user)
    if user_id == user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "superadmin cannot delete self")
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    if target.role == "superadmin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "cannot delete another superadmin")
    await db.delete(target)
    await db.commit()
    return Envelope(data={"deleted": True})


@router.patch("/customers/{user_id}", response_model=Envelope[AdminUserRow])
async def update_customer(
    user_id: str,
    payload: AdminUserUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _ensure_superadmin(user)
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    for k, v in data.items():
        setattr(u, k, v)
    await db.commit()
    await db.refresh(u)
    return Envelope(data=await _user_row(db, u))


# ----------------- Subscriptions -----------------

@router.get(
    "/customers/{user_id}/subscriptions",
    response_model=Envelope[list[SubscriptionPublic]],
)
async def list_subscriptions(
    user_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_superadmin(user)
    rows = (
        await db.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .order_by(desc(Subscription.start_date))
        )
    ).scalars().all()
    return Envelope(
        data=[
            SubscriptionPublic(
                id=s.id,
                user_id=s.user_id,
                tier=s.tier,
                start_date=s.start_date,
                end_date=s.end_date,
                note=s.note,
                created_by=s.created_by,
                created_at=s.created_at,
                is_active=_is_active_now(s),
            )
            for s in rows
        ]
    )


@router.post(
    "/customers/{user_id}/subscriptions",
    response_model=Envelope[SubscriptionPublic],
)
async def create_subscription(
    user_id: str,
    payload: SubscriptionCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _ensure_superadmin(user)
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    if payload.end_date <= payload.start_date:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "end_date must be after start_date")
    s = Subscription(
        user_id=user_id,
        tier=payload.tier,
        start_date=payload.start_date,
        end_date=payload.end_date,
        note=payload.note,
        created_by=user.id,
    )
    db.add(s)
    await notify(
        db,
        user_id=user_id,
        kind="subscription_changed",
        title=f"You're on the {payload.tier.title()} tier",
        body=f"Active {payload.start_date.date()} → {payload.end_date.date()}",
        link="/profile",
    )
    await db.commit()
    await db.refresh(s)
    return Envelope(
        data=SubscriptionPublic(
            id=s.id, user_id=s.user_id, tier=s.tier,
            start_date=s.start_date, end_date=s.end_date, note=s.note,
            created_by=s.created_by, created_at=s.created_at, is_active=_is_active_now(s),
        )
    )


@router.patch("/subscriptions/{sub_id}", response_model=Envelope[SubscriptionPublic])
async def update_subscription(
    sub_id: str,
    payload: SubscriptionUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _ensure_superadmin(user)
    s = (
        await db.execute(select(Subscription).where(Subscription.id == sub_id))
    ).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "subscription not found")
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    for k, v in data.items():
        setattr(s, k, v)
    if _aware(s.end_date) <= _aware(s.start_date):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "end_date must be after start_date")
    await notify(
        db,
        user_id=s.user_id,
        kind="subscription_changed",
        title=f"Your subscription was updated ({s.tier.title()})",
        body=f"Active {s.start_date.date()} → {s.end_date.date()}",
        link="/profile",
    )
    await db.commit()
    await db.refresh(s)
    return Envelope(
        data=SubscriptionPublic(
            id=s.id, user_id=s.user_id, tier=s.tier,
            start_date=s.start_date, end_date=s.end_date, note=s.note,
            created_by=s.created_by, created_at=s.created_at, is_active=_is_active_now(s),
        )
    )


@router.delete("/subscriptions/{sub_id}", response_model=Envelope[dict])
async def delete_subscription(
    sub_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_superadmin(user)
    s = (
        await db.execute(select(Subscription).where(Subscription.id == sub_id))
    ).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "subscription not found")
    await db.delete(s)
    await db.commit()
    return Envelope(data={"deleted": True})


# ----------------- Moderators -----------------

@router.get("/moderators", response_model=Envelope[list[AdminUserRow]])
async def list_moderators(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _ensure_superadmin(user)
    rows = (
        await db.execute(
            select(User).where(User.role == "moderator").order_by(desc(User.created_at))
        )
    ).scalars().all()
    return Envelope(data=[await _user_row(db, u) for u in rows])


@router.post("/moderators", response_model=Envelope[AdminUserRow])
async def create_moderator(
    payload: ModeratorCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_superadmin(user)
    clash = (
        await db.execute(
            select(User).where(
                (User.username == payload.username) | (User.email == payload.email)
            )
        )
    ).scalar_one_or_none()
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "username or email already in use")
    m = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role="moderator",
        subscription_tier="standard",
    )
    db.add(m)
    await db.flush()
    await notify(
        db,
        user_id=m.id,
        kind="moderator_promoted",
        title="You've been added as a moderator",
        body="You can now review creator applications.",
        link="/moderate/applications",
    )
    await db.commit()
    await db.refresh(m)
    return Envelope(data=await _user_row(db, m))


@router.delete("/moderators/{user_id}", response_model=Envelope[dict])
async def remove_moderator(
    user_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_superadmin(user)
    m = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not m or m.role != "moderator":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "moderator not found")
    m.role = "customer"
    await db.commit()
    return Envelope(data={"demoted": True})
