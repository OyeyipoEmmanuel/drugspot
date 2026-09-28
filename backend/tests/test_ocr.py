from .conftest import auth_header, register_patient


def test_patient_ocr_extracts_draft_and_checks_nafdac(api) -> None:
    client, _ = api
    patient = register_patient(client, email="ocr-patient@example.com", phone="+2348333333333")

    response = client.post(
        "/api/v1/medications/ocr/",
        files={"image": ("medicine.jpg", b"\xff\xd8\xff\xe0medicine-photo", "image/jpeg")},
        headers=auth_header(patient),
    )

    assert response.status_code == 200, response.text
    result = response.json()
    assert len(result["medications"]) == 2
    draft = result["medications"][0]
    assert draft["name"] == "AC-Drex Tablet"
    assert draft["strength"] == "500 mg; 30 mg"
    assert draft["form"] == "Tablet"
    assert draft["frequency"] == "Twice daily"
    assert draft["scheduleTimes"] == ["08:00", "20:00"]
    assert draft["detectedNafdacNumber"] == "A11-0551"
    assert draft["nafdacVerified"] is True
    assert result["medications"][1]["name"] == "Paracetamol Tablet"
    assert result["medications"][1]["frequency"] == "Once daily"
    assert "AC-DREX TABLET" in result["extractedText"]


def test_ocr_rejects_non_image_upload(api) -> None:
    client, _ = api
    patient = register_patient(client, email="ocr-file@example.com", phone="+2348444444444")

    response = client.post(
        "/api/v1/medications/ocr/",
        files={"image": ("notes.txt", b"medicine", "text/plain")},
        headers=auth_header(patient),
    )

    assert response.status_code == 415
