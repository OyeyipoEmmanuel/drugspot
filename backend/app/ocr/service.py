"""OCR.space transport and conservative medication-text parsing."""

from __future__ import annotations

import re
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException, status

from ..commerce.nafdac import NafdacClient
from ..config import get_settings
from .schemas import OcrExtractionResult, OcrMedicationDraft

STRENGTH_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|ml|%|iu)\b", re.IGNORECASE)
NAFDAC_PATTERN = re.compile(
    r"\bNAFDAC(?:\s+(?:REG(?:ISTRATION)?\.?|NO\.?|NUMBER))*\s*[:#-]?\s*([A-Z0-9-]{5,20})\b",
    re.IGNORECASE,
)
TIME_PATTERN = re.compile(r"\b(0?\d|1\d|2[0-3])[:.]([0-5]\d)\s*(am|pm)?\b", re.IGNORECASE)
DURATION_PATTERN = re.compile(r"\b(?:for\s+)?(\d{1,3})\s+days?\b", re.IGNORECASE)

FORM_KEYWORDS = {
    "Tablet": ("tablet", "tablets", "tab"),
    "Capsule": ("capsule", "capsules", "cap"),
    "Syrup": ("syrup", "suspension", "solution"),
    "Injection": ("injection", "injectable", "vial", "ampoule"),
    "Cream": ("cream", "ointment", "gel"),
}
FREQUENCIES = (
    (re.compile(r"\b(?:four times daily|qid)\b", re.IGNORECASE), "Four times daily"),
    (re.compile(r"\b(?:three times daily|tds|tid)\b", re.IGNORECASE), "Three times daily"),
    (re.compile(r"\b(?:twice daily|two times daily|bd|bid)\b", re.IGNORECASE), "Twice daily"),
    (re.compile(r"\b(?:once daily|daily|od|qd)\b", re.IGNORECASE), "Once daily"),
    (re.compile(r"\b(?:as needed|when required|prn)\b", re.IGNORECASE), "As needed"),
)


class OcrSpaceClient:
    def __init__(self, *, api_key: str, api_url: str, timeout_seconds: float) -> None:
        self.api_key = api_key.strip()
        self.api_url = api_url
        self.timeout_seconds = timeout_seconds

    async def extract_text(self, *, file_name: str, content_type: str, contents: bytes) -> str:
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OCR is not configured yet. Add OCR_SPACE_API_KEY to backend/.env and restart the API.",
            )
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    self.api_url,
                    headers={"apikey": self.api_key, "Accept": "application/json"},
                    data={
                        "language": "eng",
                        "OCREngine": "2",
                        "scale": "true",
                        "detectOrientation": "true",
                        "isOverlayRequired": "false",
                    },
                    files={"file": (file_name, contents, content_type)},
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The OCR service is temporarily unavailable. Please try again.",
            ) from exc

        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The OCR service returned invalid data.",
            )
        if payload.get("IsErroredOnProcessing"):
            message = _error_message(payload) or "The OCR service could not process this image."
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=message)
        parsed_results = payload.get("ParsedResults")
        if not isinstance(parsed_results, list):
            parsed_results = []
        text = "\n".join(
            str(result.get("ParsedText", "")).strip()
            for result in parsed_results
            if isinstance(result, dict) and result.get("ParsedText")
        ).strip()
        if not text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No readable medicine information was found. Try a sharper, well-lit image.",
            )
        return text


def _error_message(payload: dict[str, Any]) -> str:
    raw = payload.get("ErrorMessage") or payload.get("ErrorDetails")
    if isinstance(raw, list):
        return " ".join(str(value) for value in raw if value).strip()
    return str(raw or "").strip()


def _clean_lines(text: str) -> list[str]:
    return [" ".join(line.split()).strip(" |") for line in text.splitlines() if line.strip()]


def _medicine_name(lines: list[str], strength: str | None) -> str | None:
    ignored = ("nafdac", "manufactured", "expiry", "batch", "take ", "use ", "apply ", "dosage")
    candidates: list[str] = []
    for line in lines:
        lowered = line.lower()
        if any(value in lowered for value in ignored):
            continue
        candidate = STRENGTH_PATTERN.sub("", line).strip(" -,:;()")
        if not candidate or candidate.isdigit() or len(candidate) > 100:
            continue
        if strength and strength.lower() in lowered:
            return candidate.title() if candidate.isupper() else candidate
        if re.search(r"[A-Za-z]{3}", candidate):
            candidates.append(candidate)
    if not candidates:
        return None
    candidate = candidates[0]
    return candidate.title() if candidate.isupper() else candidate


