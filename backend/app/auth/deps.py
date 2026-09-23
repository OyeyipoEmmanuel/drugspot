"""Dependencies for the auth module.

The project does not yet contain a central database bootstrap, so this module
provides the interface boundary that downstream routers depend on. The runtime app
should override `get_db` with its project-wide async session factory.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .models import User, UserRole
from .service import decode_access_token, get_user_by_identifier

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, future=True) if DATABASE_URL else None
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False) if engine else None

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    """Yield a database session for route handlers.

    The project-level application should override this dependency with the real
    session factory. Unit tests also override it to use in-memory SQLite.
    """
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL must be configured before using the auth module.")
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the authenticated user from a bearer token."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing subject")

    user = await get_user_by_identifier(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*allowed_roles: UserRole | str):
    """Factory used to enforce explicit RBAC on per-endpoint dependencies."""
    allowed = {item.value if isinstance(item, UserRole) else item.lower() for item in allowed_roles}

    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {sorted(allowed)}",
            )
        return current_user

    return dependency
