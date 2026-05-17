"""Creator Studio — authoring CRUD + AI helpers.

Every endpoint here is scoped to the calling creator: they can only see and
mutate series where `Series.creator_id == me.id`. Superadmins have no
implicit access (this is a creator workspace, not an admin tool).

Drafts vs. published: a new series is created with `published=False` so the
customer-facing catalog never sees half-baked work. The creator flips the
toggle when ready. Same for episodes.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import get_settings
from ..db import get_db
from ..deps import CurrentUser
from ..models import Episode, Series, User
from ..schemas import (
    AIEpisodeFromTitleRequest,
    AIEpisodeFromTitleResponse,
    AIOutlineEpisode,
    AISeriesFromTitleRequest,
    AISeriesFromTitleResponse,
    AISeriesOutlineRequest,
    AISeriesOutlineResponse,
    Envelope,
    StudioEpisode,
    StudioEpisodeCreate,
    StudioEpisodeUpdate,
    StudioReorder,
    StudioSeries,
    StudioSeriesCreate,
    StudioSeriesRow,
    StudioSeriesUpdate,
)

router = APIRouter(prefix="/v1/studio", tags=["studio"])

settings = get_settings()


# ----------------- helpers -----------------

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(text: str) -> str:
    s = _SLUG_RE.sub("-", text.lower()).strip("-")
    return s[:80] or "untitled"


async def _ensure_creator(me: User) -> None:
    if me.role != "creator":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "creator role required")
    if not me.is_creator_approved:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "creator application pending")


async def _unique_series_slug(db: AsyncSession, base: str) -> str:
    slug = base
    i = 2
    while True:
        clash = (
            await db.execute(select(Series.id).where(Series.slug == slug).limit(1))
        ).scalar_one_or_none()
        if not clash:
            return slug
        slug = f"{base}-{i}"
        i += 1


async def _unique_episode_slug(db: AsyncSession, series_id: str, base: str) -> str:
    slug = base
    i = 2
    while True:
        clash = (
            await db.execute(
                select(Episode.id)
                .where(Episode.series_id == series_id, Episode.slug == slug)
                .limit(1)
            )
        ).scalar_one_or_none()
        if not clash:
            return slug
        slug = f"{base}-{i}"
        i += 1


async def _load_owned_series(db: AsyncSession, series_id: str, me: User) -> Series:
    s = (
        await db.execute(
            select(Series)
            .options(selectinload(Series.episodes))
            .where(Series.id == series_id)
        )
    ).scalar_one_or_none()
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "series not found")
    if s.creator_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your series")
    return s


# ----------------- Series CRUD -----------------


@router.get("/series", response_model=Envelope[list[StudioSeriesRow]])
async def list_my_series(me: CurrentUser, db: AsyncSession = Depends(get_db)):
    await _ensure_creator(me)
    rows = (
        await db.execute(
            select(Series, func.count(Episode.id))
            .outerjoin(Episode, Episode.series_id == Series.id)
            .where(Series.creator_id == me.id)
            .group_by(Series.id)
            .order_by(desc(Series.created_at))
        )
    ).all()
    return Envelope(
        data=[
            StudioSeriesRow(
                id=s.id,
                title=s.title,
                slug=s.slug,
                tagline=s.tagline,
                category=s.category,
                cover_url=s.cover_url,
                accent_color=s.accent_color,
                tier=s.tier,
                published=s.published,
                episode_count=int(count or 0),
                created_at=s.created_at,
            )
            for s, count in rows
        ]
    )


@router.post("/series", response_model=Envelope[StudioSeries])
async def create_series(
    payload: StudioSeriesCreate, me: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await _ensure_creator(me)
    slug = await _unique_series_slug(db, _slugify(payload.title))
    s = Series(
        creator_id=me.id,
        title=payload.title,
        slug=slug,
        tagline=payload.tagline,
        description=payload.description,
        category=payload.category,
        cover_url=payload.cover_url,
        hero_url=payload.hero_url,
        accent_color=payload.accent_color,
        tier=payload.tier,
        tags=payload.tags or [],
        published=False,  # draft by default
    )
    db.add(s)
    await db.commit()
    # Re-load with episodes eagerly so the response shape stays consistent.
    s = (
        await db.execute(
            select(Series).options(selectinload(Series.episodes)).where(Series.id == s.id)
        )
    ).scalar_one()
    return Envelope(data=_studio_series(s))


@router.get("/series/{series_id}", response_model=Envelope[StudioSeries])
async def get_my_series(
    series_id: str, me: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await _ensure_creator(me)
    s = await _load_owned_series(db, series_id, me)
    return Envelope(data=_studio_series(s))


@router.patch("/series/{series_id}", response_model=Envelope[StudioSeries])
async def update_my_series(
    series_id: str,
    payload: StudioSeriesUpdate,
    me: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_creator(me)
    s = await _load_owned_series(db, series_id, me)
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    # Title change does NOT regenerate slug — slugs are stable so existing
    # /watch/[slug] URLs and bookmarks keep working.
    for k, v in data.items():
        setattr(s, k, v)
    await db.commit()
    await db.refresh(s)
    s = (
        await db.execute(
            select(Series).options(selectinload(Series.episodes)).where(Series.id == s.id)
        )
    ).scalar_one()
    return Envelope(data=_studio_series(s))


@router.delete("/series/{series_id}", response_model=Envelope[dict])
async def delete_my_series(
    series_id: str, me: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await _ensure_creator(me)
    s = await _load_owned_series(db, series_id, me)
    await db.delete(s)
    await db.commit()
    return Envelope(data={"deleted": True})


# ----------------- Episode CRUD -----------------


@router.post("/series/{series_id}/episodes", response_model=Envelope[StudioEpisode])
async def create_episode(
    series_id: str,
    payload: StudioEpisodeCreate,
    me: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_creator(me)
    s = await _load_owned_series(db, series_id, me)
    slug = await _unique_episode_slug(db, s.id, _slugify(payload.title))
    # Append to the end of the series.
    next_order = (
        await db.execute(
            select(func.coalesce(func.max(Episode.order_index), -1) + 1).where(
                Episode.series_id == s.id
            )
        )
    ).scalar_one()
    ep = Episode(
        series_id=s.id,
        title=payload.title,
        slug=slug,
        synopsis=payload.synopsis,
        duration_seconds=payload.duration_seconds,
        order_index=int(next_order or 0),
        video_url=payload.video_url,
        poster_url=payload.poster_url or s.cover_url,
        reflection_prompt=payload.reflection_prompt,
        tier=payload.tier,
        published=False,
    )
    db.add(ep)
    await db.commit()
    await db.refresh(ep)
    return Envelope(data=_studio_episode(ep))


@router.patch("/episodes/{episode_id}", response_model=Envelope[StudioEpisode])
async def update_episode(
    episode_id: str,
    payload: StudioEpisodeUpdate,
    me: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_creator(me)
    ep = (
        await db.execute(select(Episode).where(Episode.id == episode_id))
    ).scalar_one_or_none()
    if not ep:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    # Verify ownership through parent.
    parent = (await db.execute(select(Series).where(Series.id == ep.series_id))).scalar_one()
    if parent.creator_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your episode")
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    for k, v in data.items():
        setattr(ep, k, v)
    await db.commit()
    await db.refresh(ep)
    return Envelope(data=_studio_episode(ep))


@router.delete("/episodes/{episode_id}", response_model=Envelope[dict])
async def delete_episode(
    episode_id: str, me: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await _ensure_creator(me)
    ep = (
        await db.execute(select(Episode).where(Episode.id == episode_id))
    ).scalar_one_or_none()
    if not ep:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "episode not found")
    parent = (await db.execute(select(Series).where(Series.id == ep.series_id))).scalar_one()
    if parent.creator_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your episode")
    await db.delete(ep)
    await db.commit()
    return Envelope(data={"deleted": True})


@router.post("/series/{series_id}/reorder", response_model=Envelope[dict])
async def reorder_episodes(
    series_id: str,
    payload: StudioReorder,
    me: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_creator(me)
    s = await _load_owned_series(db, series_id, me)
    existing = {ep.id: ep for ep in s.episodes}
    for i, eid in enumerate(payload.episode_ids):
        ep = existing.get(eid)
        if ep:
            ep.order_index = i
    await db.commit()
    return Envelope(data={"reordered": len(payload.episode_ids)})


# ----------------- shape helpers -----------------


def _studio_series(s: Series) -> StudioSeries:
    return StudioSeries(
        id=s.id,
        title=s.title,
        slug=s.slug,
        tagline=s.tagline,
        description=s.description,
        category=s.category,
        cover_url=s.cover_url,
        hero_url=s.hero_url,
        accent_color=s.accent_color,
        tier=s.tier,
        published=s.published,
        tags=s.tags or [],
        episodes=[_studio_episode(ep) for ep in sorted(s.episodes, key=lambda e: e.order_index)],
        created_at=s.created_at,
    )


def _studio_episode(ep: Episode) -> StudioEpisode:
    return StudioEpisode(
        id=ep.id,
        series_id=ep.series_id,
        title=ep.title,
        slug=ep.slug,
        synopsis=ep.synopsis,
        duration_seconds=ep.duration_seconds,
        order_index=ep.order_index,
        video_url=ep.video_url,
        poster_url=ep.poster_url,
        reflection_prompt=ep.reflection_prompt,
        tier=ep.tier,
        published=ep.published,
        created_at=ep.created_at,
    )


# ============================================================
# AI helpers
# ============================================================
#
# All three return strict JSON. If the OpenAI key is missing or parsing fails,
# we fall back to a deterministic stub so the UI never sees a hard error.

VOICE_RULES = """You are a writing assistant for Glimmora ONE — a calm, AI-powered space for inner work.

