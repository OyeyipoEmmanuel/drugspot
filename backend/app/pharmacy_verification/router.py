"""FastAPI router for pharmacy verification and medication schedules."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from .deps import get_current_user, get_db, require_roles
from .models import MedicationRecord, MedicationSchedule, Pharmacy, PharmacyLicense, Pharmacist, VerificationRecord
from .schemas import (
    MedicationRecordCreate,
    MedicationRecordRead,
    MedicationRecordUpdate,
    MedicationScheduleCreate,
    MedicationScheduleRead,
    MessageResponse,
    PharmacyCreate,
    PharmacyLicenseCreate,
    PharmacyLicenseRead,
    PharmacyRead,
    PharmacyUpdate,
    PharmacistCreate,
    PharmacistRead,
    VerificationRecordCreate,
    VerificationRecordRead,
)
from .service import (
    create_medication_record,
    create_medication_schedule,
    create_pharmacist,
    create_pharmacy,
    create_pharmacy_license,
    create_verification_record,
    delete_medication_record,
    get_medication_record,
    get_pharmacy,
    list_medication_records,
    list_medication_schedules,
    list_pharmacies,
    list_pharmacists,
    update_medication_record,
    update_medication_schedule,
    update_pharmacy,
)

router = APIRouter(prefix="/pharmacy", tags=["pharmacy"])


@router.post(
    "/pharmacies",
    response_model=PharmacyRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a pharmacy record",
    description="Register a pharmacy in the marketplace catalog. This endpoint enforces explicit RBAC.",
)
async def create_pharmacy_endpoint(
    payload: PharmacyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("admin", "pharmacy_staff")),
) -> Pharmacy:
    """Create a new pharmacy record."""
    return await create_pharmacy(db, payload, actor_id=getattr(current_user, "id", None))


@router.get(
    "/pharmacies",
    response_model=list[PharmacyRead],
    summary="List pharmacies",
    description="Return all pharmacies visible to an authenticated user.",
)
async def list_pharmacies_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("patient", "pharmacist", "pharmacy_staff", "admin")),
) -> list[Pharmacy]:
    """List pharmacy records."""
    return await list_pharmacies(db)


@router.get(
    "/pharmacies/{pharmacy_id}",
    response_model=PharmacyRead,
    summary="Fetch a pharmacy",
    description="Return a single pharmacy record and its public merchant metadata.",
)
async def get_pharmacy_endpoint(
    pharmacy_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("patient", "pharmacist", "pharmacy_staff", "admin")),
) -> Pharmacy:
    """Fetch a single pharmacy record."""
    pharmacy = await get_pharmacy(db, pharmacy_id)
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    return pharmacy


@router.put(
    "/pharmacies/{pharmacy_id}",
    response_model=PharmacyRead,
    summary="Update a pharmacy",
    description="Update pharmacy metadata after identity and ownership checks.",
)
async def update_pharmacy_endpoint(
    pharmacy_id: str,
    payload: PharmacyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("admin", "pharmacy_staff")),
) -> Pharmacy:
    """Update a pharmacy record."""
    pharmacy = await get_pharmacy(db, pharmacy_id)
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    return await update_pharmacy(db, pharmacy, payload, actor_id=getattr(current_user, "id", None))


@router.post(
    "/pharmacists",
    response_model=PharmacistRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a pharmacist profile",
    description="Register a pharmacist for a pharmacy. This is a verification-related write that is audited.",
)
async def create_pharmacist_endpoint(
    payload: PharmacistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("admin", "pharmacist")),
) -> Pharmacist:
    """Create a pharmacist profile."""
    return await create_pharmacist(db, payload.model_dump(), actor_id=getattr(current_user, "id", None))


@router.get(
    "/pharmacists",
    response_model=list[PharmacistRead],
    summary="List pharmacists",
    description="Return pharmacist profile records for authorized users.",
)
async def list_pharmacists_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("patient", "pharmacist", "pharmacy_staff", "admin")),
) -> list[Pharmacist]:
    """List pharmacist profiles."""
    return await list_pharmacists(db)


@router.post(
    "/licenses",
    response_model=PharmacyLicenseRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a pharmacy license",
    description="Document a pharmacy license record prior to verification review.",
)
async def create_license_endpoint(
    payload: PharmacyLicenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("admin", "pharmacy_staff")),
) -> PharmacyLicense:
    """Create a pharmacy license record."""
    return await create_pharmacy_license(db, payload, actor_id=getattr(current_user, "id", None))


@router.post(
    "/verification-records",
    response_model=VerificationRecordRead,
    status_code=status.HTTP_201_CREATED,
    summary="Record a pharmacy verification decision",
    description="Persist the status of a pharmacy or pharmacist verification review as an audit-friendly record.",
)
async def create_verification_record_endpoint(
    payload: VerificationRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("admin")),
) -> VerificationRecord:
    """Persist a verification decision."""
    return await create_verification_record(db, payload, actor_id=getattr(current_user, "id", None))


@router.post(
    "/medications",
    response_model=MedicationRecordRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a medication record",
    description="Create a medication entry in the pharmacy catalog. This is a record-keeping action, not a diagnosis or dosage change.",
)
async def create_medication_endpoint(
    payload: MedicationRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("pharmacist", "pharmacy_staff", "admin")),
) -> MedicationRecord:
    """Create a medication record."""
    return await create_medication_record(db, payload, actor_id=getattr(current_user, "id", None))


@router.get(
    "/medications",
    response_model=list[MedicationRecordRead],
    summary="List medication records",
    description="Return medication records available to a given user role.",
)
async def list_medications_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("patient", "pharmacist", "pharmacy_staff", "admin")),
) -> list[MedicationRecord]:
    """List medication records."""
    return await list_medication_records(db)


@router.get(
    "/medications/{medication_id}",
    response_model=MedicationRecordRead,
    summary="Fetch a medication record",
    description="Return a single medication record by identifier.",
)
async def get_medication_endpoint(
    medication_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("patient", "pharmacist", "pharmacy_staff", "admin")),
) -> MedicationRecord:
    """Get a medication record by id."""
    medication = await get_medication_record(db, medication_id)
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication record not found")
    return medication


@router.put(
    "/medications/{medication_id}",
    response_model=MedicationRecordRead,
    summary="Update a medication record",
    description="Update medication metadata while avoiding automatic diagnosis or dosing changes.",
)
async def update_medication_endpoint(
    medication_id: str,
    payload: MedicationRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("pharmacist", "pharmacy_staff", "admin")),
) -> MedicationRecord:
    """Update a medication record."""
    medication = await get_medication_record(db, medication_id)
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication record not found")
    return await update_medication_record(db, medication, payload, actor_id=getattr(current_user, "id", None))


@router.delete(
    "/medications/{medication_id}",
    response_model=MessageResponse,
    summary="Disable a medication record",
    description="Soft-disable a medication record instead of deleting it, keeping the audit trail intact.",
)
async def delete_medication_endpoint(
    medication_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("pharmacist", "pharmacy_staff", "admin")),
) -> MessageResponse:
    """Disable a medication record."""
    medication = await get_medication_record(db, medication_id)
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication record not found")
    await delete_medication_record(db, medication, actor_id=getattr(current_user, "id", None))
    return MessageResponse(message="Medication record disabled")


@router.post(
    "/medications/{medication_id}/schedules",
    response_model=MedicationScheduleRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a medication schedule",
    description="Add a medication schedule that records reminders or administration windows without prescribing treatment.",
)
async def create_schedule_endpoint(
    medication_id: str,
    payload: MedicationScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("pharmacist", "pharmacy_staff", "admin")),
) -> MedicationSchedule:
    """Create a schedule attached to a medication record."""
    medication = await get_medication_record(db, medication_id)
    if medication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication record not found")
    return await create_medication_schedule(db, medication, payload, actor_id=getattr(current_user, "id", None))


@router.get(
    "/medications/{medication_id}/schedules",
    response_model=list[MedicationScheduleRead],
    summary="List medication schedules",
    description="Return all schedules associated with a medication record.",
)
async def list_schedules_endpoint(
    medication_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("patient", "pharmacist", "pharmacy_staff", "admin")),
) -> list[MedicationSchedule]:
    """List schedules for a medication."""
    return await list_medication_schedules(db, medication_id)


@router.put(
    "/medications/{medication_id}/schedules/{schedule_id}",
    response_model=MedicationScheduleRead,
    summary="Update a medication schedule",
    description="Adjust schedule timing metadata without altering the underlying medication order.",
)
async def update_schedule_endpoint(
    medication_id: str,
    schedule_id: str,
    payload: MedicationScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: object = Depends(require_roles("pharmacist", "pharmacy_staff", "admin")),
) -> MedicationSchedule:
    """Update a medication schedule."""
    schedules = await list_medication_schedules(db, medication_id)
    schedule = next((item for item in schedules if item.id == schedule_id), None)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication schedule not found")
    return await update_medication_schedule(db, schedule, payload, actor_id=getattr(current_user, "id", None))
