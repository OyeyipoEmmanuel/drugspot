"""Frontend-compatible authentication schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .models import UserRole


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(word.capitalize() for word in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
        extra="forbid",
    )


class RegisterInput(ApiModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        prefix = "+" if value.strip().startswith("+") else ""
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) < 7:
            raise ValueError("phone must contain at least 7 digits")
        return prefix + digits


class LoginInput(ApiModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(ApiModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: UserRole
    onboarding_complete: bool
    is_email_verified: bool
    is_phone_verified: bool
    created_at: datetime


class AuthSession(ApiModel):
    access_token: str
    refresh_token: str
    user: UserRead


class RefreshInput(ApiModel):
    refresh_token: str = Field(min_length=20, max_length=512)


class LogoutInput(ApiModel):
    refresh_token: str = Field(min_length=20, max_length=512)


class ForgotPasswordInput(ApiModel):
    email: EmailStr


class ResetPasswordInput(ApiModel):
    token: str = Field(min_length=20, max_length=512)
    new_password: str = Field(min_length=8, max_length=128)


class VerifyTokenInput(ApiModel):
    token: str = Field(min_length=20, max_length=512)


class PatientProfileInput(ApiModel):
    date_of_birth: str | None = Field(default=None, max_length=20)
    gender: str | None = Field(default=None, max_length=30)
    emergency_contact_name: str | None = Field(default=None, max_length=200)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)
    allergies: str | None = Field(default=None, max_length=2000)
    chronic_conditions: str | None = Field(default=None, max_length=2000)


class PatientProfileRead(PatientProfileInput):
    id: str
    user_id: str


class MessageResponse(ApiModel):
    message: str


class OnboardingResponse(ApiModel):
    onboarding_complete: bool
