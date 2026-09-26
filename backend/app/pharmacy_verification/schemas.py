"""Pydantic schemas for pharmacy verification and medication management."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Role(str, Enum):
    """Role names exposed to the OpenAPI contract."""

    PATIENT = "patient"
    PHARMACIST = "pharmacist"
    PHARMACY_STAFF = "pharmacy_staff"
    ADMIN = "admin"


class VerificationStatus(str, Enum):
    """Decision status for pharmacy verification records."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class MedicationFrequency(str, Enum):
    """Allowed medication schedule frequency values."""

    DAILY = "daily"
    TWICE_DAILY = "twice_daily"
    WEEKLY = "weekly"
    AS_NEEDED = "as_needed"


class PharmacyCreate(BaseModel):
    """Create a pharmacy listing."""

    name: str = Field(..., min_length=2, max_length=200)
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)
    country: str = Field(default="Nigeria", min_length=2, max_length=120)
    phone_number: str | None = Field(default=None, min_length=7, max_length=30)
    email: str | None = Field(default=None, max_length=255)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = "".join(ch for ch in value if ch.isdigit())
        if len(digits) < 7:
            raise ValueError("phone_number must contain at least 7 digits")
        return digits


class PharmacyUpdate(BaseModel):
    """Partial update schema for a pharmacy record."""

    name: str | None = Field(default=None, min_length=2, max_length=200)
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, min_length=2, max_length=120)
    phone_number: str | None = Field(default=None, min_length=7, max_length=30)
    email: str | None = Field(default=None, max_length=255)
    is_verified: bool | None = None
    is_active: bool | None = None


class PharmacyRead(BaseModel):
    """Pharmacy representation delivered to authenticated users."""

    id: str
    name: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str
    phone_number: str | None = None
    email: str | None = None
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PharmacistCreate(BaseModel):
    """Create a pharmacist profile for a pharmacy."""

    pharmacy_id: str
    user_id: str = Field(..., min_length=1, max_length=36)
    full_name: str = Field(..., min_length=2, max_length=200)
    license_number: str | None = Field(default=None, min_length=3, max_length=120)


class PharmacistRead(BaseModel):
    """Pharmacist profile returned to authorized roles."""

    id: str
    pharmacy_id: str
    user_id: str
    full_name: str
    license_number: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PharmacyLicenseCreate(BaseModel):
    """Create a pharmacy license record."""

    pharmacy_id: str
    license_number: str = Field(..., min_length=3, max_length=120)
    issued_by: str | None = Field(default=None, max_length=200)
    expires_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=1000)


class PharmacyLicenseRead(BaseModel):
    """License record returned by the API."""

    id: str
    pharmacy_id: str
    license_number: str
    issued_by: str | None = None
    issued_at: datetime
    expires_at: datetime | None = None
    status: VerificationStatus
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class VerificationRecordCreate(BaseModel):
    """Decision record written during verification review."""

    pharmacy_id: str | None = None
    pharmacist_id: str | None = None
    reviewer_id: str | None = Field(default=None, max_length=36)
    decision: VerificationStatus = VerificationStatus.PENDING
    notes: str | None = Field(default=None, max_length=1000)


class VerificationRecordRead(BaseModel):
    """Verification record response model."""

    id: str
    pharmacy_id: str | None = None
    pharmacist_id: str | None = None
    reviewer_id: str | None = None
    decision: VerificationStatus
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MedicationRecordCreate(BaseModel):
    """Create a medication record for a pharmacy catalog."""

    pharmacy_id: str
    pharmacist_id: str | None = None
    name: str = Field(..., min_length=2, max_length=200)
    generic_name: str | None = Field(default=None, max_length=200)
    dosage_form: str | None = Field(default=None, max_length=60)
    strength: str | None = Field(default=None, max_length=80)
    instructions: str | None = Field(default=None, max_length=1000)


class MedicationRecordUpdate(BaseModel):
    """Update an existing medication record."""

    name: str | None = Field(default=None, min_length=2, max_length=200)
    generic_name: str | None = Field(default=None, max_length=200)
    dosage_form: str | None = Field(default=None, max_length=60)
    strength: str | None = Field(default=None, max_length=80)
    instructions: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None


class MedicationRecordRead(BaseModel):
    """Medication catalog entry returned to the client."""

    id: str
    pharmacy_id: str
    pharmacist_id: str | None = None
    name: str
    generic_name: str | None = None
    dosage_form: str | None = None
    strength: str | None = None
    instructions: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MedicationScheduleCreate(BaseModel):
    """Create a medication schedule."""

    label: str = Field(..., min_length=2, max_length=200)
    frequency: MedicationFrequency = MedicationFrequency.DAILY
    time_of_day: str | None = Field(default=None, max_length=120)
    start_date: datetime | None = None
    end_date: datetime | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("end_date")
    @classmethod
    def validate_end_date(cls, value: datetime | None, info):
        start_date = info.data.get("start_date")
        if value is not None and start_date is not None and value < start_date:
            raise ValueError("end_date must be after start_date")
        return value


class MedicationScheduleRead(BaseModel):
    """Medication schedule response model."""

    id: str
    medication_id: str
    label: str
    frequency: MedicationFrequency
    time_of_day: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Generic acknowledgement payload for mutation endpoints."""

    message: str
