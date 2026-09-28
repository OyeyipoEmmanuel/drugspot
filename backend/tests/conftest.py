from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.auth.models import User, UserRole
from app.auth.service import hash_password
from app.commerce.nafdac import get_nafdac_client
from app.commerce.schemas import NafdacVerificationResult
from app.database import Base, get_db
from app.main import app
from app.ocr.service import get_ocr_client


class FakeNafdacClient:
    async def verify(self, *, nafdac_number: str, product_name: str, strength: str = "") -> NafdacVerificationResult:
        del strength
        normalized_number = nafdac_number.replace(" ", "").upper()
        name_matches = product_name.strip().lower() in {"ac-drex", "ac-drex tablet"}
        verified = normalized_number == "A11-0551" and name_matches
        return NafdacVerificationResult(
            verified=verified,
            reason=(
                "The registration number and product name match the NAFDAC Greenbook."
                if verified
                else 'The NAFDAC number belongs to "AC-Drex Tablet", not the submitted product name.'
            ),
            nafdac_number=normalized_number,
            nafdac_product_id=6647,
            official_name="AC-Drex Tablet",
            strength="500 mg; 30 mg",
            pack_size="10 x 10's (in blisters)",
            description="Tablet",
            composition="Paracetamol 500 mg, Caffeine 30 mg",
            ingredient="Paracetamol; Caffeine",
            manufacturer="A.C. Drugs Ltd",
            approval_date=date(2023, 12, 21),
            expiry_date=date(2028, 12, 20),
            name_matches=name_matches,
        )


class FakeOcrClient:
    async def extract_text(self, *, file_name: str, content_type: str, contents: bytes) -> str:
        assert file_name
        assert content_type.startswith("image/")
        assert contents
        return """AC-DREX TABLET 500 mg
NAFDAC REG NO A11-0551
Take one tablet twice daily for 7 days at 08:00 and 20:00
PARACETAMOL TABLET 500 mg
Take one tablet once daily for 3 days at 09:00"""


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
    app.dependency_overrides[get_nafdac_client] = lambda: FakeNafdacClient()
    app.dependency_overrides[get_ocr_client] = lambda: FakeOcrClient()
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
