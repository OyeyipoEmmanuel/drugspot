"""Live medication tracking, pharmacist directory, and conversation APIs."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth.deps import get_current_user, require_roles
from ..auth.models import User, UserRole
from ..commerce.service import workspace_pharmacy
from ..database import get_db
from ..pharmacy_verification.models import Pharmacist, Pharmacy, VerificationStatus
from .models import AdherenceEvent, AdherenceStatus, Conversation, ConversationMessage, ConversationStatus, Medication
from .schemas import AdherenceInput, MedicationInput, SendMessageInput, StartConversationInput

router = APIRouter(tags=["patient care"])


def medication_payload(item: Medication) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "strength": item.strength,
        "form": item.form,
        "instructions": item.instructions,
        "frequency": item.frequency,
        "startDate": item.start_date,
        "endDate": item.end_date,
        "remainingDoses": item.remaining_doses,
        "status": item.status,
        "schedules": [{"id": row.id, "time": row.time, "label": row.label} for row in item.schedules],
        "adherence": [
            {
                "id": row.id,
                "status": row.status,
                "scheduledAt": row.scheduled_at,
                "recordedAt": row.recorded_at,
            }
            for row in sorted(item.adherence, key=lambda row: row.recorded_at, reverse=True)
        ],
    }


async def patient_medication(db: AsyncSession, medication_id: str, patient_id: str) -> Medication:
    item = await db.scalar(
        select(Medication)
        .options(selectinload(Medication.schedules), selectinload(Medication.adherence))
        .where(Medication.id == medication_id, Medication.patient_user_id == patient_id)
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    return item


@router.get("/medications/")
async def medications(
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    items = list(
        (
            await db.scalars(
                select(Medication)
                .options(selectinload(Medication.schedules), selectinload(Medication.adherence))
                .where(Medication.patient_user_id == patient.id)
                .order_by(Medication.created_at.desc())
            )
        ).all()
    )
    return [medication_payload(item) for item in items]


@router.post("/medications/", status_code=status.HTTP_201_CREATED)
async def create_medication(
    payload: MedicationInput,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="End date must follow start date")
    data = payload.model_dump(by_alias=False, exclude={"schedule_times"})
    from .models import MedicationSchedule

    item = Medication(
        patient_user_id=patient.id,
        schedules=[MedicationSchedule(time=value, label="Dose reminder") for value in payload.schedule_times],
        **data,
    )
    db.add(item)
    await db.commit()
    return medication_payload(await patient_medication(db, item.id, patient.id))


@router.get("/medications/{medication_id}/")
async def medication_detail(
    medication_id: str,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    return medication_payload(await patient_medication(db, medication_id, patient.id))


@router.patch("/medications/{medication_id}/")
async def update_medication(
    medication_id: str,
    payload: MedicationInput,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    item = await patient_medication(db, medication_id, patient.id)
    for key, value in payload.model_dump(by_alias=False, exclude={"schedule_times"}).items():
        setattr(item, key, value)
    from .models import MedicationSchedule

    item.schedules = [MedicationSchedule(time=value, label="Dose reminder") for value in payload.schedule_times]
    await db.commit()
    return medication_payload(await patient_medication(db, item.id, patient.id))


@router.post("/medications/{medication_id}/adherence/")
async def record_adherence(
    medication_id: str,
    payload: AdherenceInput,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    item = await patient_medication(db, medication_id, patient.id)
    now = datetime.now(UTC)
    item.adherence.append(AdherenceEvent(status=payload.status, scheduled_at=now, recorded_at=now))
    if payload.status == AdherenceStatus.TAKEN:
        item.remaining_doses = max(0, item.remaining_doses - 1)
    await db.commit()
    return medication_payload(await patient_medication(db, item.id, patient.id))


def pharmacist_payload(profile: Pharmacist) -> dict:
    return {
        "id": profile.id,
        "firstName": profile.user.first_name,
        "lastName": profile.user.last_name,
        "title": "Licensed Pharmacist",
        "registrationNumber": profile.license_number,
        "pharmacyId": profile.pharmacy_id,
        "pharmacyName": profile.pharmacy.name,
        "pharmacyLocation": f"{profile.pharmacy.city}, {profile.pharmacy.state}",
        "verified": profile.verification_status == VerificationStatus.APPROVED,
        "availability": "available" if profile.is_active else "offline",
        "specialties": [],
        "languages": [],
        "rating": profile.pharmacy.rating,
        "responseTimeMinutes": 0,
        "bio": "",
    }


async def approved_pharmacists(db: AsyncSession) -> list[Pharmacist]:
    return list(
        (
            await db.scalars(
                select(Pharmacist)
                .options(selectinload(Pharmacist.user), selectinload(Pharmacist.pharmacy))
                .join(Pharmacy, Pharmacist.pharmacy_id == Pharmacy.id)
                .where(
                    Pharmacist.verification_status == VerificationStatus.APPROVED,
                    Pharmacist.is_active.is_(True),
                    Pharmacy.verification_status == VerificationStatus.APPROVED,
                    Pharmacy.is_active.is_(True),
                )
                .order_by(Pharmacist.created_at.desc())
            )
        ).all()
    )


@router.get("/pharmacists/")
async def list_pharmacists(db: AsyncSession = Depends(get_db)):
    return [pharmacist_payload(item) for item in await approved_pharmacists(db)]


@router.get("/pharmacists/{pharmacist_id}/")
async def get_pharmacist(pharmacist_id: str, db: AsyncSession = Depends(get_db)):
    item = next((profile for profile in await approved_pharmacists(db) if profile.id == pharmacist_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacist not found")
    return pharmacist_payload(item)


async def conversation_payload(db: AsyncSession, item: Conversation) -> dict:
    pharmacist = await db.scalar(
        select(Pharmacist)
        .options(selectinload(Pharmacist.user), selectinload(Pharmacist.pharmacy))
        .where(Pharmacist.id == item.pharmacist_id)
    )
    patient = await db.get(User, item.patient_user_id)
    messages = []
    for row in sorted(item.messages, key=lambda message: message.created_at):
        sender = await db.get(User, row.sender_user_id)
        sender_name = (
            f"{sender.first_name} {sender.last_name}"
            if row.sender_role == "patient"
            else f"Pharm. {sender.first_name} {sender.last_name}"
        )
        messages.append(
            {
                "id": row.id,
                "senderRole": row.sender_role,
                "senderName": sender_name,
                "body": row.body,
                "createdAt": row.created_at,
                "attachmentName": row.attachment_name,
                "medicationName": row.medication_name,
            }
        )
    return {
        "id": item.id,
        "pharmacyId": item.pharmacy_id,
        "pharmacyName": pharmacist.pharmacy.name,
        "pharmacist": pharmacist_payload(pharmacist),
        "patientName": f"{patient.first_name} {patient.last_name}",
        "subject": item.subject,
        "status": item.status,
        "unreadCount": 0,
        "updatedAt": item.updated_at,
        "messages": messages,
    }


async def accessible_conversation(db: AsyncSession, conversation_id: str, user: User) -> Conversation:
    item = await db.scalar(
        select(Conversation).options(selectinload(Conversation.messages)).where(Conversation.id == conversation_id)
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if user.role == UserRole.PATIENT and item.patient_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if user.role in {UserRole.PHARMACIST, UserRole.PHARMACY_ADMIN}:
        pharmacy = await workspace_pharmacy(db, user)
        if item.pharmacy_id != pharmacy.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return item


@router.get("/conversations/")
async def conversations(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    query = select(Conversation).options(selectinload(Conversation.messages)).order_by(Conversation.updated_at.desc())
    if user.role == UserRole.PATIENT:
        query = query.where(Conversation.patient_user_id == user.id)
    elif user.role in {UserRole.PHARMACIST, UserRole.PHARMACY_ADMIN}:
        pharmacy = await workspace_pharmacy(db, user)
        query = query.where(Conversation.pharmacy_id == pharmacy.id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conversation access denied")
    return [await conversation_payload(db, item) for item in list((await db.scalars(query)).all())]


@router.post("/conversations/", status_code=status.HTTP_201_CREATED)
async def start_conversation(
    payload: StartConversationInput,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    pharmacist = next((item for item in await approved_pharmacists(db) if item.id == payload.pharmacist_id), None)
    if pharmacist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacist not found")
    item = Conversation(
        patient_user_id=patient.id,
        pharmacist_id=pharmacist.id,
        pharmacy_id=pharmacist.pharmacy_id,
        subject=payload.subject,
        status=ConversationStatus.WAITING,
        messages=[
            ConversationMessage(
                sender_user_id=patient.id,
                sender_role="patient",
                body=payload.message,
                medication_name=payload.medication_name,
            )
        ],
    )
    db.add(item)
    await db.commit()
    return await conversation_payload(db, await accessible_conversation(db, item.id, patient))


@router.get("/conversations/{conversation_id}/")
async def conversation_detail(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await conversation_payload(db, await accessible_conversation(db, conversation_id, user))


@router.post("/conversations/{conversation_id}/messages/", status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    payload: SendMessageInput,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = await accessible_conversation(db, conversation_id, user)
    sender_role = "patient" if user.role == UserRole.PATIENT else "pharmacist"
    row = ConversationMessage(
        conversation_id=item.id,
        sender_user_id=user.id,
        sender_role=sender_role,
        body=payload.body,
        attachment_name=payload.attachment_name,
        medication_name=payload.medication_name,
    )
    db.add(row)
    item.status = ConversationStatus.WAITING if sender_role == "patient" else ConversationStatus.OPEN
    item.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(row)
    sender_name = (
        f"{user.first_name} {user.last_name}"
        if sender_role == "patient"
        else f"Pharm. {user.first_name} {user.last_name}"
    )
    return {
        "id": row.id,
        "senderRole": sender_role,
        "senderName": sender_name,
        "body": row.body,
        "createdAt": row.created_at,
        "attachmentName": row.attachment_name,
        "medicationName": row.medication_name,
    }