Voice rules (non-negotiable):
- Plain, warm, unhurried. Like a quiet friend, never a marketer.
- Short sentences. No exclamation points. No hype words ("transform", "unlock", "journey").
- Use lowercase categories. No emojis unless asked.
- Reflection prompts must be one open question (12-18 words), inviting honesty, not advice.
- Taglines: under 60 chars, no period, no marketing voice.
- Descriptions: 2-3 short sentences. Say what's actually inside.
"""

CATEGORIES = ["meditation", "growth", "emotional-intelligence", "wisdom", "relationships", "purpose"]
ACCENT_PALETTE = ["#c89b6c", "#a78b6b", "#b9805a", "#8b7355", "#d4a574", "#9c7b5e"]


def _series_fallback(title: str, hint: Optional[str]) -> AISeriesFromTitleResponse:
    return AISeriesFromTitleResponse(
        tagline=f"A quiet look at {title.lower()}",
        description=f"A short series about {title.lower()}. Each episode is small and unhurried.",
        category="wisdom",
        tags=[w.lower() for w in title.split()[:3] if len(w) > 3] or ["wisdom"],
        accent_color="#c89b6c",
    )


def _episode_fallback(title: str) -> AIEpisodeFromTitleResponse:
    return AIEpisodeFromTitleResponse(
        synopsis=f"A short reflection on {title.lower()}.",
        reflection_prompt=f"What does {title.lower()} mean for you, right now, in this season of your life?",
        tier="free",
    )


def _outline_fallback(title: str, n: int) -> AISeriesOutlineResponse:
    eps = [
        AIOutlineEpisode(title=f"Episode {i+1}: {title} — chapter {i+1}", synopsis=f"A short piece on {title.lower()}.")
        for i in range(n)
    ]
    return AISeriesOutlineResponse(description=f"A {n}-part series on {title.lower()}.", episodes=eps)


async def _json_completion(system: str, user: str) -> Optional[dict]:
    """Call OpenAI in strict-JSON mode. Returns dict or None on any failure."""
    if not settings.ai_enabled:
        return None
    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.7,
            max_tokens=600,
            response_format={"type": "json_object"},
        )
        raw = (resp.choices[0].message.content or "").strip()
        return json.loads(raw)
    except Exception as e:
        print(f"[studio.ai] OpenAI error: {type(e).__name__}: {e}")
        return None


@router.post(
    "/ai/series-from-title",
    response_model=Envelope[AISeriesFromTitleResponse],
)
async def ai_series_from_title(
    payload: AISeriesFromTitleRequest,
    me: CurrentUser,
):
    await _ensure_creator(me)
    system = (
        VOICE_RULES
        + "\nYou will draft a NEW series. Reply with strict JSON only, no prose, "
        + "with keys: tagline (string), description (string), category (one of: "
        + ", ".join(CATEGORIES)
        + "), tags (array of 3-5 lowercase strings), accent_color (one of: "
        + ", ".join(ACCENT_PALETTE)
        + ")."
    )
    user = f"Series title: {payload.title}"
    if payload.hint:
        user += f"\nHint about the series: {payload.hint}"
    data = await _json_completion(system, user)
    if not data:
        return Envelope(data=_series_fallback(payload.title, payload.hint))
    try:
        return Envelope(
            data=AISeriesFromTitleResponse(
                tagline=str(data.get("tagline") or "").strip()[:120]
                or _series_fallback(payload.title, payload.hint).tagline,
                description=str(data.get("description") or "").strip()
                or _series_fallback(payload.title, payload.hint).description,
                category=(str(data.get("category") or "wisdom").strip().lower()
                          if str(data.get("category") or "").strip().lower() in CATEGORIES else "wisdom"),
                tags=[str(t).strip().lower() for t in (data.get("tags") or [])][:5] or ["wisdom"],
                accent_color=(str(data.get("accent_color") or "#c89b6c").strip()
                              if str(data.get("accent_color") or "").strip() in ACCENT_PALETTE else "#c89b6c"),
            )
        )
    except Exception:
        return Envelope(data=_series_fallback(payload.title, payload.hint))


@router.post(
    "/ai/episode-from-title",
    response_model=Envelope[AIEpisodeFromTitleResponse],
)
async def ai_episode_from_title(
    payload: AIEpisodeFromTitleRequest,
    me: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_creator(me)
    # Pull parent series context so the episode stays on theme.
    s = await _load_owned_series(db, payload.series_id, me)
    system = (
        VOICE_RULES
        + "\nYou will draft a NEW episode inside an existing series. Reply with strict JSON "
        + "only, with keys: synopsis (string, 1-2 short sentences), reflection_prompt "
        + "(one open question, 12-18 words, no advice), tier (free | premium — free unless "
        + "the topic is unusually deep / premium-only)."
    )
    user = (
        f"Parent series: {s.title}\n"
        f"Series description: {s.description or '(none)'}\n"
        f"Series category: {s.category}\n"
        f"Episode title: {payload.title}"
    )
    if payload.duration_seconds:
        user += f"\nDuration: roughly {payload.duration_seconds // 60} minutes"
    data = await _json_completion(system, user)
    if not data:
        return Envelope(data=_episode_fallback(payload.title))
    try:
        return Envelope(
            data=AIEpisodeFromTitleResponse(
                synopsis=str(data.get("synopsis") or "").strip()
                or _episode_fallback(payload.title).synopsis,
                reflection_prompt=str(data.get("reflection_prompt") or "").strip()
                or _episode_fallback(payload.title).reflection_prompt,
                tier=("premium" if str(data.get("tier") or "").strip().lower() == "premium" else "free"),
            )
        )
    except Exception:
        return Envelope(data=_episode_fallback(payload.title))


@router.post(
    "/ai/series-outline",
    response_model=Envelope[AISeriesOutlineResponse],
)
async def ai_series_outline(
    payload: AISeriesOutlineRequest,
    me: CurrentUser,
):
    await _ensure_creator(me)
    system = (
        VOICE_RULES
        + f"\nYou will draft a {payload.episode_count}-episode outline for a NEW series. "
        + "Reply with strict JSON only, with keys: description (2-3 short sentences about the "
        + "whole series), episodes (array of exactly "
        + str(payload.episode_count)
        + " objects, each with: title (4-8 words, no episode number prefix), synopsis (one short sentence))."
    )
    user = f"Series title: {payload.title}"
    if payload.hint:
        user += f"\nHint: {payload.hint}"
    data = await _json_completion(system, user)
    if not data:
        return Envelope(data=_outline_fallback(payload.title, payload.episode_count))
    try:
        eps_raw = data.get("episodes") or []
        episodes = [
            AIOutlineEpisode(
                title=str(e.get("title") or "Untitled").strip()[:120],
                synopsis=str(e.get("synopsis") or "").strip(),
            )
            for e in eps_raw[: payload.episode_count]
            if isinstance(e, dict)
        ]
        if not episodes:
            return Envelope(data=_outline_fallback(payload.title, payload.episode_count))
        return Envelope(
            data=AISeriesOutlineResponse(
                description=str(data.get("description") or "").strip()
                or _outline_fallback(payload.title, payload.episode_count).description,
                episodes=episodes,
            )
        )
    except Exception:
        return Envelope(data=_outline_fallback(payload.title, payload.episode_count))
