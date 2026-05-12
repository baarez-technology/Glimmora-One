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
async def list_series(db: AsyncSession = Depends(get_db), category: str | None = None):
    stmt = (
        select(Series)
        .options(selectinload(Series.episodes))
        .where(Series.published == True)  # noqa: E712
        .order_by(Series.created_at.desc())
    )
    if category:
        stmt = stmt.where(Series.category == category)
    rows = (await db.execute(stmt)).scalars().all()
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
async def get_episode(episode_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    ep = (await db.execute(select(Episode).where(Episode.id == episode_id))).scalar_one_or_none()
    if not ep or not ep.published:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    if ep.tier == "premium" and user.subscription_tier != "premium" and user.role not in ("admin", "superadmin"):
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "premium subscription required")
    return Envelope(data=EpisodePublic.model_validate(ep))


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


@router.get("/recommendations", response_model=Envelope[list[EpisodePublic]])
async def recommendations(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    # Lightweight content-based recommender: pull recent episodes from series whose
    # tags overlap the user's most-watched series tags. Fallback: latest 6.
    watched = (
        await db.execute(
            select(Series.tags)
            .join(Episode, Episode.series_id == Series.id)
            .join(WatchProgress, WatchProgress.episode_id == Episode.id)
            .where(WatchProgress.user_id == user.id)
        )
    ).all()
    affinity: dict[str, int] = {}
    for (tags,) in watched:
        for t in tags or []:
            affinity[t] = affinity.get(t, 0) + 1
    if affinity:
        ranked_tags = sorted(affinity, key=affinity.get, reverse=True)[:5]
        rows = (
            await db.execute(
                select(Episode, Series)
                .join(Series, Series.id == Episode.series_id)
                .where(Episode.published == True, Series.published == True)  # noqa: E712
                .order_by(Episode.created_at.desc())
                .limit(40)
            )
        ).all()
        scored = []
        for ep, s in rows:
            score = sum(1 for t in (s.tags or []) if t in ranked_tags)
            if score:
                scored.append((score, ep))
        scored.sort(key=lambda x: x[0], reverse=True)
        if scored:
            return Envelope(data=[EpisodePublic.model_validate(e) for _, e in scored[:8]])

    fallback = (
        await db.execute(
            select(Episode)
            .where(Episode.published == True)  # noqa: E712
            .order_by(Episode.created_at.desc())
            .limit(8)
        )
    ).scalars().all()
    return Envelope(data=[EpisodePublic.model_validate(e) for e in fallback])
