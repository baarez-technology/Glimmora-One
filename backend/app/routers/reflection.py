from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..ai.companion import synthesize_reflection_insight
from ..db import get_db
from ..deps import CurrentUser
from ..models import Reflection
from ..schemas import (
    DigitalTwinSnapshot,
    EmotionTrendPoint,
    Envelope,
    ReflectionCreate,
    ReflectionPublic,
)

router = APIRouter(prefix="/v1/reflection", tags=["reflection"])


@router.post("", response_model=Envelope[ReflectionPublic])
async def create_reflection(
    payload: ReflectionCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    r = Reflection(
        user_id=user.id,
        content=payload.content,
        prompt=payload.prompt,
        mood=payload.mood,
        intensity=payload.intensity,
        tags=payload.tags,
        episode_id=payload.episode_id,
    )
    r.insights = await synthesize_reflection_insight(payload.content, payload.mood)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return Envelope(data=ReflectionPublic.model_validate(r))


@router.get("", response_model=Envelope[list[ReflectionPublic]])
async def list_reflections(
    user: CurrentUser, db: AsyncSession = Depends(get_db), limit: int = 50
):
    rows = (
        await db.execute(
            select(Reflection)
            .where(Reflection.user_id == user.id)
            .order_by(desc(Reflection.created_at))
            .limit(min(limit, 200))
        )
    ).scalars().all()
    return Envelope(data=[ReflectionPublic.model_validate(r) for r in rows])


@router.get("/insights/twin", response_model=Envelope[DigitalTwinSnapshot])
async def digital_twin(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(Reflection)
            .where(Reflection.user_id == user.id)
            .order_by(desc(Reflection.created_at))
            .limit(500)
        )
    ).scalars().all()

    total = len(rows)
    mood_counter = Counter(r.mood for r in rows if r.mood)
    dominant = mood_counter.most_common(1)[0][0] if mood_counter else None
    avg_intensity = round(sum(r.intensity for r in rows) / total, 2) if total else 0.0

    days_with = {r.created_at.date() for r in rows}
    streak = 0
    cursor = datetime.now(timezone.utc).date()
    while cursor in days_with:
        streak += 1
        cursor = cursor - timedelta(days=1)

    today = datetime.now(timezone.utc).date()
    by_day: dict[str, list[Reflection]] = defaultdict(list)
    for r in rows:
        d = r.created_at.date()
        if (today - d).days <= 30:
            by_day[d.isoformat()].append(r)
    trend: list[EmotionTrendPoint] = []
    for i in range(30, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        bucket = by_day.get(d, [])
        if bucket:
            mood = Counter([b.mood for b in bucket if b.mood]).most_common(1)
            trend.append(
                EmotionTrendPoint(
                    date=d,
                    mood=mood[0][0] if mood else None,
                    intensity=round(sum(b.intensity for b in bucket) / len(bucket), 2),
                    count=len(bucket),
                )
            )
        else:
            trend.append(EmotionTrendPoint(date=d, mood=None, intensity=0.0, count=0))

    milestones: list[str] = []
    if total >= 1:
        milestones.append("First reflection logged")
    if total >= 7:
        milestones.append("A week of noticing")
    if total >= 30:
        milestones.append("Thirty entries in")
    if streak >= 3:
        milestones.append(f"{streak}-day streak — gently held")
    if dominant:
        milestones.append(f"Most-present feeling: {dominant}")

    snap = DigitalTwinSnapshot(
        total_reflections=total,
        streak_days=streak,
        dominant_mood=dominant,
        average_intensity=avg_intensity,
        last_30_days=trend,
        growth_milestones=milestones,
        tag_cloud=[],
    )
    return Envelope(data=snap)
