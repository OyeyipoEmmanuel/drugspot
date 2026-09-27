from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.auth.models import User, UserRole
from app.auth.service import hash_password
from app.database import Base, get_db
from app.main import app


@pytest.fixture
def api():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    async def setup() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(setup())

    async def override_db() -> AsyncGenerator[AsyncSession, None]:
        async with sessions() as session:
            yield session

    async def create_user(*, email: str, phone: str, role: UserRole, password: str = "StrongPass123!") -> str:
        async with sessions() as session:
            user = User(
                first_name="Test",
                last_name="User",
                email=email,
                phone=phone,
                password_hash=hash_password(password),
                role=role,
                onboarding_complete=True,
            )
            session.add(user)
            await session.commit()
            return user.id

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        yield client, create_user
    app.dependency_overrides.clear()
    asyncio.run(engine.dispose())


def register_patient(client: TestClient, *, email: str, phone: str) -> dict:
    response = client.post(
        "/api/v1/auth/register/",
        json={
            "firstName": "Ada",
            "lastName": "Okafor",
            "email": email,
            "phone": phone,
            "password": "StrongPass123!",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def auth_header(session: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {session['accessToken']}"}
