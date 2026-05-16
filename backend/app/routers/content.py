from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..db import get_db
from ..deps import CurrentUser
from ..models import Episode, Series, WatchProgress
from ..schemas import (
    ContinueWatchingItem,
    Envelope,
    EpisodePublic,
    SeriesPublic,
    WatchProgressPublic,
    WatchProgressUpdate,
)

router = APIRouter(prefix="/v1/content", tags=["content"])


@router.get("/series", response_model=Envelope[list[SeriesPublic]])
async def list_series(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Series)
            .options(selectinload(Series.episodes))
            .where(Series.published == True)  # noqa: E712
            .order_by(Series.created_at.desc())
        )
    ).scalars().all()
    return Envelope(data=[SeriesPublic.model_validate(s) for s in rows])


@router.get("/series/{slug}", response_model=Envelope[SeriesPublic])
async def get_series(slug: str, db: AsyncSession = Depends(get_db)):
    s = (
        await db.execute(
            select(Series)
            .options(selectinload(Series.episodes))
            .where(Series.slug == slug, Series.published == True)  # noqa: E712
        )
    ).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "series not found")
    return Envelope(data=SeriesPublic.model_validate(s))


@router.get("/episodes/{episode_id}", response_model=Envelope[EpisodePublic])
async def get_episode(episode_id: str, _user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ep = (await db.execute(select(Episode).where(Episode.id == episode_id))).scalar_one_or_none()
    if not ep or not ep.published:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    return Envelope(data=EpisodePublic.model_validate(ep))


@router.get("/progress/{episode_id}", response_model=Envelope[WatchProgressPublic | None])
async def get_progress(episode_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    wp = (
        await db.execute(
            select(WatchProgress).where(
                WatchProgress.user_id == user.id, WatchProgress.episode_id == episode_id
            )
        )
    ).scalar_one_or_none()
    if not wp:
        return Envelope(data=None)
    return Envelope(data=WatchProgressPublic.model_validate(wp))


@router.post("/progress", response_model=Envelope[WatchProgressPublic])
async def upsert_progress(
    payload: WatchProgressUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    ep = (await db.execute(select(Episode).where(Episode.id == payload.episode_id))).scalar_one_or_none()
    if not ep:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    wp = (
        await db.execute(
            select(WatchProgress).where(
                WatchProgress.user_id == user.id, WatchProgress.episode_id == payload.episode_id
            )
        )
    ).scalar_one_or_none()
    if wp is None:
        wp = WatchProgress(
            user_id=user.id,
            episode_id=payload.episode_id,
            position_seconds=max(0, payload.position_seconds),
            completed=payload.completed,
        )
        db.add(wp)
    else:
        wp.position_seconds = max(0, payload.position_seconds)
        wp.completed = payload.completed or wp.completed
    await db.commit()
    await db.refresh(wp)
    return Envelope(data=WatchProgressPublic.model_validate(wp))


@router.get("/continue-watching", response_model=Envelope[list[ContinueWatchingItem]])
async def continue_watching(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(WatchProgress, Episode, Series)
            .join(Episode, Episode.id == WatchProgress.episode_id)
            .join(Series, Series.id == Episode.series_id)
            .where(
                WatchProgress.user_id == user.id,
                WatchProgress.completed == False,  # noqa: E712
                WatchProgress.position_seconds > 5,
            )
            .order_by(desc(WatchProgress.updated_at))
            .limit(12)
        )
    ).all()
    items = [
        ContinueWatchingItem(
            episode=EpisodePublic.model_validate(ep),
            series_title=s.title,
            series_slug=s.slug,
            series_cover_url=s.cover_url,
            progress=WatchProgressPublic.model_validate(wp),
        )
        for wp, ep, s in rows
    ]
    return Envelope(data=items)
