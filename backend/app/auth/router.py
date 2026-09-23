"""FastAPI router for authentication, verification, password reset, and RBAC."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .deps import get_current_user, get_db, require_roles
from .models import PatientProfile, PharmacyStaff, User, UserRole, VerificationPurpose
from .schemas import (
    AuthToken,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    PatientProfileCreate,
    PatientProfileRead,
    PharmacyStaffCreate,
    PharmacyStaffRead,
    TokenVerificationRequest,
    UserCreate,
    UserRead,
)
from .service import (
    create_patient_profile,
    create_pharmacy_staff_profile,
    login_user,
    register_user,
    request_password_reset,
    reset_password,
    verify_email_or_phone,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register a user account",
    description=(
        "Create a new patient, pharmacist, pharmacy staff, or admin account. "
        "Every new account insert is audited through the service layer."
    ),
)
async def register_user_endpoint(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    """Register a new user account and return the persisted row."""
    return await register_user(db, payload)


@router.post(
    "/login",
    response_model=AuthToken,
    summary="Authenticate a user and return a bearer token",
    description="Login with an email or phone number and the password associated with the account.",
)
async def login_endpoint(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Authenticate a user and emit an access token."""
    return await login_user(db, payload)


@router.post(
    "/verify/email",
    response_model=UserRead,
    summary="Confirm an email verification token",
    description="Consume a one-time email verification token to mark the account as email verified.",
)
async def verify_email_endpoint(
    payload: TokenVerificationRequest,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Confirm an email verification token."""
    return await verify_email_or_phone(db, payload.token, purpose=VerificationPurpose.EMAIL)


@router.post(
    "/verify/phone",
    response_model=UserRead,
    summary="Confirm a phone verification token",
    description="Consume a one-time phone verification token to mark the account as phone verified.",
)
async def verify_phone_endpoint(
    payload: TokenVerificationRequest,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Confirm a phone verification token."""
    return await verify_email_or_phone(db, payload.token, purpose=VerificationPurpose.PHONE)


@router.post(
    "/request-password-reset",
    response_model=MessageResponse,
    summary="Request a password reset token",
    description="Issue a one-time password reset token when a user supplies a valid email or phone number.",
)
async def request_password_reset_endpoint(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Request a password reset token."""
    await request_password_reset(db, payload)
    return MessageResponse(message="Password reset token generated if the account exists.")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Complete a password reset",
    description="Consume a password reset token and replace the user's password with a new one.",
)
async def reset_password_endpoint(
    payload: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Set a new password from a valid reset token."""
    await reset_password(db, payload)
    return MessageResponse(message="Password reset successful")


@router.get(
    "/me",
    response_model=UserRead,
    summary="Fetch the authenticated user's account",
    description="Return the currently authenticated account. This endpoint clearly requires a logged-in user.",
)
async def me_endpoint(current_user: User = Depends(require_roles(UserRole.PATIENT, UserRole.PHARMACIST, UserRole.PHARMACY_STAFF, UserRole.ADMIN))) -> User:
    """Return the authenticated user profile."""
    return current_user


@router.get(
    "/admin-only",
    response_model=UserRead,
    summary="Administrative-only route",
    description="Example endpoint that enforces an admin-only RBAC guard.",
)
async def admin_only_endpoint(current_user: User = Depends(require_roles(UserRole.ADMIN))) -> User:
    """Return the admin user record after RBAC validation."""
    return current_user


@router.post(
    "/patients/profile",
    response_model=PatientProfileRead,
    summary="Create a patient profile",
    description="Attach a patient profile to a patient account. This is separate from the account record itself.",
)
async def patient_profile_endpoint(
    payload: PatientProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PATIENT)),
) -> PatientProfile:
    """Create a patient profile for the authenticated patient."""
    return await create_patient_profile(db, current_user, payload)


@router.post(
    "/pharmacy-staff/profile",
    response_model=PharmacyStaffRead,
    summary="Create a pharmacy staff profile",
    description="Attach pharmacy staff metadata to a pharmacist or pharmacy staff account.",
)
async def pharmacy_staff_profile_endpoint(
    payload: PharmacyStaffCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PHARMACIST, UserRole.PHARMACY_STAFF)),
) -> PharmacyStaff:
    """Create pharmacy staff metadata for the authenticated professional account."""
    return await create_pharmacy_staff_profile(db, current_user, payload.model_dump())


@router.post(
    "/demo/permission-check",
    response_model=UserRead,
    summary="RBAC guard demonstration",
    description="This route is intentionally restricted to pharmacists and admins to show explicit per-endpoint authorization.",
)
async def permission_demo_endpoint(
    current_user: User = Depends(require_roles(UserRole.PHARMACIST, UserRole.ADMIN)),
) -> User:
    """Return the current authorized user after RBAC enforcement."""
    return current_user
