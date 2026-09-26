"""Dependencies and RBAC guards for the pharmacy verification module."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from types import SimpleNamespace

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .models import AccessRole

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, future=True) if DATABASE_URL else None
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False) if engine else None

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    """Yield an async SQLAlchemy session for module-level database access."""
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL must be configured for pharmacy verification database access.")
    async with AsyncSessionLocal() as session:
        yield session


def _build_user_from_token(token: str) -> SimpleNamespace:
    """Build a minimal authenticated user object from a bearer token.

    This is intentionally local to the module and acts as a placeholder until the
    application-level auth layer is integrated into the app container.
    """
    if token:
        candidate = token.strip().lower()
        if candidate in {role.value for role in AccessRole}:
            return SimpleNamespace(id=f"{candidate}-user", role=candidate, email=f"{candidate}@example.com")
        if ":" in candidate:
            role_name, user_id = candidate.split(":", 1)
            if role_name in {role.value for role in AccessRole}:
                return SimpleNamespace(id=user_id, role=role_name, email=f"{role_name}@example.com")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> SimpleNamespace:
    """Return the active user context for the current request."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return _build_user_from_token(credentials.credentials)


def require_roles(*allowed_roles: AccessRole | str):
    """Factory creating an RBAC guard for a single endpoint."""
    allowed = {item.value if isinstance(item, AccessRole) else item.lower() for item in allowed_roles}

    async def dependency(current_user: SimpleNamespace = Depends(get_current_user)) -> SimpleNamespace:
        if current_user.role.lower() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {sorted(allowed)}",
            )
        return current_user

    return dependency
