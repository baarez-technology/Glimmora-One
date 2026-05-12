"""Seed initial data on first boot."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .models import Circle, Episode, Series, User
from .security import hash_password

settings = get_settings()


# ---- Seed catalog used in dev so the OTT surface isn't empty ----

DEMO_SERIES: list[dict] = [
    {
        "slug": "still-mind",
        "title": "Still Mind",
        "tagline": "Twelve invitations to inner quiet.",
        "description": "A gentle, twelve-part journey through the practices and reflections that cultivate stillness in a noisy life.",
        "category": "meditation",
        "cover_url": "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?auto=format&fit=crop&w=1200&q=80",
        "hero_url": "https://images.unsplash.com/photo-1499002238440-d264edd596ec?auto=format&fit=crop&w=1800&q=80",
        "accent_color": "#c89b6c",
        "tags": ["meditation", "stillness", "awareness"],
        "episodes": [
            {
                "slug": "the-room-behind-the-noise",
                "title": "The room behind the noise",
                "synopsis": "What we are looking for when we say we want quiet.",
                "duration_seconds": 612,
                "reflection_prompt": "Where in your body do you feel quiet today, even faintly?",
            },
            {
                "slug": "breath-as-a-doorway",
                "title": "Breath as a doorway",
                "synopsis": "Three minutes of arriving — taught slowly.",
                "duration_seconds": 540,
                "reflection_prompt": "What did you notice that you usually rush past?",
            },
            {
                "slug": "the-restless-thought",
                "title": "The restless thought",
                "synopsis": "How to be with the mind that won't settle.",
                "duration_seconds": 720,
                "reflection_prompt": "Name a recurring thought without judging it.",
            },
        ],
    },
    {
        "slug": "becoming-without-pressure",
        "title": "Becoming without pressure",
        "tagline": "Growth that doesn't ask you to abandon yourself.",
        "description": "An eight-part series on personal change that respects the pace of an actual human life.",
        "category": "growth",
        "cover_url": "https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?auto=format&fit=crop&w=1200&q=80",
        "hero_url": "https://images.unsplash.com/photo-1490604001847-b712b0c2f967?auto=format&fit=crop&w=1800&q=80",
        "accent_color": "#a78b6b",
        "tags": ["growth", "self-compassion", "identity"],
        "episodes": [
            {
                "slug": "the-myth-of-the-better-version",
                "title": "The myth of the better version",
                "synopsis": "Why self-improvement so often feels like self-rejection.",
                "duration_seconds": 660,
                "reflection_prompt": "What part of you are you currently trying to outgrow?",
            },
            {
                "slug": "small-faithful-acts",
                "title": "Small faithful acts",
                "synopsis": "On the kind of practice that actually compounds.",
                "duration_seconds": 580,
                "reflection_prompt": "What is one small thing you'd be glad to repeat tomorrow?",
            },
        ],
    },
    {
        "slug": "feeling-the-shape-of-feeling",
        "title": "Feeling the shape of feeling",
        "tagline": "An education in the language of emotion.",
        "description": "A field guide to your inner weather — sadness, anger, fear, longing, joy — taught with patience.",
        "category": "emotional-intelligence",
        "cover_url": "https://images.unsplash.com/photo-1516655855035-d5215bcb5604?auto=format&fit=crop&w=1200&q=80",
        "hero_url": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1800&q=80",
        "accent_color": "#b9805a",
        "tier": "premium",
        "tags": ["emotion", "self-awareness", "premium"],
        "episodes": [
            {
                "slug": "the-vocabulary-of-grief",
                "title": "The vocabulary of grief",
                "synopsis": "Distinguishing sadness, sorrow, mourning, and ache.",
                "duration_seconds": 840,
                "reflection_prompt": "Which of these words fits something you've been carrying?",
                "tier": "premium",
            },
        ],
    },
]


# Sample HLS streams — public test feeds. Replace once you host your own.
DEMO_HLS_POOL = [
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    "https://test-streams.mux.dev/test_001/stream.m3u8",
    "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
]


DEMO_CIRCLES = [
    {"slug": "the-quiet-circle", "name": "The Quiet Circle", "theme": "stillness",
     "description": "For sharing what has been hard to say out loud."},
    {"slug": "becoming", "name": "Becoming", "theme": "growth",
     "description": "Notes from the long, slow work of changing."},
    {"slug": "first-light", "name": "First Light", "theme": "morning-practice",
     "description": "Tiny reflections from the first hour of the day."},
]


async def ensure_superadmin(db: AsyncSession) -> None:
    existing = (
        await db.execute(select(User).where(User.username == settings.bootstrap_superadmin_username))
    ).scalar_one_or_none()
    if existing is None:
        db.add(
            User(
                username=settings.bootstrap_superadmin_username,
                email=settings.bootstrap_superadmin_email,
                full_name="Glimmora Admin",
                password_hash=hash_password(settings.bootstrap_superadmin_password),
                role="superadmin",
                subscription_tier="premium",
            )
        )
        await db.commit()


async def ensure_demo_catalog(db: AsyncSession) -> None:
    has_any = (await db.execute(select(Series).limit(1))).scalar_one_or_none()
    if has_any is not None:
        return

    for i, payload in enumerate(DEMO_SERIES):
        series = Series(
            slug=payload["slug"],
            title=payload["title"],
            tagline=payload.get("tagline"),
            description=payload.get("description"),
            category=payload.get("category", "wisdom"),
            cover_url=payload.get("cover_url"),
            hero_url=payload.get("hero_url"),
            accent_color=payload.get("accent_color"),
            tier=payload.get("tier", "free"),
            tags=payload.get("tags", []),
        )
        db.add(series)
        await db.flush()
        for j, ep in enumerate(payload["episodes"]):
            db.add(
                Episode(
                    series_id=series.id,
                    title=ep["title"],
                    slug=ep["slug"],
                    synopsis=ep.get("synopsis"),
                    duration_seconds=ep.get("duration_seconds", 0),
                    order_index=j,
                    video_url=DEMO_HLS_POOL[(i + j) % len(DEMO_HLS_POOL)],
                    poster_url=payload.get("cover_url"),
                    reflection_prompt=ep.get("reflection_prompt"),
                    tier=ep.get("tier", payload.get("tier", "free")),
                )
            )

    for c in DEMO_CIRCLES:
        db.add(Circle(slug=c["slug"], name=c["name"], theme=c["theme"], description=c["description"]))

    await db.commit()
