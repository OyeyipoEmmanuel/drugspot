"""Schemas for pharmacy onboarding and verification."""

from datetime import datetime
from decimal import Decimal

from pydantic import EmailStr, Field, model_validator

from ..auth.schemas import ApiModel, RegisterInput
from .models import VerificationStatus


class PharmacyApplicationInput(ApiModel):
    name: str = Field(min_length=2, max_length=200)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=120)
    state: str = Field(min_length=2, max_length=120)
    country: str = Field(default="Nigeria", min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr
    description: str = Field(default="", max_length=2000)
    hours: str = Field(default="Mon-Sat, 8:00 AM-8:00 PM", max_length=160)
    supports_delivery: bool = True
    supports_pickup: bool = True
    delivery_fee: Decimal = Field(default=0, ge=0)


class PharmacyApplicationRead(PharmacyApplicationInput):
    id: str
    owner_user_id: str
    verification_status: VerificationStatus
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PharmacyPublic(ApiModel):
    id: str
    name: str
    verified: bool
    rating: float
    review_count: int
    address: str
    area: str
    distance_km: float = 0
    phone: str
    hours: str
    supports_delivery: bool
    supports_pickup: bool
    delivery_fee: float
    description: str


class LicenseInput(ApiModel):
    license_number: str = Field(min_length=3, max_length=120)
    issued_by: str = Field(min_length=2, max_length=200)
    issued_at: datetime | None = None
    expires_at: datetime | None = None
    document_url: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.issued_at and self.expires_at and self.expires_at <= self.issued_at:
            raise ValueError("expiresAt must be after issuedAt")
        return self


class LicenseRead(LicenseInput):
    id: str
    pharmacy_id: str
    created_at: datetime


class PharmacistInput(ApiModel):
    user_id: str
    license_number: str = Field(min_length=3, max_length=120)


class PharmacistRead(PharmacistInput):
    id: str
    pharmacy_id: str
    license_issued_by: str | None = None
    license_document_url: str | None = None
    verification_status: VerificationStatus
    is_active: bool
    created_at: datetime


class PharmacyVendorRegistrationInput(RegisterInput):
    pharmacy: PharmacyApplicationInput
    pharmacy_license: LicenseInput
    pharmacist_license_number: str = Field(min_length=3, max_length=120)
    pharmacist_license_issued_by: str = Field(min_length=2, max_length=200)
    pharmacist_license_document_url: str = Field(min_length=5, max_length=1000)

    @model_validator(mode="after")
    def require_pharmacy_document(self):
        if not self.pharmacy_license.document_url:
            raise ValueError("pharmacyLicense.documentUrl is required")
        return self


class PharmacistApplicationRead(ApiModel):
    id: str
    user_id: str
    pharmacy_id: str
    pharmacy_name: str
    first_name: str
    last_name: str
    email: EmailStr
    license_number: str
    license_issued_by: str | None = None
    license_document_url: str | None = None
    verification_status: VerificationStatus
    created_at: datetime


class VerificationDecisionInput(ApiModel):
    decision: VerificationStatus
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def reject_pending(self):
        if self.decision == VerificationStatus.PENDING:
            raise ValueError("A review decision cannot remain pending")
        return self


class VerificationQueueItem(ApiModel):
    pharmacy: PharmacyApplicationRead
    licenses: list[LicenseRead]
    pharmacist_in_charge: PharmacistApplicationRead | None = None


class VerificationRecordRead(ApiModel):
    id: str
    pharmacy_id: str | None = None
    pharmacist_id: str | None = None
    reviewer_id: str
    decision: VerificationStatus
    notes: str | None
    created_at: datetime
