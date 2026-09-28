import asyncio

from app.auth.models import UserRole

from .conftest import auth_header, register_patient
from .test_pharmacy_verification import vendor_registration_payload


def test_live_catalogue_checkout_and_fulfilment(api) -> None:
    client, create_user = api
    vendor = client.post("/api/v1/pharmacy/register/", json=vendor_registration_payload()).json()
    application = client.get("/api/v1/pharmacy/application/", headers=auth_header(vendor)).json()
    assert client.get("/api/v1/pharmacy/access/", headers=auth_header(vendor)).status_code == 403

    asyncio.run(create_user(email="commerce-admin@example.com", phone="+2348111111111", role=UserRole.PLATFORM_ADMIN))
    admin = client.post(
        "/api/v1/auth/login/",
        json={"email": "commerce-admin@example.com", "password": "StrongPass123!"},
    ).json()
    approval = client.patch(
        f"/api/v1/admin/verifications/{application['id']}/",
        json={"decision": "approved", "notes": "All credentials verified"},
        headers=auth_header(admin),
    )
    assert approval.status_code == 200, approval.text
    assert client.get("/api/v1/pharmacy/access/", headers=auth_header(vendor)).json()["approved"] is True

    mismatch = client.post(
        "/api/v1/pharmacy/inventory/verify-nafdac/",
        json={"nafdacNumber": "A11-0551", "productName": "Amlodipine", "strength": "5 mg"},
        headers=auth_header(vendor),
    ).json()
    assert mismatch["verified"] is False
    assert mismatch["officialName"] == "AC-Drex Tablet"

    verification = client.post(
        "/api/v1/pharmacy/inventory/verify-nafdac/",
        json={"nafdacNumber": "A11-0551", "productName": "AC-Drex Tablet", "strength": "500 mg; 30 mg"},
        headers=auth_header(vendor),
    )
    assert verification.status_code == 200, verification.text
    assert verification.json()["verified"] is True

    image_upload = client.post(
        "/api/v1/pharmacy/inventory/product-image/",
        files={"image": ("ac-drex.jpg", b"\xff\xd8\xff\xe0clear-product-photo", "image/jpeg")},
        headers=auth_header(vendor),
    )
    assert image_upload.status_code == 200, image_upload.text
    image_url = image_upload.json()["imageUrl"]
    assert image_url.startswith("http://testserver/uploads/product-images/")

    product_response = client.post(
        "/api/v1/pharmacy/inventory/",
        json={
            "name": "AC-Drex Tablet",
            "genericName": "Paracetamol; Caffeine",
            "brand": "A.C. Drugs Ltd",
            "category": "Pain relief",
            "form": "Tablet",
            "strength": "500 mg; 30 mg",
            "packSize": "10 x 10's (in blisters)",
            "description": "Tablet",
            "imageUrl": image_url,
            "sku": "ACD-COMMERCE-001",
            "nafdacNumber": "A11-0551",
            "stockCount": 12,
            "reorderLevel": 4,
            "unitPrice": 3500,
            "requiresPrescription": False,
            "requiresPharmacistReview": False,
        },
        headers=auth_header(vendor),
    )
    assert product_response.status_code == 201, product_response.text
    assert product_response.json()["nafdacVerified"] is True
    assert product_response.json()["imageUrl"] == image_url

    products = client.get("/api/v1/products/").json()
    assert len(products) == 1
    assert products[0]["nafdacVerified"] is True
    assert products[0]["imageUrl"] == image_url
    assert products[0]["offers"][0]["stockCount"] == 12
    pharmacies = client.get("/api/v1/pharmacies/").json()

    patient = register_patient(client, email="commerce-patient@example.com", phone="+2348222222222")
    checkout = client.post(
        "/api/v1/orders/checkout/",
        json={
            "items": [
                {
                    "product": products[0],
                    "offer": products[0]["offers"][0],
                    "pharmacy": pharmacies[0],
                    "quantity": 2,
                }
            ],
            "fulfillmentMethod": "pickup",
            "paymentMethod": "card",
            "recipientName": "Ada Okafor",
            "phone": "+2348222222222",
        },
        headers=auth_header(patient),
    )
    assert checkout.status_code == 201, checkout.text
    order = checkout.json()
    assert order["status"] == "placed"
    assert order["total"] == 7000

    vendor_orders = client.get("/api/v1/pharmacy/orders/", headers=auth_header(vendor))
    assert vendor_orders.status_code == 200
    assert vendor_orders.json()[0]["patientName"] == "Ada Okafor"

    accepted = client.patch(
        f"/api/v1/pharmacy/orders/{order['id']}/status/",
        json={"status": "accepted"},
        headers=auth_header(vendor),
    )
    assert accepted.status_code == 200, accepted.text

    inventory = client.get("/api/v1/pharmacy/inventory/", headers=auth_header(vendor)).json()
    assert inventory[0]["stockCount"] == 10
    customers = client.get("/api/v1/pharmacy/customers/", headers=auth_header(vendor)).json()
    assert customers[0]["orderCount"] == 1
    dashboard = client.get("/api/v1/pharmacy/dashboard/", headers=auth_header(vendor)).json()
    assert dashboard["openOrders"] == 1
