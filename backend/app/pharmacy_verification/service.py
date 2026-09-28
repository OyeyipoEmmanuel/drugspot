"""Transactional pharmacy onboarding and review workflows."""

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth.models import User, UserRole
from ..auth.service import hash_password, issue_session
from ..models import add_audit_log
from .models import Pharmacist, Pharmacy, PharmacyLicense, VerificationRecord, VerificationStatus
from .schemas import (
    LicenseInput,
    PharmacistInput,
    PharmacyApplicationInput,
    PharmacyVendorRegistrationInput,
    VerificationDecisionInput,
)


async def get_owned_pharmacy(session: AsyncSession, user_id: str) -> Pharmacy | None:
    return await session.scalar(select(Pharmacy).where(Pharmacy.owner_user_id == user_id))


async def create_application(session: AsyncSession, owner: User, payload: PharmacyApplicationInput) -> Pharmacy:
    if await get_owned_pharmacy(session, owner.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This account already owns a pharmacy")
    pharmacy = Pharmacy(owner_user_id=owner.id, **payload.model_dump(by_alias=False))
    session.add(pharmacy)
    owner.role = UserRole.PHARMACY_ADMIN
    await session.flush()
    add_audit_log(
        session,
        actor_id=owner.id,
        entity_type="pharmacy",
        entity_id=pharmacy.id,
        action="verification_submitted",
    )
    await session.commit()
    await session.refresh(pharmacy)
    return pharmacy


async def register_pharmacy_vendor(session: AsyncSession, payload: PharmacyVendorRegistrationInput) -> dict:
    email = payload.email.lower().strip()
    existing_user = await session.scalar(select(User).where(or_(User.email == email, User.phone == payload.phone)))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or phone is already registered")
    if await session.scalar(
        select(PharmacyLicense).where(PharmacyLicense.license_number == payload.pharmacy_license.license_number)
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Pharmacy licence is already registered")
    if await session.scalar(
        select(Pharmacist).where(Pharmacist.license_number == payload.pharmacist_license_number)
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Pharmacist licence is already registered")

    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=UserRole.PHARMACY_ADMIN,
        onboarding_complete=True,
    )
    session.add(user)
    await session.flush()
    pharmacy = Pharmacy(
        owner_user_id=user.id,
        is_active=False,
        **payload.pharmacy.model_dump(by_alias=False),
    )
    session.add(pharmacy)
    await session.flush()
    pharmacy_license = PharmacyLicense(
        pharmacy_id=pharmacy.id,
        **payload.pharmacy_license.model_dump(by_alias=False),
    )
    pharmacist = Pharmacist(
        pharmacy_id=pharmacy.id,
        user_id=user.id,
        license_number=payload.pharmacist_license_number,
        license_issued_by=payload.pharmacist_license_issued_by,
        license_document_url=payload.pharmacist_license_document_url,
        verification_status=VerificationStatus.PENDING,
        is_active=False,
    )
    session.add_all([pharmacy_license, pharmacist])
    await session.flush()
    add_audit_log(
        session,
        actor_id=user.id,
        entity_type="pharmacy",
        entity_id=pharmacy.id,
        action="vendor_verification_submitted",
    )
    return await issue_session(session, user)


async def add_license(session: AsyncSession, pharmacy: Pharmacy, actor: User, payload: LicenseInput) -> PharmacyLicense:
    existing = await session.scalar(
        select(PharmacyLicense).where(PharmacyLicense.license_number == payload.license_number)
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="License number is already registered")
    license_record = PharmacyLicense(pharmacy_id=pharmacy.id, **payload.model_dump(by_alias=False))
    session.add(license_record)
    await session.flush()
    add_audit_log(
        session,
        actor_id=actor.id,
        entity_type="pharmacy_license",
        entity_id=license_record.id,
        action="created",
    )
    await session.commit()
    await session.refresh(license_record)
    return license_record


async def add_pharmacist(
    session: AsyncSession, pharmacy: Pharmacy, actor: User, payload: PharmacistInput
) -> Pharmacist:
    user = await session.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == pharmacy.owner_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="The pharmacy owner cannot be added as a pharmacist"
        )
    if await session.scalar(select(Pharmacist).where(Pharmacist.user_id == user.id)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already linked to a pharmacy")
    pharmacist = Pharmacist(pharmacy_id=pharmacy.id, is_active=False, **payload.model_dump(by_alias=False))
    session.add(pharmacist)
    user.role = UserRole.PHARMACIST_APPLICANT
    await session.flush()
    add_audit_log(
        session,
        actor_id=actor.id,
        entity_type="pharmacist",
        entity_id=pharmacist.id,
        action="created",
    )
    await session.commit()
    await session.refresh(pharmacist)
    return pharmacist


async def get_pharmacist_application(session: AsyncSession, user_id: str) -> Pharmacist | None:
    return await session.scalar(
        select(Pharmacist)
        .options(selectinload(Pharmacist.pharmacy), selectinload(Pharmacist.user))
        .where(Pharmacist.user_id == user_id)
    )


def pharmacist_application_payload(pharmacist: Pharmacist) -> dict:
    return {
        "id": pharmacist.id,
        "user_id": pharmacist.user_id,
        "pharmacy_id": pharmacist.pharmacy_id,
        "pharmacy_name": pharmacist.pharmacy.name,
        "first_name": pharmacist.user.first_name,
        "last_name": pharmacist.user.last_name,
        "email": pharmacist.user.email,
        "license_number": pharmacist.license_number,
        "license_issued_by": pharmacist.license_issued_by,
        "license_document_url": pharmacist.license_document_url,
        "verification_status": pharmacist.verification_status,
        "created_at": pharmacist.created_at,
    }


async def public_pharmacies(session: AsyncSession) -> list[Pharmacy]:
    result = await session.scalars(
        select(Pharmacy)
        .where(
            Pharmacy.verification_status == VerificationStatus.APPROVED,
            Pharmacy.is_active.is_(True),
        )
        .order_by(Pharmacy.name)
    )
    return list(result.all())


async def public_pharmacy(session: AsyncSession, pharmacy_id: str) -> Pharmacy:
    pharmacy = await session.scalar(
        select(Pharmacy).where(
            Pharmacy.id == pharmacy_id,
            Pharmacy.verification_status == VerificationStatus.APPROVED,
            Pharmacy.is_active.is_(True),
        )
    )
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    return pharmacy


def to_public(pharmacy: Pharmacy) -> dict:
    return {
        "id": pharmacy.id,
        "name": pharmacy.name,
        "verified": pharmacy.verification_status == VerificationStatus.APPROVED,
        "rating": pharmacy.rating,
        "review_count": pharmacy.review_count,
        "address": pharmacy.address,
        "area": pharmacy.city,
        "distance_km": 0,
        "phone": pharmacy.phone,
        "hours": pharmacy.hours,
        "supports_delivery": pharmacy.supports_delivery,
        "supports_pickup": pharmacy.supports_pickup,
        "delivery_fee": float(pharmacy.delivery_fee),
        "description": pharmacy.description,
    }


async def verification_queue(session: AsyncSession) -> list[Pharmacy]:
    result = await session.scalars(
        select(Pharmacy)
        .options(
            selectinload(Pharmacy.licenses),
            selectinload(Pharmacy.pharmacists).selectinload(Pharmacist.user),
        )
        .where(Pharmacy.verification_status == VerificationStatus.PENDING)
        .order_by(Pharmacy.created_at)
    )
    return list(result.unique().all())


async def pharmacist_verification_queue(session: AsyncSession) -> list[Pharmacist]:
    result = await session.scalars(
        select(Pharmacist)
        .join(Pharmacy, Pharmacist.pharmacy_id == Pharmacy.id)
        .options(selectinload(Pharmacist.pharmacy), selectinload(Pharmacist.user))
        .where(
            Pharmacist.verification_status == VerificationStatus.PENDING,
            Pharmacist.user_id != Pharmacy.owner_user_id,
        )
        .order_by(Pharmacist.created_at)
    )
    return list(result.unique().all())


async def review_application(
    session: AsyncSession,
    pharmacy_id: str,
    reviewer: User,
    payload: VerificationDecisionInput,
) -> VerificationRecord:
    pharmacy = await session.get(Pharmacy, pharmacy_id)
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy not found")
    if payload.decision == VerificationStatus.APPROVED:
        has_license = await session.scalar(
            select(PharmacyLicense.id)
            .where(
                PharmacyLicense.pharmacy_id == pharmacy.id,
                PharmacyLicense.document_url.is_not(None),
            )
            .limit(1)
        )
        if not has_license:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pharmacy licence document is required before approval",
            )
        pharmacist = await session.scalar(
            select(Pharmacist).where(
                Pharmacist.pharmacy_id == pharmacy.id,
                Pharmacist.user_id == pharmacy.owner_user_id,
            )
        )
        if pharmacist is None or not pharmacist.license_document_url:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Pharmacist-in-charge credentials are required before approval",
            )
    pharmacy.verification_status = payload.decision
    pharmacy.is_active = payload.decision == VerificationStatus.APPROVED
    pharmacy_pharmacists = await session.scalars(select(Pharmacist).where(Pharmacist.pharmacy_id == pharmacy.id))
    for pharmacist in pharmacy_pharmacists:
        pharmacist.verification_status = payload.decision
        pharmacist.is_active = payload.decision == VerificationStatus.APPROVED
    record = VerificationRecord(
        pharmacy_id=pharmacy.id,
        reviewer_id=reviewer.id,
        decision=payload.decision,
        notes=payload.notes,
    )
    session.add(record)
    await session.flush()
    add_audit_log(
        session,
        actor_id=reviewer.id,
        entity_type="pharmacy",
        entity_id=pharmacy.id,
        action=f"verification_{payload.decision.value}",
        details=payload.notes,
    )
    await session.commit()
    await session.refresh(record)
    return record


