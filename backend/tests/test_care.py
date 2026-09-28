import asyncio

from app.auth.models import UserRole

from .conftest import auth_header, register_patient
from .test_pharmacy_verification import vendor_registration_payload


def approve_vendor(client, create_user) -> dict:
    vendor = client.post("/api/v1/pharmacy/register/", json=vendor_registration_payload()).json()
    application = client.get("/api/v1/pharmacy/application/", headers=auth_header(vendor)).json()
    asyncio.run(create_user(email="care-admin@example.com", phone="+2348333333333", role=UserRole.PLATFORM_ADMIN))
    admin = client.post(
        "/api/v1/auth/login/",
        json={"email": "care-admin@example.com", "password": "StrongPass123!"},
    ).json()
    response = client.patch(
        f"/api/v1/admin/verifications/{application['id']}/",
        json={"decision": "approved", "notes": "Credentials verified"},
        headers=auth_header(admin),
    )
    assert response.status_code == 200, response.text
    return vendor


def test_patient_medications_are_persisted_and_scoped(api) -> None:
    client, _ = api
    patient = register_patient(client, email="medication-patient@example.com", phone="+2348444444444")
    other_patient = register_patient(client, email="other-patient@example.com", phone="+2348555555555")
    payload = {
        "name": "Prescribed medicine",
        "strength": "500 mg",
        "form": "Tablet",
        "instructions": "Take one tablet after food",
        "frequency": "Twice daily",
        "startDate": "2026-09-28",
        "endDate": "2026-10-04",
        "remainingDoses": 14,
        "scheduleTimes": ["08:00", "20:00"],
    }

    created = client.post("/api/v1/medications/", json=payload, headers=auth_header(patient))
    assert created.status_code == 201, created.text
    medication = created.json()
    assert medication["remainingDoses"] == 14
    assert [item["time"] for item in medication["schedules"]] == ["08:00", "20:00"]

    listed = client.get("/api/v1/medications/", headers=auth_header(patient)).json()
    assert [item["id"] for item in listed] == [medication["id"]]
    assert client.get("/api/v1/medications/", headers=auth_header(other_patient)).json() == []

    adherence = client.post(
        f"/api/v1/medications/{medication['id']}/adherence/",
        json={"status": "taken"},
        headers=auth_header(patient),
    )
    assert adherence.status_code == 200, adherence.text
    assert adherence.json()["remainingDoses"] == 13
    assert adherence.json()["adherence"][0]["status"] == "taken"


def test_conversations_are_mapped_to_the_selected_pharmacy(api) -> None:
    client, create_user = api
    vendor = approve_vendor(client, create_user)
    patient = register_patient(client, email="chat-patient@example.com", phone="+2348666666666")

    pharmacists = client.get("/api/v1/pharmacists/").json()
    assert len(pharmacists) == 1
    pharmacist = pharmacists[0]

    started = client.post(
        "/api/v1/conversations/",
        json={
            "pharmacistId": pharmacist["id"],
            "subject": "Medicine question",
            "message": "Can I take this after food?",
            "medicationName": "Prescribed medicine",
        },
        headers=auth_header(patient),
    )
    assert started.status_code == 201, started.text
    conversation = started.json()
    assert conversation["pharmacyId"] == pharmacist["pharmacyId"]
    assert conversation["pharmacyName"] == pharmacist["pharmacyName"]

    vendor_inbox = client.get("/api/v1/conversations/", headers=auth_header(vendor)).json()
    assert [item["id"] for item in vendor_inbox] == [conversation["id"]]

    reply = client.post(
        f"/api/v1/conversations/{conversation['id']}/messages/",
        json={"body": "Yes, follow the instructions on your prescription.", "senderRole": "patient"},
        headers=auth_header(vendor),
    )
    assert reply.status_code == 201, reply.text
    assert reply.json()["senderRole"] == "pharmacist"

    patient_thread = client.get(
        f"/api/v1/conversations/{conversation['id']}/",
        headers=auth_header(patient),
    ).json()
    assert len(patient_thread["messages"]) == 2
