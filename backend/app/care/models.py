"""Persisted medication and conversation models."""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from ..models import new_uuid, utcnow


class MedicationStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"


class AdherenceStatus(StrEnum):
    TAKEN = "taken"
    SKIPPED = "skipped"
    SNOOZED = "snoozed"


class ConversationStatus(StrEnum):
    OPEN = "open"
    WAITING = "waiting"
    CLOSED = "closed"


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    patient_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    strength: Mapped[str] = mapped_column(String(80), nullable=False)
    form: Mapped[str] = mapped_column(String(80), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    frequency: Mapped[str] = mapped_column(String(80), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    remaining_doses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=MedicationStatus.ACTIVE.value, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    schedules: Mapped[list[MedicationSchedule]] = relationship(cascade="all, delete-orphan")
    adherence: Mapped[list[AdherenceEvent]] = relationship(cascade="all, delete-orphan")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    medication_id: Mapped[str] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), index=True)
    time: Mapped[str] = mapped_column(String(5), nullable=False)
    label: Mapped[str] = mapped_column(String(80), default="Reminder", nullable=False)


class AdherenceEvent(Base):
    __tablename__ = "adherence_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    medication_id: Mapped[str] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    patient_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    pharmacist_id: Mapped[str] = mapped_column(ForeignKey("pharmacists.id", ondelete="RESTRICT"), index=True)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), index=True)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ConversationStatus.WAITING.value, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    messages: Mapped[list[ConversationMessage]] = relationship(cascade="all, delete-orphan")


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    sender_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    sender_role: Mapped[str] = mapped_column(String(20), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    medication_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
