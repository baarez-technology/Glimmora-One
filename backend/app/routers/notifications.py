from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import Notification
from ..schemas import Envelope, NotificationPublic, NotificationUnreadCount

router = APIRouter(prefix="/v1/notifications", tags=["notifications"])


@router.get("", response_model=Envelope[list[NotificationPublic]])
async def list_notifications(
    user: CurrentUser, db: AsyncSession = Depends(get_db), limit: int = 30
):
    rows = (
        await db.execute(
            select(Notification)
            .where(Notification.user_id == user.id)
            .order_by(desc(Notification.created_at))
            .limit(min(limit, 100))
        )
    ).scalars().all()
    return Envelope(data=[NotificationPublic.model_validate(n) for n in rows])


@router.get("/unread-count", response_model=Envelope[NotificationUnreadCount])
async def unread_count(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    count = (
        await db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
    ).scalar() or 0
    return Envelope(data=NotificationUnreadCount(unread=int(count)))


@router.post("/{notification_id}/read", response_model=Envelope[NotificationPublic])
async def mark_read(
    notification_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    n = (
        await db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if not n:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "notification not found")
    if n.read_at is None:
        n.read_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(n)
    return Envelope(data=NotificationPublic.model_validate(n))


@router.post("/read-all", response_model=Envelope[dict])
async def mark_all_read(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Notification).where(
                Notification.user_id == user.id, Notification.read_at.is_(None)
            )
        )
    ).scalars().all()
    now = datetime.now(timezone.utc)
    for n in rows:
        n.read_at = now
    if rows:
        await db.commit()
    return Envelope(data={"marked": len(rows)})


# Helper for other routers to fire notifications.
async def notify(
    db: AsyncSession,
    user_id: str,
    kind: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> None:
    db.add(Notification(user_id=user_id, kind=kind, title=title, body=body, link=link))
    # caller commits