async def review_pharmacist_application(
    session: AsyncSession,
    pharmacist_id: str,
    reviewer: User,
    payload: VerificationDecisionInput,
) -> VerificationRecord:
    pharmacist = await session.get(Pharmacist, pharmacist_id)
    if pharmacist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacist application not found")
    user = await session.get(User, pharmacist.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Applicant account not found")
    pharmacy = await session.get(Pharmacy, pharmacist.pharmacy_id)
    if pharmacy and pharmacy.owner_user_id == pharmacist.user_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Review the pharmacist-in-charge through the pharmacy vendor application",
        )
    pharmacist.verification_status = payload.decision
    pharmacist.is_active = payload.decision == VerificationStatus.APPROVED
    user.role = (
        UserRole.PHARMACIST if payload.decision == VerificationStatus.APPROVED else UserRole.PHARMACIST_APPLICANT
    )
    record = VerificationRecord(
        pharmacist_id=pharmacist.id,
        reviewer_id=reviewer.id,
        decision=payload.decision,
        notes=payload.notes,
    )
    session.add(record)
    await session.flush()
    add_audit_log(
        session,
        actor_id=reviewer.id,
        entity_type="pharmacist",
        entity_id=pharmacist.id,
        action=f"verification_{payload.decision.value}",
        details=payload.notes,
    )
    await session.commit()
    await session.refresh(record)
    return record
