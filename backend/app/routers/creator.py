from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import CreatorApplication, Episode, Series, User, WatchProgress
from ..schemas import (
    CreatorApplicationCreate,
    CreatorApplicationPublic,
    Envelope,
    EpisodeCreate,
    EpisodePublic,
    EpisodeUpdate,
    SeriesCreate,
    SeriesPublic,
    SeriesUpdate,
)

router = APIRouter(prefix="/v1/creator", tags=["creator"])


def _ensure_can_create(role: str) -> None:
    if role not in ("creator", "admin", "superadmin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "creator role required")


@router.post("/series", response_model=Envelope[SeriesPublic])
async def create_series(
    payload: SeriesCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_can_create(user.role)
    if (await db.execute(select(Series).where(Series.slug == payload.slug))).scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "slug already in use")
    from sqlalchemy.orm import selectinload as _si
    s = Series(**payload.model_dump(), creator_id=user.id)
    db.add(s)
    await db.commit()
    # Re-fetch with eager-loaded episodes so pydantic validation doesn't trigger
    # a lazy IO from inside model_validate.
    s = (
        await db.execute(
            select(Series).options(_si(Series.episodes)).where(Series.id == s.id)
        )
    ).scalar_one()
    return Envelope(data=SeriesPublic.model_validate(s))


@router.post("/episodes", response_model=Envelope[EpisodePublic])
async def create_episode(
    payload: EpisodeCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_can_create(user.role)
    s = (await db.execute(select(Series).where(Series.id == payload.series_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "series not found")
    if s.creator_id and s.creator_id != user.id and user.role not in ("admin", "superadmin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your series")
    ep = Episode(**payload.model_dump())
    db.add(ep)
    await db.commit()
    await db.refresh(ep)
    return Envelope(data=EpisodePublic.model_validate(ep))


def _owns_or_admin(series: Series, user: User) -> bool:
    return user.role in ("admin", "superadmin") or series.creator_id == user.id


@router.patch("/series/{series_id}", response_model=Envelope[SeriesPublic])
async def update_series(
    series_id: str,
    payload: SeriesUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm import selectinload as _si
    _ensure_can_create(user.role)
    s = (
        await db.execute(
            select(Series).options(_si(Series.episodes)).where(Series.id == series_id)
        )
    ).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "series not found")
    if not _owns_or_admin(s, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your series")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(s, k, v)
    await db.commit()
    s = (
        await db.execute(
            select(Series).options(_si(Series.episodes)).where(Series.id == s.id)
        )
    ).scalar_one()
    return Envelope(data=SeriesPublic.model_validate(s))


@router.delete("/series/{series_id}", response_model=Envelope[dict])
async def delete_series(
    series_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_can_create(user.role)
    s = (await db.execute(select(Series).where(Series.id == series_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "series not found")
    if not _owns_or_admin(s, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your series")
    await db.delete(s)
    await db.commit()
    return Envelope(data={"deleted": True})


@router.patch("/episodes/{episode_id}", response_model=Envelope[EpisodePublic])
async def update_episode(
    episode_id: str,
    payload: EpisodeUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    _ensure_can_create(user.role)
    ep = (await db.execute(select(Episode).where(Episode.id == episode_id))).scalar_one_or_none()
    if not ep:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    s = (await db.execute(select(Series).where(Series.id == ep.series_id))).scalar_one_or_none()
    if s and not _owns_or_admin(s, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your episode")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ep, k, v)
    await db.commit()
    await db.refresh(ep)
    return Envelope(data=EpisodePublic.model_validate(ep))


@router.delete("/episodes/{episode_id}", response_model=Envelope[dict])
async def delete_episode(
    episode_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_can_create(user.role)
    ep = (await db.execute(select(Episode).where(Episode.id == episode_id))).scalar_one_or_none()
    if not ep:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    s = (await db.execute(select(Series).where(Series.id == ep.series_id))).scalar_one_or_none()
    if s and not _owns_or_admin(s, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your episode")
    await db.delete(ep)
    await db.commit()
    return Envelope(data={"deleted": True})


@router.get("/series/{series_id}", response_model=Envelope[SeriesPublic])
async def get_my_series(
    series_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    _ensure_can_create(user.role)
    from sqlalchemy.orm import selectinload as _si
    s = (
        await db.execute(
            select(Series).options(_si(Series.episodes)).where(Series.id == series_id)
        )
    ).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "series not found")
    if not _owns_or_admin(s, user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your series")
    return Envelope(data=SeriesPublic.model_validate(s))


@router.get("/mine", response_model=Envelope[list[SeriesPublic]])
async def my_series(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _ensure_can_create(user.role)
    rows = (
        await db.execute(select(Series).where(Series.creator_id == user.id).order_by(Series.created_at.desc()))
    ).scalars().all()
    return Envelope(data=[SeriesPublic.model_validate(s) for s in rows])


@router.get("/analytics", response_model=Envelope[dict])
async def analytics(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    _ensure_can_create(user.role)
    series_count = (
        await db.execute(select(func.count(Series.id)).where(Series.creator_id == user.id))
    ).scalar() or 0
    episode_count = (
        await db.execute(
            select(func.count(Episode.id))
            .join(Series, Series.id == Episode.series_id)
            .where(Series.creator_id == user.id)
        )
    ).scalar() or 0
    watch_count = (
        await db.execute(
            select(func.count(WatchProgress.id))
            .join(Episode, Episode.id == WatchProgress.episode_id)
            .join(Series, Series.id == Episode.series_id)
            .where(Series.creator_id == user.id)
        )
    ).scalar() or 0
    completed = (
        await db.execute(
            select(func.count(WatchProgress.id))
            .join(Episode, Episode.id == WatchProgress.episode_id)
            .join(Series, Series.id == Episode.series_id)
            .where(Series.creator_id == user.id, WatchProgress.completed == True)  # noqa: E712
        )
    ).scalar() or 0
    return Envelope(
        data={
            "seriesCount": int(series_count),
            "episodeCount": int(episode_count),
            "totalWatchers": int(watch_count),
            "completions": int(completed),
        }
    )


# ---------------- Creator application flow ----------------

@router.post("/apply", response_model=Envelope[CreatorApplicationPublic])
async def apply_to_be_creator(
    payload: CreatorApplicationCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if user.role in ("creator", "admin", "superadmin"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "you can already publish")
    existing = (
        await db.execute(
            select(CreatorApplication).where(
                CreatorApplication.user_id == user.id,
                CreatorApplication.status == "pending",
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "you already have a pending application")

    app_row = CreatorApplication(
        user_id=user.id,
        pitch=payload.pitch.strip(),
        sample_url=payload.sample_url,
    )
    db.add(app_row)
    await db.commit()
    await db.refresh(app_row)
    return Envelope(
        data=CreatorApplicationPublic(
            id=app_row.id,
            user_id=app_row.user_id,
            username=user.username,
            pitch=app_row.pitch,
            sample_url=app_row.sample_url,
            status=app_row.status,
            decided_by=app_row.decided_by,
            decided_at=app_row.decided_at,
            created_at=app_row.created_at,
        )
    )


@router.get("/application/me", response_model=Envelope[CreatorApplicationPublic | None])
async def my_application(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    row = (
        await db.execute(
            select(CreatorApplication)
            .where(CreatorApplication.user_id == user.id)
            .order_by(CreatorApplication.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if not row:
        return Envelope(data=None)
    return Envelope(
        data=CreatorApplicationPublic(
            id=row.id,
            user_id=row.user_id,
            username=user.username,
            pitch=row.pitch,
            sample_url=row.sample_url,
            status=row.status,
            decided_by=row.decided_by,
            decided_at=row.decided_at,
            created_at=row.created_at,
        )
    )
