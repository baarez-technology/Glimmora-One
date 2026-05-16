import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_db
from ..deps import CurrentUser
from ..models import PasswordReset, User
from ..schemas import (
    Envelope,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetIssued,
    PasswordResetRequest,
    SignupRequest,
    TokenResponse,
    UserPublic,
)
from ..security import create_access_token, hash_password, verify_password

_settings = get_settings()


def _hash_token(t: str) -> str:
    return hashlib.sha256(t.encode("utf-8")).hexdigest()

router = APIRouter(prefix="/v1/auth", tags=["auth"])


@router.post("/login", response_model=Envelope[TokenResponse])
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Allow login by either username or email.
    stmt = select(User).where(
        (User.username == payload.username) | (User.email == payload.username)
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "account disabled")
    token, expires_in = create_access_token(user.id, {"role": user.role})
    return Envelope(data=TokenResponse(access_token=token, expires_in=expires_in))


@router.post("/signup", response_model=Envelope[TokenResponse])
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Email is optional; synthesize a placeholder so the unique-not-null column stays consistent.
    email = payload.email or f"{payload.username.lower()}@noemail.local"
    exists = (
        await db.execute(
            select(User).where(
                (User.username == payload.username) | (User.email == email)
            )
        )
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "username or email already in use")
    user = User(
        username=payload.username,
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role="member",
        subscription_tier="free",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token, expires_in = create_access_token(user.id, {"role": user.role})
    return Envelope(data=TokenResponse(access_token=token, expires_in=expires_in))


@router.get("/me", response_model=Envelope[UserPublic])
async def me(user: CurrentUser):
    return Envelope(data=UserPublic.model_validate(user))


@router.post("/password/forgot", response_model=Envelope[PasswordResetIssued])
async def request_password_reset(
    payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    user = (
        await db.execute(
            select(User).where((User.email == payload.email) | (User.username == payload.email))
        )
    ).scalar_one_or_none()
    # Always return success to avoid account enumeration. Only mint a token when matched.
    dev_token: str | None = None
    if user:
        token = secrets.token_urlsafe(32)
        pr = PasswordReset(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.add(pr)
        await db.commit()
        # Real SMTP integration plugs in here. In dev (no SMTP), expose the token so the UI shows it.
        if not _settings.smtp_enabled:
            dev_token = token
    return Envelope(data=PasswordResetIssued(sent=True, dev_token=dev_token))


@router.post("/password/reset", response_model=Envelope[dict])
async def confirm_password_reset(
    payload: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
):
    pr = (
        await db.execute(
            select(PasswordReset).where(PasswordReset.token_hash == _hash_token(payload.token))
        )
    ).scalar_one_or_none()
    if not pr or pr.used_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid or already-used token")
    # SQLite stores naive datetimes; Postgres preserves tz. Normalize both sides.
    expires = pr.expires_at if pr.expires_at.tzinfo else pr.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "token expired")
    user = (await db.execute(select(User).where(User.id == pr.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user gone")
    user.password_hash = hash_password(payload.new_password)
    pr.used_at = datetime.now(timezone.utc)
    await db.commit()
    return Envelope(data={"reset": True})


@router.post("/logout", response_model=Envelope[dict])
async def logout(_user: CurrentUser):
    # Stateless JWT; the Next.js layer clears the httpOnly cookie.
    return Envelope(data={"loggedOut": True})
