import hashlib

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import Circle, CirclePost
from ..schemas import CirclePostCreate, CirclePostPublic, CirclePublic, Envelope

router = APIRouter(prefix="/v1/community", tags=["community"])


# Calm gentle anonymous handles for the circle, deterministic per (user, circle).
_ADJ = ["Quiet", "Soft", "Open", "Steady", "Warm", "Gentle", "Bright", "Still", "Slow", "Kind"]
_NOUN = ["River", "Lantern", "Field", "Sparrow", "Cloud", "Path", "Window", "Hearth", "Garden", "Tide"]


def anonymous_handle(user_id: str, circle_id: str) -> str:
    h = hashlib.sha256(f"{user_id}:{circle_id}".encode()).digest()
    a = _ADJ[h[0] % len(_ADJ)]
    n = _NOUN[h[1] % len(_NOUN)]
    return f"{a} {n}"


# Light-touch content guardrails — full moderation is a follow-up task.
_BLOCKED = ("kill yourself", "kys")


@router.get("/circles", response_model=Envelope[list[CirclePublic]])
async def list_circles(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Circle, func.count(CirclePost.id))
            .outerjoin(CirclePost, CirclePost.circle_id == Circle.id)
            .group_by(Circle.id)
            .order_by(Circle.name)
        )
    ).all()
    return Envelope(
        data=[
            CirclePublic(
                id=c.id,
                name=c.name,
                slug=c.slug,
                description=c.description,
                theme=c.theme,
                post_count=int(cnt or 0),
            )
            for c, cnt in rows
        ]
    )


@router.get("/circles/{slug}/posts", response_model=Envelope[list[CirclePostPublic]])
async def list_posts(slug: str, db: AsyncSession = Depends(get_db), limit: int = 30):
    circle = (await db.execute(select(Circle).where(Circle.slug == slug))).scalar_one_or_none()
    if not circle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "circle not found")
    rows = (
        await db.execute(
            select(CirclePost)
            .where(CirclePost.circle_id == circle.id, CirclePost.flagged == False)  # noqa: E712
            .order_by(CirclePost.created_at.desc())
            .limit(min(limit, 100))
        )
    ).scalars().all()
    return Envelope(data=[CirclePostPublic.model_validate(p) for p in rows])


@router.post("/circles/{slug}/posts", response_model=Envelope[CirclePostPublic])
async def create_post(
    slug: str,
    payload: CirclePostCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    circle = (await db.execute(select(Circle).where(Circle.slug == slug))).scalar_one_or_none()
    if not circle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "circle not found")

    body = payload.body.strip()
    if any(b in body.lower() for b in _BLOCKED):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "message blocked by safety filter")

    post = CirclePost(
        circle_id=circle.id,
        user_id=user.id,
        anonymous_handle=anonymous_handle(user.id, circle.id),
        body=body,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return Envelope(data=CirclePostPublic.model_validate(post))


@router.post("/posts/{post_id}/report", response_model=Envelope[dict])
async def report_post(post_id: str, _user: CurrentUser, db: AsyncSession = Depends(get_db)):
    post = (
        await db.execute(select(CirclePost).where(CirclePost.id == post_id))
    ).scalar_one_or_none()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "post not found")
    post.flagged = True
    await db.commit()
    return Envelope(data={"reported": True})
