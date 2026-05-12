from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..schemas import Envelope

router = APIRouter(prefix="/v1/billing", tags=["billing"])


TIERS = [
    {
        "id": "free",
        "name": "Glimmora Free",
        "priceMonthly": 0,
        "currency": "USD",
        "features": [
            "AI companion (limited memory)",
            "Free series & episodes",
            "Personal reflection journal",
            "Three community circles",
        ],
    },
    {
        "id": "premium",
        "name": "Glimmora Premium",
        "priceMonthly": 12,
        "currency": "USD",
        "features": [
            "Full AI companion with long memory",
            "All premium series & journeys",
            "Digital twin insights",
            "All community circles",
            "Priority creator tools",
        ],
    },
]


@router.get("/tiers", response_model=Envelope[list[dict]])
async def list_tiers():
    return Envelope(data=TIERS)


@router.get("/me", response_model=Envelope[dict])
async def my_entitlements(user: CurrentUser):
    tier = next((t for t in TIERS if t["id"] == user.subscription_tier), TIERS[0])
    return Envelope(
        data={
            "tier": user.subscription_tier,
            "details": tier,
            "entitlements": {
                "premiumContent": user.subscription_tier == "premium",
                "longMemory": user.subscription_tier == "premium",
                "digitalTwinInsights": True,
                "allCircles": user.subscription_tier == "premium",
            },
        }
    )


@router.post("/upgrade", response_model=Envelope[dict])
async def upgrade(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    """Dev-only: flip the user to premium. Real billing webhooks plug in here."""
    user.subscription_tier = "premium"
    await db.commit()
    return Envelope(data={"tier": "premium"})


@router.post("/downgrade", response_model=Envelope[dict])
async def downgrade(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    user.subscription_tier = "free"
    await db.commit()
    return Envelope(data={"tier": "free"})
