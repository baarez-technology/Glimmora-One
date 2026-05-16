from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import (
    AuditLog,
    CirclePost,
    Conversation,
    Message,
    Reflection,
    User,
    WatchProgress,
)
from ..schemas import (
    AccountDeletePayload,
    DataExport,
    Envelope,
    OnboardingPayload,
    PasswordChangeRequest,
    UserPublic,
    UserUpdate,
)
from ..security import hash_password, verify_password

router = APIRouter(prefix="/v1/users", tags=["users"])


FOCUS_AREAS = {
    "stillness", "becoming", "emotion", "grief", "joy",
    "relationships", "work", "sleep", "creativity",
}


@router.get("/me", response_model=Envelope[UserPublic])
async def get_me(user: CurrentUser):
    return Envelope(data=UserPublic.model_validate(user))


@router.patch("/me", response_model=Envelope[UserPublic])
async def update_me(
    payload: UserUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    if "preferences" in data and data["preferences"] is not None:
        # merge rather than replace
        merged = dict(user.preferences or {})
        merged.update(data["preferences"])
        user.preferences = merged
        data.pop("preferences")
    for k, v in data.items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return Envelope(data=UserPublic.model_validate(user))


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

        # Seed a welcome conversation so the companion has a starting point.
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
    return Envelope(data=UserPublic.model_validate(user))


@router.post("/me/password", response_model=Envelope[dict])
async def change_password(
    payload: PasswordChangeRequest,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.add(AuditLog(actor_id=user.id, action="password_changed", target=user.id))
    await db.commit()
    return Envelope(data={"changed": True})


@router.get("/me/export", response_model=Envelope[DataExport])
async def export_my_data(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    reflections = (
        await db.execute(select(Reflection).where(Reflection.user_id == user.id))
    ).scalars().all()
    convs = (
        await db.execute(select(Conversation).where(Conversation.user_id == user.id))
    ).scalars().all()
    msgs_by_conv: dict[str, list[Message]] = {}
    for c in convs:
        rows = (
            await db.execute(select(Message).where(Message.conversation_id == c.id).order_by(Message.created_at))
        ).scalars().all()
        msgs_by_conv[c.id] = list(rows)
    watch = (
        await db.execute(select(WatchProgress).where(WatchProgress.user_id == user.id))
    ).scalars().all()
    posts = (
        await db.execute(select(CirclePost).where(CirclePost.user_id == user.id))
    ).scalars().all()
    return Envelope(
        data=DataExport(
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "fullName": user.full_name,
                "role": user.role,
                "subscriptionTier": user.subscription_tier,
                "preferences": user.preferences,
                "createdAt": user.created_at.isoformat(),
            },
            reflections=[
                {
                    "id": r.id,
                    "content": r.content,
                    "prompt": r.prompt,
                    "mood": r.mood,
                    "intensity": r.intensity,
                    "tags": r.tags,
                    "createdAt": r.created_at.isoformat(),
                }
                for r in reflections
            ],
            conversations=[
                {
                    "id": c.id,
                    "title": c.title,
                    "createdAt": c.created_at.isoformat(),
                    "messages": [
                        {"role": m.role, "content": m.content, "createdAt": m.created_at.isoformat()}
                        for m in msgs_by_conv.get(c.id, [])
                    ],
                }
                for c in convs
            ],
            watch_progress=[
                {
                    "episodeId": w.episode_id,
                    "positionSeconds": w.position_seconds,
                    "completed": w.completed,
                    "updatedAt": w.updated_at.isoformat(),
                }
                for w in watch
            ],
            posts=[
                {
                    "id": p.id,
                    "circleId": p.circle_id,
                    "body": p.body,
                    "createdAt": p.created_at.isoformat(),
                }
                for p in posts
            ],
            exported_at=datetime.now(timezone.utc),
        )
    )


@router.delete("/me", response_model=Envelope[dict])
async def delete_my_account(
    payload: AccountDeletePayload,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    if payload.confirm_username != user.username:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "username confirmation does not match")
    if user.role == "superadmin":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "superadmin cannot self-delete")
    target = (await db.execute(select(User).where(User.id == user.id))).scalar_one()
    db.add(AuditLog(actor_id=user.id, action="account_self_deleted", target=user.id))
    await db.delete(target)
    await db.commit()
    return Envelope(data={"deleted": True})
