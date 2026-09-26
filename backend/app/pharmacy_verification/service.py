"""Service layer for pharmacy verification and medication schedule workflows."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    AccessRole,
    AuditLog,
    MedicationFrequency,
    MedicationRecord,
    MedicationSchedule,
    Pharmacy,
    PharmacyLicense,
    Pharmacist,
    VerificationRecord,
    VerificationStatus,
)
from .schemas import (
    MedicationRecordCreate,
    MedicationRecordUpdate,
    MedicationScheduleCreate,
    PharmacyCreate,
    PharmacyLicenseCreate,
    PharmacyUpdate,
    VerificationRecordCreate,
)


async def create_audit_log(
    session: AsyncSession,
    *,
    actor_id: str | None,
    entity_type: str,
    entity_id: str | None,
    action: str,
    details: str | None = None,
) -> AuditLog:
    """Write an immutable audit row for sensitive pharmacy and medication actions."""
    row = AuditLog(
        actor_id=actor_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def create_pharmacy(session: AsyncSession, payload: PharmacyCreate, actor_id: str | None = None) -> Pharmacy:
    """Create a new pharmacy and write an audit row for the creation event."""
    pharmacy = Pharmacy(
        name=payload.name.strip(),
        address=payload.address.strip() if payload.address else None,
        city=payload.city.strip() if payload.city else None,
        state=payload.state.strip() if payload.state else None,
        country=payload.country.strip() if payload.country else "Nigeria",
        phone_number=payload.phone_number,
        email=payload.email.lower() if payload.email else None,
    )
    session.add(pharmacy)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="pharmacy",
        entity_id=pharmacy.id,
        action="pharmacy_created",
        details=f"pharmacy_name={pharmacy.name}",
    )
    await session.commit()
    await session.refresh(pharmacy)
    return pharmacy


async def list_pharmacies(session: AsyncSession) -> list[Pharmacy]:
    """Return all pharmacy records in insertion order."""
    result = await session.execute(select(Pharmacy).order_by(Pharmacy.created_at.desc()))
    return list(result.scalars().all())


async def get_pharmacy(session: AsyncSession, pharmacy_id: str) -> Pharmacy | None:
    """Fetch a pharmacy by its identifier."""
    result = await session.execute(select(Pharmacy).where(Pharmacy.id == pharmacy_id))
    return result.scalar_one_or_none()


async def update_pharmacy(
    session: AsyncSession,
    pharmacy: Pharmacy,
    payload: PharmacyUpdate,
    actor_id: str | None = None,
) -> Pharmacy:
    """Apply a partial pharmacy update and persist an audit row."""
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(pharmacy, key, value)
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="pharmacy",
        entity_id=pharmacy.id,
        action="pharmacy_updated",
        details=str(changes),
    )
    await session.commit()
    await session.refresh(pharmacy)
    return pharmacy


async def create_pharmacist(
    session: AsyncSession,
    payload: dict[str, str],
    actor_id: str | None = None,
) -> Pharmacist:
    """Create a pharmacist profile attached to a pharmacy."""
    if not payload.get("pharmacy_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="pharmacy_id is required")

    pharmacist = Pharmacist(**payload)
    session.add(pharmacist)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="pharmacist",
        entity_id=pharmacist.id,
        action="pharmacist_created",
        details=f"pharmacy_id={pharmacist.pharmacy_id}",
    )
    await session.commit()
    await session.refresh(pharmacist)
    return pharmacist


async def list_pharmacists(session: AsyncSession) -> list[Pharmacist]:
    """Return all pharmacist profiles."""
    result = await session.execute(select(Pharmacist).order_by(Pharmacist.created_at.desc()))
    return list(result.scalars().all())


async def create_pharmacy_license(
    session: AsyncSession,
    payload: PharmacyLicenseCreate,
    actor_id: str | None = None,
) -> PharmacyLicense:
    """Create a pharmacy license record."""
    if not payload.license_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="license_number is required")

    license = PharmacyLicense(
        pharmacy_id=payload.pharmacy_id,
        license_number=payload.license_number,
        issued_by=payload.issued_by,
        expires_at=payload.expires_at,
        notes=payload.notes,
    )
    session.add(license)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="pharmacy_license",
        entity_id=license.id,
        action="pharmacy_license_created",
        details=f"license_number={license.license_number}",
    )
    await session.commit()
    await session.refresh(license)
    return license


async def create_verification_record(
    session: AsyncSession,
    payload: VerificationRecordCreate,
    actor_id: str | None = None,
) -> VerificationRecord:
    """Persist a verification decision and log the change."""
    decision = VerificationRecord(
        pharmacy_id=payload.pharmacy_id,
        pharmacist_id=payload.pharmacist_id,
        reviewer_id=payload.reviewer_id,
        decision=payload.decision,
        notes=payload.notes,
    )
    session.add(decision)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="verification_record",
        entity_id=decision.id,
        action="verification_recorded",
        details=f"decision={decision.decision.value}",
    )
    await session.commit()
    await session.refresh(decision)
    return decision


async def create_medication_record(
    session: AsyncSession,
    payload: MedicationRecordCreate,
    actor_id: str | None = None,
) -> MedicationRecord:
    """Create a medication catalog entry; no diagnosis or dosing logic is generated."""
    medication = MedicationRecord(
        pharmacy_id=payload.pharmacy_id,
        pharmacist_id=payload.pharmacist_id,
        name=payload.name.strip(),
        generic_name=payload.generic_name.strip() if payload.generic_name else None,
        dosage_form=payload.dosage_form.strip() if payload.dosage_form else None,
        strength=payload.strength.strip() if payload.strength else None,
        instructions=payload.instructions.strip() if payload.instructions else None,
    )
    session.add(medication)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="medication_record",
        entity_id=medication.id,
        action="medication_record_created",
        details=f"name={medication.name}",
    )
    await session.commit()
    await session.refresh(medication)
    return medication


async def get_medication_record(session: AsyncSession, medication_id: str) -> MedicationRecord | None:
    """Fetch a medication record by identifier."""
    result = await session.execute(select(MedicationRecord).where(MedicationRecord.id == medication_id))
    return result.scalar_one_or_none()


async def list_medication_records(session: AsyncSession) -> list[MedicationRecord]:
    """Return medication records ordered by most recently updated first."""
    result = await session.execute(select(MedicationRecord).order_by(MedicationRecord.updated_at.desc()))
    return list(result.scalars().all())


async def update_medication_record(
    session: AsyncSession,
    medication: MedicationRecord,
    payload: MedicationRecordUpdate,
    actor_id: str | None = None,
) -> MedicationRecord:
    """Update medication metadata without altering dosage or diagnosis logic."""
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(medication, key, value)
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="medication_record",
        entity_id=medication.id,
        action="medication_record_updated",
        details=str(changes),
    )
    await session.commit()
    await session.refresh(medication)
    return medication


async def delete_medication_record(session: AsyncSession, medication: MedicationRecord, actor_id: str | None = None) -> None:
    """Soft-disable a medication record instead of deleting it."""
    medication.is_active = False
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="medication_record",
        entity_id=medication.id,
        action="medication_record_disabled",
        details="record marked inactive",
    )
    await session.commit()


async def create_medication_schedule(
    session: AsyncSession,
    medication: MedicationRecord,
    payload: MedicationScheduleCreate,
    actor_id: str | None = None,
) -> MedicationSchedule:
    """Create a schedule for a medication record without prescribing or adjusting therapy."""
    if payload.frequency not in {MedicationFrequency.DAILY, MedicationFrequency.TWICE_DAILY, MedicationFrequency.WEEKLY, MedicationFrequency.AS_NEEDED}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported medication frequency")

    schedule = MedicationSchedule(
        medication_id=medication.id,
        label=payload.label.strip(),
        frequency=payload.frequency,
        time_of_day=payload.time_of_day.strip() if payload.time_of_day else None,
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes.strip() if payload.notes else None,
    )
    session.add(schedule)
    await session.flush()
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="medication_schedule",
        entity_id=schedule.id,
        action="medication_schedule_created",
        details=f"label={schedule.label}",
    )
    await session.commit()
    await session.refresh(schedule)
    return schedule


async def list_medication_schedules(session: AsyncSession, medication_id: str) -> list[MedicationSchedule]:
    """Return all schedules associated with a medication record."""
    result = await session.execute(select(MedicationSchedule).where(MedicationSchedule.medication_id == medication_id).order_by(MedicationSchedule.created_at.desc()))
    return list(result.scalars().all())


async def update_medication_schedule(
    session: AsyncSession,
    schedule: MedicationSchedule,
    payload: MedicationScheduleCreate,
    actor_id: str | None = None,
) -> MedicationSchedule:
    """Update schedule metadata and keep a record of the change."""
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(schedule, key, value)
    await create_audit_log(
        session,
        actor_id=actor_id,
        entity_type="medication_schedule",
        entity_id=schedule.id,
        action="medication_schedule_updated",
        details=str(changes),
    )
    await session.commit()
    await session.refresh(schedule)
    return schedule
