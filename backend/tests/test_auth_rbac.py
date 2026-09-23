from __future__ import annotations

import asyncio
from typing import Any, AsyncGenerator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from backend.app.auth.deps import get_db
from backend.app.auth.models import Base
from backend.app.auth.router import router


@pytest.fixture
def client() -> TestClient:
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )

    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def create_schema() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    asyncio.run(create_schema())

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with async_session_factory() as session:
            yield session

    app = FastAPI(title="Auth Module Test App")
    app.include_router(router)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_register_and_login_happy_path(client: TestClient) -> None:
    payload = {
        "email": "patient@example.com",
        "phone_number": "+2348012345678",
        "password": "StrongPass123!",
        "role": "patient",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201, response.text

    login = client.post(
        "/auth/login",
        json={"email_or_phone": "patient@example.com", "password": "StrongPass123!"},
    )
    assert login.status_code == 200, login.text
    body = login.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "patient@example.com"

    token = body["access_token"]
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    assert me.json()["role"] == "patient"


def test_admin_only_route_rejects_non_admin(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={
            "email": "staff@example.com",
            "phone_number": "+2348098765432",
            "password": "StrongPass123!",
            "role": "pharmacist",
        },
    )

    login = client.post(
        "/auth/login",
        json={"email_or_phone": "staff@example.com", "password": "StrongPass123!"},
    )
    token = login.json()["access_token"]

    response = client.get("/auth/admin-only", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403, response.text
    assert "Access denied" in response.json()["detail"]


def test_validation_error_for_bad_password(client: TestClient) -> None:
    response = client.post(
        "/auth/register",
        json={
            "email": "bad@example.com",
            "phone_number": "+2348123456789",
            "password": "short",
            "role": "patient",
        },
    )
    assert response.status_code == 422, response.text
