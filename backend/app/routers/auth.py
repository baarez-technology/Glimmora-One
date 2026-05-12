from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..deps import CurrentUser
from ..models import User
from ..schemas import (
    Envelope,
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserPublic,
)
from ..security import create_access_token, hash_password, verify_password

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


@router.post("/logout", response_model=Envelope[dict])
async def logout(_user: CurrentUser):
    # Stateless JWT; the Next.js layer clears the httpOnly cookie.
    return Envelope(data={"loggedOut": True})
