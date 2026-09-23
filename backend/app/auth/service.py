"""Business logic for onboarding, verification, passwords, and RBAC checks.

This service layer keeps database access and validation logic out of the router.
The router only brokers API I/O and delegates to these functions.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AuditLog, PatientProfile, PharmacyStaff, User, UserRole, VerificationPurpose, VerificationToken
from .schemas import LoginRequest, PasswordResetConfirm, PasswordResetRequest, PatientProfileCreate, PatientProfileRead, Role, TokenVerificationRequest, UserCreate, UserRead

AUTH_SECRET = os.getenv("AUTH_SECRET", "dev-secret-change-me")


def _encode_base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    """Hash a password with a per-password salt using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return base64.b64encode(salt + derived).decode("ascii")


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored salted hash."""
    try:
        blob = base64.b64decode(stored_hash.encode("ascii"))
        if len(blob) <= 16:
            return False
        salt = blob[:16]
        expected = blob[16:]
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
        return hmac.compare_digest(candidate, expected)
    except Exception:
        return False


def create_access_token(user: User) -> str:
    """Create a signed bearer token for the supplied user record."""
    payload = {
        "sub": user.id,
        "role": user.role.value,
        "exp": int(time.time()) + 3600,
    }
    header = _encode_base64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    body = _encode_base64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header}.{body}".encode("utf-8")
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header}.{body}.{_encode_base64url(signature)}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode a bearer token and validate its signature and expiry."""
    try:
        header_b64, body_b64, signature_b64 = token.split(".")
        expected_sig = _encode_base64url(
            hmac.new(AUTH_SECRET.encode("utf-8"), f"{header_b64}.{body_b64}".encode("utf-8"), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(signature_b64, expected_sig):
            return None
        payload = json.loads(_decode_base64url(body_b64).decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except (ValueError, json.JSONDecodeError):
        return None


def generate_token() -> str:
    """Generate a random one-time token for verification or password reset."""
    return secrets.token_urlsafe(24)


async def get_user_by_identifier(session: AsyncSession, user_id_or_email_or_phone: str) -> User | None:
    """Resolve a user by id, email, or phone number."""
    lookup = user_id_or_email_or_phone.strip()
    if not lookup:
        return None
    query = select(User).where((User.id == lookup) | (User.email == lookup) | (User.phone_number == lookup))
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_audit_log(
    session: AsyncSession,
    *,
    actor_id: str | None,
    entity_type: str,
    entity_id: str | None,
    action: str,
    details: str | None = None,
) -> AuditLog:
    """Persist an audit record for sensitive writes."""
    log = AuditLog(
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details,
    )
    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


async def register_user(session: AsyncSession, payload: UserCreate) -> User:
    """Create a new user account and attach the minimal role metadata."""
    normalized_email = payload.email.lower().strip()
    normalized_phone = payload.phone_number.strip()

    existing = await get_user_by_identifier(session, normalized_email)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    existing_phone = await session.execute(select(User).where(User.phone_number == normalized_phone))
    if existing_phone.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

    user = User(
        email=normalized_email,
        phone_number=normalized_phone,
        password_hash=hash_password(payload.password),
        role=UserRole(payload.role.value),
    )
    session.add(user)
    await session.flush()

    if user.role == UserRole.PATIENT:
        profile = PatientProfile(user_id=user.id, full_name="", date_of_birth=None)
        session.add(profile)
    elif user.role in {UserRole.PHARMACIST, UserRole.PHARMACY_STAFF}:
        session.add(PharmacyStaff(user_id=user.id, pharmacy_name="", license_number="", is_verified=False))

    await create_audit_log(
        session,
        actor_id=user.id,
        entity_type="user",
        entity_id=user.id,
        action="user_created",
        details=f"role={user.role.value}",
    )
    await session.commit()
    await session.refresh(user)
    return user


async def login_user(session: AsyncSession, payload: LoginRequest) -> dict[str, Any]:
    """Authenticate a user by email or phone and return an access token."""
    identifier = payload.email_or_phone.strip()
    user = await get_user_by_identifier(session, identifier)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    token = create_access_token(user)
    await create_audit_log(
        session,
        actor_id=user.id,
        entity_type="user",
        entity_id=user.id,
        action="login",
        details="successful login",
    )
    return {"access_token": token, "token_type": "bearer", "user": user}


async def create_verification_token(session: AsyncSession, user: User, purpose: VerificationPurpose) -> VerificationToken:
    """Create a one-time token for phone/email verification or reset activity."""
    key = generate_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    token = VerificationToken(user_id=user.id, token=key, purpose=purpose, expires_at=expires_at)
    session.add(token)
    await session.commit()
    await session.refresh(token)
    return token


async def verify_email_or_phone(
    session: AsyncSession,
    token_value: str,
    purpose: VerificationPurpose | str,
) -> User:
    """Consume a verification token and update the user's trust state."""
    if isinstance(purpose, str):
        purpose = VerificationPurpose(purpose)

    token_row = await session.execute(select(VerificationToken).where(VerificationToken.token == token_value))
    token = token_row.scalar_one_or_none()
    if token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification token not found")
    if token.purpose != purpose:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token purpose mismatch")
    if token.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token has already been used")
    if token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token expired")

    user = await get_user_by_identifier(session, token.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if purpose == VerificationPurpose.EMAIL:
        user.is_email_verified = True
    elif purpose == VerificationPurpose.PHONE:
        user.is_phone_verified = True

    token.used_at = datetime.now(timezone.utc)
    await create_audit_log(
        session,
        actor_id=user.id,
        entity_type="user",
        entity_id=user.id,
        action="verification_confirmed",
        details=f"purpose={purpose.value}",
    )
    await session.commit()
    await session.refresh(user)
    return user


async def request_password_reset(session: AsyncSession, payload: PasswordResetRequest) -> str:
    """Issue a password reset token for a valid account identifier."""
    user = await get_user_by_identifier(session, payload.email_or_phone)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    token = await create_verification_token(session, user, VerificationPurpose.PASSWORD_RESET)
    return token.token


async def reset_password(session: AsyncSession, payload: PasswordResetConfirm) -> User:
    """Consume a reset token and replace the user's password."""
    token_row = await session.execute(select(VerificationToken).where(VerificationToken.token == payload.token))
    token = token_row.scalar_one_or_none()
    if token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reset token not found")
    if token.purpose != VerificationPurpose.PASSWORD_RESET:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    if token.used_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token already used")
    if token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token expired")

    user = await get_user_by_identifier(session, token.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    token.used_at = datetime.now(timezone.utc)
    await create_audit_log(
        session,
        actor_id=user.id,
        entity_type="user",
        entity_id=user.id,
        action="password_reset",
        details="password reset completed",
    )
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_profile(session: AsyncSession, user: User) -> PatientProfile | None:
    """Fetch the profile attached to a patient; returns `None` if not yet created."""
    if user.role != UserRole.PATIENT:
        return None
    result = await session.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
    return result.scalar_one_or_none()


async def create_patient_profile(session: AsyncSession, user: User, payload: PatientProfileCreate) -> PatientProfile:
    """Create a patient profile for onboarding or existing patient account setup."""
    if user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only patients may create a patient profile")

    existing = await get_user_profile(session, user)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Patient profile already exists")

    profile = PatientProfile(user_id=user.id, **payload.model_dump())
    session.add(profile)
    await create_audit_log(
        session,
        actor_id=user.id,
        entity_type="patient_profile",
        entity_id=profile.id,
        action="patient_profile_created",
        details="created patient onboarding profile",
    )
    await session.commit()
    await session.refresh(profile)
    return profile


async def create_pharmacy_staff_profile(session: AsyncSession, user: User, payload: dict[str, str | None]) -> PharmacyStaff:
    """Create a pharmacy staff profile for pharmacist or pharmacy staff users."""
    if user.role not in {UserRole.PHARMACIST, UserRole.PHARMACY_STAFF}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not eligible for pharmacy staff metadata")

    existing = await session.execute(select(PharmacyStaff).where(PharmacyStaff.user_id == user.id))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Pharmacy staff profile already exists")

    profile = PharmacyStaff(user_id=user.id, **payload)
    session.add(profile)
    await create_audit_log(
        session,
        actor_id=user.id,
        entity_type="pharmacy_staff",
        entity_id=profile.id,
        action="pharmacy_staff_profile_created",
        details="created pharmacy staff profile",
    )
    await session.commit()
    await session.refresh(profile)
    return profile
