from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_db
from .models import User
from .security import decode_token


async def current_user(
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"invalid token: {exc}") from exc

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token missing subject")

    user = (await db.execute(select(User).where(User.id == sub))).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found or inactive")
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require_role(*roles: str):
    async def _checker(me: CurrentUser) -> User:
        if me.role not in roles and me.role != "superadmin":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "insufficient role")
        return me
    return _checker


def require_premium(me: User) -> User:
    if me.subscription_tier != "premium" and me.role not in ("superadmin", "admin"):
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "premium subscription required")
    return me
