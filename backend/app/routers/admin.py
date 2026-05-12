from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import (
    Circle,
    CirclePost,
    Conversation,
    CreatorApplication,
    Episode,
    Reflection,
    Series,
    User,
)
from ..schemas import AdminStats, AdminUserRow, CreatorApplicationPublic, Envelope

router = APIRouter(prefix="/v1/admin", tags=["admin"])


def _require_admin(user: User) -> None:
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "admin role required")


@router.get("/stats", response_model=Envelope[AdminStats])
async def stats(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _require_admin(user)
    return Envelope(
        data=AdminStats(
            users=int((await db.execute(select(func.count(User.id)))).scalar() or 0),
            series=int((await db.execute(select(func.count(Series.id)))).scalar() or 0),
            episodes=int((await db.execute(select(func.count(Episode.id)))).scalar() or 0),
            reflections=int((await db.execute(select(func.count(Reflection.id)))).scalar() or 0),
            conversations=int(
                (await db.execute(select(func.count(Conversation.id)))).scalar() or 0
            ),
            posts=int((await db.execute(select(func.count(CirclePost.id)))).scalar() or 0),
        )
    )


@router.get("/users", response_model=Envelope[list[AdminUserRow]])
async def list_users(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _require_admin(user)
    rows = (await db.execute(select(User).order_by(User.created_at.desc()).limit(500))).scalars().all()
    return Envelope(data=[AdminUserRow.model_validate(u) for u in rows])


@router.patch("/users/{user_id}/role", response_model=Envelope[AdminUserRow])
async def set_user_role(
    user_id: str,
    role: str,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _require_admin(user)
    if role not in ("member", "creator", "admin", "superadmin"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid role")
    if role == "superadmin" and user.role != "superadmin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "only superadmin can grant superadmin")
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    target.role = role
    await db.commit()
    await db.refresh(target)
    return Envelope(data=AdminUserRow.model_validate(target))


@router.patch("/users/{user_id}/active", response_model=Envelope[AdminUserRow])
async def set_user_active(
    user_id: str,
    active: bool,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _require_admin(user)
    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    target.is_active = active
    await db.commit()
    await db.refresh(target)
    return Envelope(data=AdminUserRow.model_validate(target))


@router.get("/flagged-posts", response_model=Envelope[list[dict]])
async def flagged_posts(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _require_admin(user)
    rows = (
        await db.execute(
            select(CirclePost, Circle)
            .join(Circle, Circle.id == CirclePost.circle_id)
            .where(CirclePost.flagged == True)  # noqa: E712
            .order_by(CirclePost.created_at.desc())
            .limit(200)
        )
    ).all()
    return Envelope(
        data=[
            {
                "id": p.id,
                "circle": c.name,
                "body": p.body,
                "createdAt": p.created_at.isoformat(),
            }
            for p, c in rows
        ]
    )


@router.get("/applications", response_model=Envelope[list[CreatorApplicationPublic]])
async def list_applications(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _require_admin(user)
    rows = (
        await db.execute(
            select(CreatorApplication, User)
            .join(User, User.id == CreatorApplication.user_id)
            .order_by(CreatorApplication.created_at.desc())
            .limit(200)
        )
    ).all()
    return Envelope(
        data=[
            CreatorApplicationPublic(
                id=a.id,
                user_id=a.user_id,
                username=u.username,
                pitch=a.pitch,
                sample_url=a.sample_url,
                status=a.status,
                decided_by=a.decided_by,
                decided_at=a.decided_at,
                created_at=a.created_at,
            )
            for a, u in rows
        ]
    )


@router.post("/applications/{app_id}/decide", response_model=Envelope[CreatorApplicationPublic])
async def decide_application(
    app_id: str,
    decision: str,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _require_admin(user)
    if decision not in ("approve", "deny"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "decision must be approve or deny")
    app_row = (
        await db.execute(select(CreatorApplication).where(CreatorApplication.id == app_id))
    ).scalar_one_or_none()
    if not app_row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "application not found")
    if app_row.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "already decided")
    app_row.status = "approved" if decision == "approve" else "denied"
    app_row.decided_by = user.id
    app_row.decided_at = datetime.now(timezone.utc)
    if decision == "approve":
        target = (
            await db.execute(select(User).where(User.id == app_row.user_id))
        ).scalar_one_or_none()
        if target and target.role == "member":
            target.role = "creator"
    await db.commit()
    await db.refresh(app_row)
    target_username = (
        await db.execute(select(User.username).where(User.id == app_row.user_id))
    ).scalar_one() or ""
    return Envelope(
        data=CreatorApplicationPublic(
            id=app_row.id,
            user_id=app_row.user_id,
            username=target_username,
            pitch=app_row.pitch,
            sample_url=app_row.sample_url,
            status=app_row.status,
            decided_by=app_row.decided_by,
            decided_at=app_row.decided_at,
            created_at=app_row.created_at,
        )
    )


@router.delete("/posts/{post_id}", response_model=Envelope[dict])
async def delete_post(post_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _require_admin(user)
    post = (
        await db.execute(select(CirclePost).where(CirclePost.id == post_id))
    ).scalar_one_or_none()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "post not found")
    await db.delete(post)
    await db.commit()
    return Envelope(data={"deleted": True})
