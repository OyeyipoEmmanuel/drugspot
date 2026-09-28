"""Authentication, token, and onboarding business logic."""

import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import add_audit_log
from .models import PatientProfile, RefreshToken, User, UserRole, VerificationPurpose, VerificationToken
from .schemas import LoginInput, PatientProfileInput, RegisterInput

settings = get_settings()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 300_000)
    return base64.b64encode(salt + derived).decode()


def verify_password(password: str, encoded: str) -> bool:
    try:
        raw = base64.b64decode(encoded)
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), raw[:16], 300_000)
        return hmac.compare_digest(raw[16:], candidate)
    except Exception:
        return False


def create_access_token(user: User) -> str:
    header = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(
        json.dumps(
            {
                "sub": user.id,
                "role": user.role.value,
                "exp": int(time.time()) + settings.access_token_minutes * 60,
            },
            separators=(",", ":"),
        ).encode()
    )
    signature = _b64(hmac.new(settings.auth_secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{signature}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        header, payload, signature = token.split(".")
        expected = _b64(
            hmac.new(settings.auth_secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(signature, expected):
            return None
        decoded = json.loads(_unb64(payload))
        return decoded if decoded.get("exp", 0) >= int(time.time()) else None
    except (ValueError, json.JSONDecodeError):
        return None


def _is_expired(value: datetime) -> bool:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value <= datetime.now(UTC)


async def get_user_by_id(session: AsyncSession, user_id: str) -> User | None:
    return await session.get(User, user_id)


async def issue_session(session: AsyncSession, user: User) -> dict[str, Any]:
    raw_refresh = secrets.token_urlsafe(48)
    session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(raw_refresh),
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
        )
    )
    await session.commit()
    return {"access_token": create_access_token(user), "refresh_token": raw_refresh, "user": user}


async def register(session: AsyncSession, payload: RegisterInput) -> dict[str, Any]:
    email = payload.email.lower().strip()
    exists = await session.scalar(select(User).where(or_(User.email == email, User.phone == payload.phone)))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or phone is already registered")
    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.PATIENT,
    )
    session.add(user)
    await session.flush()
    session.add(PatientProfile(user_id=user.id))
    add_audit_log(session, actor_id=user.id, entity_type="user", entity_id=user.id, action="registered")
    return await issue_session(session, user)


async def login(session: AsyncSession, payload: LoginInput) -> dict[str, Any]:
    user = await session.scalar(select(User).where(User.email == payload.email.lower().strip()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    add_audit_log(session, actor_id=user.id, entity_type="user", entity_id=user.id, action="logged_in")
    return await issue_session(session, user)


async def refresh_session(session: AsyncSession, raw_token: str) -> dict[str, Any]:
    token = await session.scalar(select(RefreshToken).where(RefreshToken.token_hash == _hash_token(raw_token)))
    if token is None or token.revoked_at is not None or _is_expired(token.expires_at):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    user = await get_user_by_id(session, token.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is unavailable")
    token.revoked_at = datetime.now(UTC)
    return await issue_session(session, user)


async def logout(session: AsyncSession, raw_token: str) -> None:
    token = await session.scalar(select(RefreshToken).where(RefreshToken.token_hash == _hash_token(raw_token)))
    if token and token.revoked_at is None:
        token.revoked_at = datetime.now(UTC)
        await session.commit()


async def create_verification_token(session: AsyncSession, user: User, purpose: VerificationPurpose) -> str:
    raw = secrets.token_urlsafe(32)
    session.add(
        VerificationToken(
            user_id=user.id,
            token_hash=_hash_token(raw),
            purpose=purpose,
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
    )
    await session.commit()
    return raw


async def request_password_reset(session: AsyncSession, email: str) -> None:
    user = await session.scalar(select(User).where(User.email == email.lower().strip()))
    if user:
        await create_verification_token(session, user, VerificationPurpose.PASSWORD_RESET)


async def consume_verification_token(
    session: AsyncSession, raw: str, purpose: VerificationPurpose, new_password: str | None = None
) -> User:
    token = await session.scalar(
        select(VerificationToken).where(
            VerificationToken.token_hash == _hash_token(raw), VerificationToken.purpose == purpose
        )
    )
    if token is None or token.used_at is not None or _is_expired(token.expires_at):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    user = await get_user_by_id(session, token.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
    token.used_at = datetime.now(UTC)
    if purpose == VerificationPurpose.EMAIL:
        user.is_email_verified = True
    elif purpose == VerificationPurpose.PHONE:
        user.is_phone_verified = True
    elif purpose == VerificationPurpose.PASSWORD_RESET and new_password:
        user.password_hash = hash_password(new_password)
        now = datetime.now(UTC)
        refresh_tokens = await session.scalars(select(RefreshToken).where(RefreshToken.user_id == user.id))
        for refresh in refresh_tokens.all():
            refresh.revoked_at = now
    add_audit_log(session, actor_id=user.id, entity_type="user", entity_id=user.id, action=purpose.value)
    await session.commit()
    await session.refresh(user)
    return user


async def update_patient_profile(session: AsyncSession, user: User, payload: PatientProfileInput) -> PatientProfile:
    profile = await session.scalar(select(PatientProfile).where(PatientProfile.user_id == user.id))
    if profile is None:
        profile = PatientProfile(user_id=user.id)
        session.add(profile)
    for key, value in payload.model_dump(exclude_unset=True, by_alias=False).items():
        setattr(profile, key, value)
    await session.commit()
    await session.refresh(profile)
    return profile


async def complete_onboarding(session: AsyncSession, user: User) -> bool:
    user.onboarding_complete = True
    add_audit_log(session, actor_id=user.id, entity_type="user", entity_id=user.id, action="onboarding_completed")
    await session.commit()
    return True
