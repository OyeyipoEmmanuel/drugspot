"""Validated request and response schemas for auth and RBAC workflows."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Role(str, Enum):
    """Public role enum used by API schemas."""

    PATIENT = "patient"
    PHARMACIST = "pharmacist"
    PHARMACY_STAFF = "pharmacy_staff"
    ADMIN = "admin"


class UserCreate(BaseModel):
    """Schema used when creating a new application account."""

    email: EmailStr
    phone_number: str = Field(..., min_length=7, max_length=30)
    password: str = Field(..., min_length=8, max_length=128)
    role: Role = Role.PATIENT

    @field_validator("phone_number")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        digits = "".join(ch for ch in value if ch.isdigit())
        if len(digits) < 7:
            raise ValueError("phone_number must contain at least 7 digits")
        return digits


class UserUpdate(BaseModel):
    """Partial update schema for a user account."""

    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, min_length=7, max_length=30)
    role: Role | None = None
    is_active: bool | None = None

    @field_validator("phone_number")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        digits = "".join(ch for ch in value if ch.isdigit())
        if len(digits) < 7:
            raise ValueError("phone_number must contain at least 7 digits")
        return digits


class UserRead(BaseModel):
    """Public account data returned to authenticated callers."""

    id: str
    email: EmailStr
    phone_number: str | None
    role: Role
    is_active: bool
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    """Credentials accepted by the login endpoint."""

    email_or_phone: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)


class TokenVerificationRequest(BaseModel):
    """A verification token supplied by the user or pharmacist."""

    token: str = Field(..., min_length=10, max_length=512)


class PasswordResetRequest(BaseModel):
    """Request a password reset link or token by email or phone number."""

    email_or_phone: str = Field(..., min_length=3, max_length=255)


class PasswordResetConfirm(BaseModel):
    """Complete a password reset with a one-time token."""

    token: str = Field(..., min_length=10, max_length=512)
    new_password: str = Field(..., min_length=8, max_length=128)


class PatientProfileCreate(BaseModel):
    """Create a patient profile during onboarding."""

    full_name: str = Field(..., min_length=2, max_length=200)
    date_of_birth: str | None = Field(default=None, min_length=8, max_length=20)
    gender: str | None = Field(default=None, max_length=30)
    emergency_contact_name: str | None = Field(default=None, max_length=200)
    emergency_contact_phone: str | None = Field(default=None, min_length=7, max_length=30)
    allergies: str | None = Field(default=None, max_length=500)
    chronic_conditions: str | None = Field(default=None, max_length=500)


class PatientProfileRead(BaseModel):
    """Patient profile representation for authenticated callers."""

    id: str
    user_id: str
    full_name: str
    date_of_birth: str | None = None
    gender: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PharmacyStaffCreate(BaseModel):
    """Create an attached pharmacist or pharmacy staff record."""

    pharmacy_name: str | None = Field(default=None, max_length=200)
    license_number: str | None = Field(default=None, max_length=120)


class PharmacyStaffRead(BaseModel):
    """Pharmacy staff metadata returned to authorized parties."""

    id: str
    user_id: str
    pharmacy_name: str | None = None
    license_number: str | None = None
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class AuthToken(BaseModel):
    """Access token payload for a successful login."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead


class MessageResponse(BaseModel):
    """Simple acknowledgement payload used by reset and verification flows."""

    message: str
