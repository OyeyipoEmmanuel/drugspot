"""Authentication API matching the React frontend contract."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from .deps import get_current_user, require_roles
from .models import User, UserRole, VerificationPurpose
from .schemas import (
    AuthSession,
    ForgotPasswordInput,
    LoginInput,
    LogoutInput,
    MessageResponse,
    OnboardingResponse,
    PatientProfileInput,
    PatientProfileRead,
    RefreshInput,
    RegisterInput,
    ResetPasswordInput,
    UserRead,
    VerifyTokenInput,
)
from .service import (
    complete_onboarding,
    consume_verification_token,
    login,
    logout,
    refresh_session,
    register,
    request_password_reset,
    update_patient_profile,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register/", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
async def register_endpoint(payload: RegisterInput, db: AsyncSession = Depends(get_db)):
    return await register(db, payload)


@router.post("/login/", response_model=AuthSession)
async def login_endpoint(payload: LoginInput, db: AsyncSession = Depends(get_db)):
    return await login(db, payload)


@router.post("/token/refresh/", response_model=AuthSession)
async def refresh_endpoint(payload: RefreshInput, db: AsyncSession = Depends(get_db)):
    return await refresh_session(db, payload.refresh_token)


@router.post("/logout/", response_model=MessageResponse)
async def logout_endpoint(payload: LogoutInput, db: AsyncSession = Depends(get_db)):
    await logout(db, payload.refresh_token)
    return MessageResponse(message="Signed out")


@router.get("/profile/", response_model=UserRead)
async def profile_endpoint(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile/patient/", response_model=PatientProfileRead)
async def update_profile_endpoint(
    payload: PatientProfileInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PATIENT)),
):
    return await update_patient_profile(db, current_user, payload)


@router.post("/onboarding/complete/", response_model=OnboardingResponse)
async def onboarding_endpoint(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return OnboardingResponse(onboarding_complete=await complete_onboarding(db, current_user))


@router.post("/password/forgot/", response_model=MessageResponse)
async def forgot_password_endpoint(payload: ForgotPasswordInput, db: AsyncSession = Depends(get_db)):
    await request_password_reset(db, payload.email)
    return MessageResponse(message="If the account exists, reset instructions will be sent")


@router.post("/password/reset/", response_model=MessageResponse)
async def reset_password_endpoint(payload: ResetPasswordInput, db: AsyncSession = Depends(get_db)):
    await consume_verification_token(db, payload.token, VerificationPurpose.PASSWORD_RESET, payload.new_password)
    return MessageResponse(message="Password reset successful")


@router.post("/verify/email/", response_model=UserRead)
async def verify_email_endpoint(payload: VerifyTokenInput, db: AsyncSession = Depends(get_db)):
    return await consume_verification_token(db, payload.token, VerificationPurpose.EMAIL)


@router.post("/verify/phone/", response_model=UserRead)
async def verify_phone_endpoint(payload: VerifyTokenInput, db: AsyncSession = Depends(get_db)):
    return await consume_verification_token(db, payload.token, VerificationPurpose.PHONE)


@router.get("/admin-only/", response_model=UserRead)
async def admin_only_endpoint(current_user: User = Depends(require_roles(UserRole.PLATFORM_ADMIN))):
    return current_user
