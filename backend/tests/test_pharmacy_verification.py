from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from backend.app.pharmacy_verification.deps import get_current_user, get_db
from backend.app.pharmacy_verification.models import Base
from backend.app.pharmacy_verification.router import router


@pytest.fixture
def client() -> TestClient:
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def create_schema() -> None:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(create_schema())

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    async def override_current_user() -> object:
        class User:
            id = "admin-user-1"
            role = "admin"

        return User()

    app = FastAPI(title="Pharmacy Verification Test App")
    app.include_router(router)
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_pharmacy_and_medication_happy_path(client: TestClient) -> None:
    pharmacy = client.post(
        "/pharmacy/pharmacies",
        json={
            "name": "DrugSpot Pharmacy",
            "address": "12 Marina Road",
            "city": "Lagos",
            "state": "Lagos",
            "country": "Nigeria",
            "phone_number": "+2348000000000",
            "email": "hello@drugspot.ng",
        },
    )
    assert pharmacy.status_code == 201, pharmacy.text
    pharmacy_id = pharmacy.json()["id"]

    medication = client.post(
        "/pharmacy/medications",
        json={
            "pharmacy_id": pharmacy_id,
            "name": "Paracetamol",
            "generic_name": "Acetaminophen",
            "dosage_form": "tablet",
            "strength": "500mg",
            "instructions": "Take one tablet every 8 hours as directed.",
        },
    )
    assert medication.status_code == 201, medication.text
    medication_id = medication.json()["id"]

    schedule = client.post(
        f"/pharmacy/medications/{medication_id}/schedules",
        json={
            "label": "Morning dose",
            "frequency": "daily",
            "time_of_day": "08:00",
            "start_date": "2026-09-01T08:00:00Z",
            "end_date": "2026-09-30T08:00:00Z",
            "notes": "Take after breakfast.",
        },
    )
    assert schedule.status_code == 201, schedule.text
    assert schedule.json()["label"] == "Morning dose"


def test_non_admin_permission_denied(client: TestClient) -> None:
    async def override_patient_user() -> object:
        class User:
            id = "patient-user-1"
            role = "patient"

        return User()

    client.app.dependency_overrides[get_current_user] = override_patient_user
    response = client.post(
        "/pharmacy/pharmacies",
        json={
            "name": "Patient Pharmacy",
            "address": "1 Main Road",
            "city": "Abuja",
            "state": "FCT",
            "country": "Nigeria",
        },
    )
    assert response.status_code == 403, response.text
    assert "Access denied" in response.json()["detail"]


def test_validation_failure_for_invalid_schedule(client: TestClient) -> None:
    pharmacy = client.post(
        "/pharmacy/pharmacies",
        json={
            "name": "Schedule Test Pharmacy",
            "city": "Kaduna",
            "state": "Kaduna",
            "country": "Nigeria",
        },
    )
    med = client.post(
        "/pharmacy/medications",
        json={
            "pharmacy_id": pharmacy.json()["id"],
            "name": "Vitamin C",
            "dosage_form": "capsule",
            "strength": "250mg",
        },
    )

    response = client.post(
        f"/pharmacy/medications/{med.json()['id']}/schedules",
        json={
            "label": "Invalid schedule",
            "frequency": "bad_value",
            "start_date": "2026-10-10T00:00:00Z",
            "end_date": "2026-10-01T00:00:00Z",
        },
    )
    assert response.status_code == 422, response.text