def _normalize_time(match: re.Match[str]) -> str:
    hour = int(match.group(1))
    minute = int(match.group(2))
    meridiem = (match.group(3) or "").lower()
    if meridiem == "pm" and hour < 12:
        hour += 12
    elif meridiem == "am" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}"


def parse_medication_text(text: str) -> OcrMedicationDraft:
    lines = _clean_lines(text)
    strength_match = STRENGTH_PATTERN.search(text)
    strength = strength_match.group(0).replace(" ", " ").strip() if strength_match else None
    name = _medicine_name(lines, strength)
    lowered = text.lower()
    form = next(
        (
            label
            for label, keywords in FORM_KEYWORDS.items()
            if any(re.search(rf"\b{word}s?\b", lowered) for word in keywords)
        ),
        None,
    )
    frequency = next((label for pattern, label in FREQUENCIES if pattern.search(text)), None)
    instruction = next(
        (line for line in lines if re.search(r"\b(take|use|apply|inject|swallow)\b", line, re.IGNORECASE)),
        None,
    )
    duration_match = DURATION_PATTERN.search(text)
    start_date = date.today()
    end_date = start_date + timedelta(days=int(duration_match.group(1))) if duration_match else None
    times = list(dict.fromkeys(_normalize_time(match) for match in TIME_PATTERN.finditer(text)))
    nafdac_match = NAFDAC_PATTERN.search(text)
    detected_nafdac = nafdac_match.group(1).upper() if nafdac_match else None

    found_fields = sum(bool(value) for value in (name, strength, form, instruction, frequency, detected_nafdac))
    confidence = min(0.9, 0.3 + found_fields * 0.1)
    warnings = ["OCR can make mistakes. Confirm every field against the package or prescription before saving."]
    if not name or not strength:
        warnings.append("The medicine name or strength could not be read confidently and must be entered manually.")
    return OcrMedicationDraft(
        name=name,
        strength=strength,
        form=form,
        instructions=instruction,
        frequency=frequency,
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat() if end_date else None,
        schedule_times=times,
        confidence=confidence,
        warnings=warnings,
        detected_nafdac_number=detected_nafdac,
    )


def split_medication_blocks(text: str) -> list[str]:
    lines = _clean_lines(text)
    starts: list[int] = []
    for index, line in enumerate(lines):
        if not STRENGTH_PATTERN.search(line):
            continue
        if re.search(r"\b(take|use|apply|inject|swallow)\b", line, re.IGNORECASE):
            continue
        without_strength = STRENGTH_PATTERN.sub("", line).strip(" -,:;()")
        start = index if re.search(r"[A-Za-z]{3}", without_strength) else max(0, index - 1)
        if start not in starts:
            starts.append(start)
    if len(starts) <= 1:
        return ["\n".join(lines)]
    blocks = []
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(lines)
        blocks.append("\n".join(lines[start:end]))
    return blocks


async def _verify_draft(draft: OcrMedicationDraft, nafdac: NafdacClient) -> OcrMedicationDraft:
    if not draft.detected_nafdac_number or not draft.name:
        return draft
    try:
        verification = await nafdac.verify(
            nafdac_number=draft.detected_nafdac_number,
            product_name=draft.name,
            strength=draft.strength or "",
        )
    except HTTPException:
        draft.warnings.append("NAFDAC matching was unavailable; confirm the registration number manually.")
        return draft
    draft.nafdac_verified = verification.verified
    draft.warnings.append(verification.reason)
    if verification.verified:
        draft.name = verification.official_name
        draft.strength = verification.strength or draft.strength
    return draft


async def build_medication_extraction(
    text: str,
    *,
    source_file_name: str,
    nafdac: NafdacClient,
) -> OcrExtractionResult:
    drafts: list[OcrMedicationDraft] = []
    seen: set[tuple[str, str]] = set()
    for block in split_medication_blocks(text):
        draft = await _verify_draft(parse_medication_text(block), nafdac)
        identity = ((draft.name or "").lower(), (draft.strength or "").lower())
        if identity in seen:
            continue
        seen.add(identity)
        drafts.append(draft)
    summary = (
        f"OCR found {len(drafts)} possible medicine{'s' if len(drafts) != 1 else ''}. "
        "Confirm each one before saving."
    )
    return OcrExtractionResult(
        medications=drafts,
        source_file_name=Path(source_file_name).name[:255],
        extracted_text=text,
        warnings=[summary],
    )


def get_ocr_client() -> OcrSpaceClient:
    settings = get_settings()
    return OcrSpaceClient(
        api_key=settings.ocr_space_api_key,
        api_url=settings.ocr_space_api_url,
        timeout_seconds=settings.ocr_space_timeout_seconds,
    )
