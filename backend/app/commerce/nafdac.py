"""NAFDAC Greenbook product verification client."""

from __future__ import annotations

import re
from datetime import date
from difflib import SequenceMatcher
from typing import Any

import httpx
from fastapi import HTTPException, status

from ..config import get_settings
from .schemas import NafdacVerificationResult


def normalize_nafdac_number(value: str) -> str:
    return re.sub(r"\s+", "", value).upper()


def normalize_product_name(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.lower()))


def product_name_score(submitted: str, official: str) -> float:
    left = normalize_product_name(submitted)
    right = normalize_product_name(official)
    if not left or not right:
        return 0
    if left == right:
        return 1
    if min(len(left), len(right)) >= 5 and (left in right or right in left):
        return 0.9
    return SequenceMatcher(None, left, right).ratio()


def parse_date(value: Any) -> date | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


class NafdacClient:
    def __init__(self, *, base_url: str, timeout_seconds: float) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds

    async def verify(self, *, nafdac_number: str, product_name: str, strength: str = "") -> NafdacVerificationResult:
        submitted_number = normalize_nafdac_number(nafdac_number)
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.get(
                    f"{self.base_url}/api/open/products/search",
                    params={"query": submitted_number},
                    headers={"Accept": "application/json"},
                )
                response.raise_for_status()
                payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="NAFDAC verification is temporarily unavailable. Please try again.",
            ) from exc

        records = payload.get("data", []) if isinstance(payload, dict) else []
        exact_matches = [
            item
            for item in records
            if isinstance(item, dict)
            and normalize_nafdac_number(str(item.get("nafdac_number", ""))) == submitted_number
        ]
        if not exact_matches:
            return NafdacVerificationResult(
                verified=False,
                reason="This registration number was not found in the NAFDAC Greenbook.",
                nafdac_number=submitted_number,
            )

        today = date.today()
        record = max(
            exact_matches,
            key=lambda item: (
                parse_date(item.get("expiry_date")) is not None
                and parse_date(item.get("expiry_date")) >= today,
                product_name_score(product_name, str(item.get("product_name", ""))),
                parse_date(item.get("expiry_date")) or date.min,
            ),
        )
        official_name = str(record.get("product_name", "")).strip()
        expiry_date = parse_date(record.get("expiry_date"))
        name_matches = product_name_score(product_name, official_name) >= 0.72
        is_current = expiry_date is not None and expiry_date >= today
        verified = name_matches and is_current
        if not name_matches:
            reason = f'The NAFDAC number belongs to "{official_name}", not the submitted product name.'
        elif not is_current:
            reason = "The matching NAFDAC registration has expired."
        else:
            reason = "The registration number and product name match the NAFDAC Greenbook."

        ingredient = record.get("ingredient") or {}
        manufacturer = record.get("manufacturer") or {}
        return NafdacVerificationResult(
            verified=verified,
            reason=reason,
            nafdac_number=submitted_number,
            nafdac_product_id=record.get("product_id"),
            official_name=official_name,
            strength=str(record.get("strength", "") or ""),
            pack_size=str(record.get("pack_size", "") or ""),
            description=str(record.get("product_description", "") or ""),
            composition=str(record.get("composition", "") or ""),
            ingredient=str(ingredient.get("ingredient_name", "") or "") if isinstance(ingredient, dict) else "",
            manufacturer=(
                str(manufacturer.get("manufacturer_name", "") or "") if isinstance(manufacturer, dict) else ""
            ),
            approval_date=parse_date(record.get("approval_date")),
            expiry_date=expiry_date,
            name_matches=name_matches,
        )


def get_nafdac_client() -> NafdacClient:
    settings = get_settings()
    return NafdacClient(
        base_url=settings.nafdac_api_base_url,
        timeout_seconds=settings.nafdac_api_timeout_seconds,
    )
