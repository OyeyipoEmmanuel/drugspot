"""Public pharmacy, pharmacy workspace, and platform review routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.deps import require_roles
from ..auth.models import User, UserRole
from ..auth.schemas import AuthSession
from ..database import get_db
from .schemas import (
    LicenseInput,
    LicenseRead,
    PharmacistApplicationRead,
    PharmacistInput,
    PharmacistRead,
    PharmacyApplicationInput,
    PharmacyApplicationRead,
    PharmacyPublic,
    PharmacyVendorRegistrationInput,
    VerificationDecisionInput,
    VerificationQueueItem,
    VerificationRecordRead,
)
from .service import (
    add_license,
    add_pharmacist,
    create_application,
    get_owned_pharmacy,
    get_pharmacist_application,
    pharmacist_application_payload,
    pharmacist_verification_queue,
    public_pharmacies,
    public_pharmacy,
    register_pharmacy_vendor,
    review_application,
    review_pharmacist_application,
    to_public,
    verification_queue,
)

public_router = APIRouter(prefix="/pharmacies", tags=["pharmacies"])
pharmacy_router = APIRouter(prefix="/pharmacy", tags=["pharmacy workspace"])
admin_router = APIRouter(prefix="/admin", tags=["platform administration"])
professional_router = APIRouter(prefix="/pharmacists", tags=["pharmacists"])


@public_router.get("/", response_model=list[PharmacyPublic])
async def list_public_pharmacies(db: AsyncSession = Depends(get_db)):
    return [to_public(item) for item in await public_pharmacies(db)]


@public_router.get("/{pharmacy_id}/", response_model=PharmacyPublic)
async def get_public_pharmacy(pharmacy_id: str, db: AsyncSession = Depends(get_db)):
    return to_public(await public_pharmacy(db, pharmacy_id))


@professional_router.get("/application/", response_model=PharmacistApplicationRead)
async def own_pharmacist_application(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PHARMACIST_APPLICANT, UserRole.PHARMACIST)),
):
    application = await get_pharmacist_application(db, current_user.id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacist application not found")
    return pharmacist_application_payload(application)


@pharmacy_router.post("/register/", response_model=AuthSession, status_code=status.HTTP_201_CREATED)
async def register_vendor(payload: PharmacyVendorRegistrationInput, db: AsyncSession = Depends(get_db)):
    return await register_pharmacy_vendor(db, payload)


@pharmacy_router.post("/applications/", response_model=PharmacyApplicationRead, status_code=status.HTTP_201_CREATED)
async def submit_application(
    payload: PharmacyApplicationInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PATIENT, UserRole.PHARMACY_ADMIN)),
):
    return await create_application(db, current_user, payload)


@pharmacy_router.get("/application/", response_model=PharmacyApplicationRead)
async def own_application(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PHARMACY_ADMIN)),
):
    pharmacy = await get_owned_pharmacy(db, current_user.id)
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy application not found")
    return pharmacy


@pharmacy_router.post("/licenses/", response_model=LicenseRead, status_code=status.HTTP_201_CREATED)
async def create_license(
    payload: LicenseInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PHARMACY_ADMIN)),
):
    pharmacy = await get_owned_pharmacy(db, current_user.id)
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy application not found")
    return await add_license(db, pharmacy, current_user, payload)


@pharmacy_router.post("/pharmacists/", response_model=PharmacistRead, status_code=status.HTTP_201_CREATED)
async def create_pharmacist(
    payload: PharmacistInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PHARMACY_ADMIN)),
):
    pharmacy = await get_owned_pharmacy(db, current_user.id)
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy application not found")
    return await add_pharmacist(db, pharmacy, current_user, payload)


@admin_router.get("/verifications/", response_model=list[VerificationQueueItem])
async def list_verifications(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    return [
        {
            "pharmacy": pharmacy,
            "licenses": pharmacy.licenses,
            "pharmacist_in_charge": pharmacist_application_payload(
                next(
                    (item for item in pharmacy.pharmacists if item.user_id == pharmacy.owner_user_id),
                    pharmacy.pharmacists[0],
                )
            )
            if pharmacy.pharmacists
            else None,
        }
        for pharmacy in await verification_queue(db)
    ]


@admin_router.patch("/verifications/{pharmacy_id}/", response_model=VerificationRecordRead)
async def decide_verification(
    pharmacy_id: str,
    payload: VerificationDecisionInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    return await review_application(db, pharmacy_id, current_user, payload)


@admin_router.get("/pharmacist-verifications/", response_model=list[PharmacistApplicationRead])
async def list_pharmacist_verifications(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    return [pharmacist_application_payload(item) for item in await pharmacist_verification_queue(db)]


@admin_router.patch("/pharmacist-verifications/{pharmacist_id}/", response_model=VerificationRecordRead)
async def decide_pharmacist_verification(
    pharmacist_id: str,
    payload: VerificationDecisionInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    return await review_pharmacist_application(db, pharmacist_id, current_user, payload)
