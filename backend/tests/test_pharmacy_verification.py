import asyncio

from app.auth.models import UserRole

from .conftest import auth_header, register_patient


def application_payload(name: str = "DrugSpot Pharmacy") -> dict:
    return {
        "name": name,
        "address": "12 Marina Road",
        "city": "Lagos",
        "state": "Lagos",
        "country": "Nigeria",
        "phone": "+2348000000000",
        "email": "hello@drugspot.ng",
        "description": "A community pharmacy.",
        "supportsDelivery": True,
        "supportsPickup": True,
        "deliveryFee": 1500,
    }


def vendor_registration_payload() -> dict:
    return {
        "firstName": "Amaka",
        "lastName": "Okafor",
        "email": "vendor@example.com",
        "phone": "+2348055555555",
        "password": "StrongPass123!",
        "pharmacy": application_payload(),
        "pharmacyLicense": {
            "licenseNumber": "PCN-LAG-12345",
            "issuedBy": "Pharmacy Council of Nigeria",
            "documentUrl": "https://documents.example.com/pharmacy-license.pdf",
        },
        "pharmacistLicenseNumber": "PCN-PHARMACIST-12345",
        "pharmacistLicenseIssuedBy": "Pharmacy Council of Nigeria",
        "pharmacistLicenseDocumentUrl": "https://documents.example.com/pharmacist-license.pdf",
    }


def test_pharmacy_application_review_and_public_discovery(api) -> None:
    client, create_user = api
    registration = client.post("/api/v1/pharmacy/register/", json=vendor_registration_payload())
    assert registration.status_code == 201, registration.text
    owner = registration.json()
    assert owner["user"]["role"] == "pharmacy_admin"
    application = client.get("/api/v1/pharmacy/application/", headers=auth_header(owner))
    pharmacy_id = application.json()["id"]
    assert application.json()["verificationStatus"] == "pending"

    asyncio.run(create_user(email="reviewer@example.com", phone="+2348066666666", role=UserRole.PLATFORM_ADMIN))
    admin_login = client.post(
        "/api/v1/auth/login/", json={"email": "reviewer@example.com", "password": "StrongPass123!"}
    ).json()
    queue = client.get("/api/v1/admin/verifications/", headers=auth_header(admin_login))
    assert queue.status_code == 200, queue.text
    assert len(queue.json()) == 1
    assert queue.json()[0]["licenses"][0]["licenseNumber"] == "PCN-LAG-12345"
    assert queue.json()[0]["pharmacistInCharge"]["licenseNumber"] == "PCN-PHARMACIST-12345"
    assert queue.json()[0]["pharmacistInCharge"]["firstName"] == "Amaka"

    review = client.patch(
        f"/api/v1/admin/verifications/{pharmacy_id}/",
        json={"decision": "approved", "notes": "Documents verified"},
        headers=auth_header(admin_login),
    )
    assert review.status_code == 200, review.text

    public = client.get("/api/v1/pharmacies/")
    assert public.status_code == 200
    assert public.json()[0]["verified"] is True
    assert public.json()[0]["name"] == "DrugSpot Pharmacy"


def test_patient_cannot_access_verification_queue(api) -> None:
    client, _ = api
    patient = register_patient(client, email="queue@example.com", phone="+2348077777777")
    assert client.get("/api/v1/admin/verifications/", headers=auth_header(patient)).status_code == 403


def test_approval_requires_a_license(api) -> None:
    client, create_user = api
    owner = register_patient(client, email="unlicensed@example.com", phone="+2348088888888")
    pharmacy = client.post(
        "/api/v1/pharmacy/applications/",
        json={**application_payload("Unlicensed Pharmacy"), "email": "unlicensed@drugspot.ng"},
        headers=auth_header(owner),
    ).json()
    asyncio.run(create_user(email="admin2@example.com", phone="+2348099999999", role=UserRole.PLATFORM_ADMIN))
    admin = client.post(
        "/api/v1/auth/login/", json={"email": "admin2@example.com", "password": "StrongPass123!"}
    ).json()
    response = client.patch(
        f"/api/v1/admin/verifications/{pharmacy['id']}/",
        json={"decision": "approved"},
        headers=auth_header(admin),
    )
    assert response.status_code == 409
