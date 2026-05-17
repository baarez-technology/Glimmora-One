"""Creator application flow.

Public POST creates a brand-new customer account AND a pending application.
The applicant is logged in (token in response). Moderators (and superadmins)
list, view, and decide on applications.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import CreatorApplication, User
from ..schemas import (
    CreatorApplicationCreate,
    CreatorApplicationPublic,
    CreatorDecisionPayload,
    Envelope,
    TokenResponse,
)
from ..security import create_access_token, hash_password
from .notifications import notify

router = APIRouter(prefix="/v1", tags=["creator-applications"])


async def _ensure_moderator(user: User):
    if user.role not in ("moderator", "superadmin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "moderator role required")


def _to_public(a: CreatorApplication, username: str) -> CreatorApplicationPublic:
    return CreatorApplicationPublic(
        id=a.id,
        user_id=a.user_id,
        username=username,
        full_name=a.full_name,
        email=a.email,
        pitch=a.pitch,
        links=a.links or [],
        attachments=a.attachments or [],
        status=a.status,
        decided_by=a.decided_by,
        decided_at=a.decided_at,
        decision_note=a.decision_note,
        created_at=a.created_at,
    )


# -------- Public application + auth --------

@router.post("/creator-applications", response_model=Envelope[TokenResponse])
async def submit_application(
    payload: CreatorApplicationCreate, db: AsyncSession = Depends(get_db)
):
    # Reject if username/email taken
    clash = (
        await db.execute(
            select(User).where(
                (User.username == payload.username) | (User.email == payload.email)
            )
        )
    ).scalar_one_or_none()
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "username or email already in use")

    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        # Flip to creator immediately, but gate them behind is_creator_approved=False
        # until a moderator approves. They land on /under-review with the creator
        # sidebar/role visible; on approve the gate releases.
        role="creator",
        is_creator_approved=False,
        subscription_tier="standard",
    )
    db.add(user)
    await db.flush()

    app_row = CreatorApplication(
        user_id=user.id,
        full_name=payload.full_name,
        email=payload.email,
        pitch=payload.pitch,
        links=payload.links or [],
        attachments=payload.attachments or [],
    )
    db.add(app_row)

    # Notify moderators + superadmins
    mods = (
        await db.execute(
            select(User).where(User.role.in_(("moderator", "superadmin")))
        )
    ).scalars().all()
    for m in mods:
        await notify(
            db,
            user_id=m.id,
            kind="application_submitted",
            title=f"New creator application: {payload.full_name}",
            body=(payload.pitch or "")[:200],
            link="/moderate/applications",
        )

    await db.commit()

    token, expires_in = create_access_token(user.id, {"role": user.role})
    return Envelope(data=TokenResponse(access_token=token, expires_in=expires_in))


# -------- Current user --------

@router.get("/creator-applications/me", response_model=Envelope[CreatorApplicationPublic | None])
async def my_application(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    a = (
        await db.execute(
            select(CreatorApplication)
            .where(CreatorApplication.user_id == user.id)
            .order_by(desc(CreatorApplication.created_at))
            .limit(1)
        )
    ).scalar_one_or_none()
    if not a:
        return Envelope(data=None)
    return Envelope(data=_to_public(a, user.username))


# -------- Moderator surface --------

@router.get("/moderate/applications", response_model=Envelope[list[CreatorApplicationPublic]])
async def list_applications(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = None,
):
    await _ensure_moderator(user)
    stmt = (
        select(CreatorApplication, User)
        .join(User, User.id == CreatorApplication.user_id)
        .order_by(desc(CreatorApplication.created_at))
        .limit(200)
    )
    if status_filter in ("pending", "approved", "rejected"):
        stmt = stmt.where(CreatorApplication.status == status_filter)
    rows = (await db.execute(stmt)).all()
    return Envelope(data=[_to_public(a, u.username) for a, u in rows])


@router.get(
    "/moderate/applications/{app_id}", response_model=Envelope[CreatorApplicationPublic]
)
async def get_application(
    app_id: str, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    await _ensure_moderator(user)
    row = (
        await db.execute(
            select(CreatorApplication, User)
            .join(User, User.id == CreatorApplication.user_id)
            .where(CreatorApplication.id == app_id)
        )
    ).first()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "application not found")
    a, u = row
    return Envelope(data=_to_public(a, u.username))


@router.post(
    "/moderate/applications/{app_id}/decide",
    response_model=Envelope[CreatorApplicationPublic],
)
async def decide_application(
    app_id: str,
    payload: CreatorDecisionPayload,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    await _ensure_moderator(user)
    if payload.decision not in ("approve", "reject"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "decision must be approve|reject")

    a = (
        await db.execute(select(CreatorApplication).where(CreatorApplication.id == app_id))
    ).scalar_one_or_none()
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "application not found")
    if a.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "already decided")

    a.status = "approved" if payload.decision == "approve" else "rejected"
    a.decided_by = user.id
    a.decided_at = datetime.now(timezone.utc)
    a.decision_note = payload.note

    applicant = (
        await db.execute(select(User).where(User.id == a.user_id))
    ).scalar_one_or_none()
    if applicant:
        if a.status == "approved":
            applicant.role = "creator"
            applicant.is_creator_approved = True
        else:
            # Reject → revert to customer and release the gate so they aren't stuck.
            applicant.role = "customer"
            applicant.is_creator_approved = True
        await notify(
            db,
            user_id=applicant.id,
            kind=f"application_{a.status}",
            title=(
                "Your creator application was approved 🎉"
                if a.status == "approved"
                else "Your creator application was not approved"
            ),
            body=payload.note,
            link="/dashboard" if a.status == "approved" else "/profile",
        )
    await db.commit()
    await db.refresh(a)

    return Envelope(data=_to_public(a, applicant.username if applicant else ""))
