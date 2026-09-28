import asyncio

from app.auth.models import UserRole

from .conftest import auth_header, register_patient


def test_health_and_frontend_auth_contract(api) -> None:
    client, _ = api
    assert client.get("/health").json() == {"status": "ok"}
    session = register_patient(client, email="patient@example.com", phone="+2348012345678")
    assert session["user"]["firstName"] == "Ada"
    assert session["user"]["role"] == "patient"
    assert session["accessToken"] and session["refreshToken"]

    profile = client.get("/api/v1/auth/profile/", headers=auth_header(session))
    assert profile.status_code == 200
    assert profile.json()["email"] == "patient@example.com"

    onboarding = client.post("/api/v1/auth/onboarding/complete/", json={}, headers=auth_header(session))
    assert onboarding.status_code == 200
    assert onboarding.json() == {"onboardingComplete": True}


def test_public_registration_cannot_select_privileged_role(api) -> None:
    client, _ = api
    response = client.post(
        "/api/v1/auth/register/",
        json={
            "firstName": "Mallory",
            "lastName": "Admin",
            "email": "mallory@example.com",
            "phone": "+2348011111111",
            "password": "StrongPass123!",
            "role": "platform_admin",
        },
    )
    assert response.status_code == 422


def test_refresh_rotation_and_logout(api) -> None:
    client, _ = api
    initial = register_patient(client, email="rotate@example.com", phone="+2348022222222")
    refreshed = client.post("/api/v1/auth/token/refresh/", json={"refreshToken": initial["refreshToken"]})
    assert refreshed.status_code == 200, refreshed.text
    assert refreshed.json()["refreshToken"] != initial["refreshToken"]
    assert client.post("/api/v1/auth/token/refresh/", json={"refreshToken": initial["refreshToken"]}).status_code == 401

    logout = client.post("/api/v1/auth/logout/", json={"refreshToken": refreshed.json()["refreshToken"]})
    assert logout.status_code == 200
    assert (
        client.post("/api/v1/auth/token/refresh/", json={"refreshToken": refreshed.json()["refreshToken"]}).status_code
        == 401
    )


def test_rbac_and_non_enumerating_password_reset(api) -> None:
    client, create_user = api
    patient = register_patient(client, email="rbac@example.com", phone="+2348033333333")
    assert client.get("/api/v1/auth/admin-only/", headers=auth_header(patient)).status_code == 403

    first = client.post("/api/v1/auth/password/forgot/", json={"email": "rbac@example.com"})
    second = client.post("/api/v1/auth/password/forgot/", json={"email": "missing@example.com"})
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()

    asyncio.run(create_user(email="admin@example.com", phone="+2348044444444", role=UserRole.PLATFORM_ADMIN))
    login = client.post("/api/v1/auth/login/", json={"email": "admin@example.com", "password": "StrongPass123!"})
    assert client.get("/api/v1/auth/admin-only/", headers=auth_header(login.json())).status_code == 200
