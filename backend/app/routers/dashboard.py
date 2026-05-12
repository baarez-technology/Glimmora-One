from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import Conversation, Message, Reflection, WatchProgress
from ..schemas import DailyPlan, DailyStep, Envelope

router = APIRouter(prefix="/v1/dashboard", tags=["dashboard"])


@router.get("/today", response_model=Envelope[DailyPlan])
async def today(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    today_date = datetime.now(timezone.utc).date()

    # Step 1: any user message in any conversation today.
    msg_today = (
        await db.execute(
            select(Message)
            .join(Conversation, Conversation.id == Message.conversation_id)
            .where(
                Conversation.user_id == user.id,
                Message.role == "user",
                Message.created_at >= datetime.combine(today_date, datetime.min.time(), tzinfo=timezone.utc),
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    arrived = msg_today is not None

    # Step 2: any watch progress today with > 60s watched OR completed.
    watch_today = (
        await db.execute(
            select(WatchProgress).where(
                WatchProgress.user_id == user.id,
                WatchProgress.updated_at >= datetime.combine(today_date, datetime.min.time(), tzinfo=timezone.utc),
            )
        )
    ).scalars().all()
    noticed = any(w.completed or w.position_seconds > 60 for w in watch_today)

    # Step 3: any reflection created today.
    reflection_today = (
        await db.execute(
            select(Reflection).where(
                Reflection.user_id == user.id,
                Reflection.created_at >= datetime.combine(today_date, datetime.min.time(), tzinfo=timezone.utc),
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    reflected = reflection_today is not None

    # Streak computed from all-time reflections (matches digital twin logic).
    all_dates_q = (
        await db.execute(
            select(Reflection.created_at).where(Reflection.user_id == user.id).order_by(Reflection.created_at.desc())
        )
    ).scalars().all()
    from datetime import timedelta
    days_with = {d.date() for d in all_dates_q}
    streak = 0
    cursor = today_date
    while cursor in days_with:
        streak += 1
        cursor = cursor - timedelta(days=1)

    prefs = user.preferences or {}
    steps = [
        DailyStep(
            key="arrive",
            title="Arrive",
            description="A ninety-second hello with the companion.",
            done=arrived,
            href="/companion",
            cta="Open companion",
        ),
        DailyStep(
            key="notice",
            title="Notice",
            description="One short episode, paced for today.",
            done=noticed,
            href="/watch",
            cta="Choose a story",
        ),
        DailyStep(
            key="reflect",
            title="Reflect",
            description="A sentence in the journal. Anything true.",
            done=reflected,
            href="/reflect/new",
            cta="Write something small",
        ),
    ]
    return Envelope(
        data=DailyPlan(
            date=today_date.isoformat(),
            intention=prefs.get("intention"),
            focus_areas=list(prefs.get("focus_areas") or []),
            steps=steps,
            streak=streak,
            all_done=all(s.done for s in steps),
        )
    )
