from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import Conversation, Message
from ..schemas import Envelope, OnboardingPayload, UserPublic, UserUpdate
from ..services import hydrate_user

router = APIRouter(prefix="/v1/users", tags=["users"])


FOCUS_AREAS = {
    "stillness", "becoming", "emotion", "grief", "joy",
    "relationships", "work", "sleep", "creativity",
}


@router.get("/me", response_model=Envelope[UserPublic])
async def get_me(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    return Envelope(data=UserPublic.model_validate(await hydrate_user(db, user)))


@router.patch("/me", response_model=Envelope[UserPublic])
async def update_me(
    payload: UserUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    if "preferences" in data and data["preferences"] is not None:
        merged = dict(user.preferences or {})
        merged.update(data["preferences"])
        user.preferences = merged
        data.pop("preferences")
    for k, v in data.items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return Envelope(data=UserPublic.model_validate(await hydrate_user(db, user)))


def _welcome_message(intention: str | None, focus_areas: list[str], name: str | None) -> str:
    greeting = f"Hello{', ' + name if name else ''}."
    if intention:
        body = f"You said: \"{intention.strip()}\" — I'll hold that quietly as we begin."
    else:
        body = "You don't have to know why you're here. Showing up is enough."
    tail = ""
    if focus_areas:
        readable = ", ".join(focus_areas[:-1]) + (f" and {focus_areas[-1]}" if len(focus_areas) > 1 else focus_areas[0])
        tail = f" When you're ready, we'll move slowly through {readable}."
    return f"{greeting} {body}{tail}"


@router.post("/onboard", response_model=Envelope[UserPublic])
async def onboard(
    payload: OnboardingPayload,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    prefs = dict(user.preferences or {})
    prefs["onboarded"] = True
    prefs["onboarded_at"] = datetime.now(timezone.utc).isoformat()

    if not payload.skipped:
        if payload.full_name:
            user.full_name = payload.full_name.strip() or user.full_name
        if payload.reason:
            prefs["reason"] = payload.reason.strip()
        if payload.intention:
            prefs["intention"] = payload.intention.strip()
        cleaned = [a for a in (payload.focus_areas or []) if a in FOCUS_AREAS][:4]
        if cleaned:
            prefs["focus_areas"] = cleaned

        conv = Conversation(user_id=user.id, title="A first hello")
        db.add(conv)
        await db.flush()
        db.add(
            Message(
                conversation_id=conv.id,
                role="assistant",
                content=_welcome_message(
                    prefs.get("intention"),
                    prefs.get("focus_areas", []),
                    (payload.full_name or user.full_name or "").split(" ")[0] or None,
                ),
            )
        )

    user.preferences = prefs
    await db.commit()
    await db.refresh(user)
    return Envelope(data=UserPublic.model_validate(await hydrate_user(db, user)))
