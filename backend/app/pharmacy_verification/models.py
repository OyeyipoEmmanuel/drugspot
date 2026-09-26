"""SQLAlchemy models for pharmacy verification and medication workflows.

This module intentionally keeps its own audit trail and identity model. Any future
cross-module reference to an application User should be passed as a plain string
user_id to avoid importing the auth module from here.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, DeclarativeBase, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for this module's SQLAlchemy models."""


class AccessRole(str, Enum):
    """Role names used by this module's RBAC guards."""

    PATIENT = "patient"
    PHARMACIST = "pharmacist"
    PHARMACY_STAFF = "pharmacy_staff"
    ADMIN = "admin"


class VerificationStatus(str, Enum):
    """Outcome of a pharmacy or pharmacist verification review."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class MedicationFrequency(str, Enum):
    """Common medication schedule frequencies."""

    DAILY = "daily"
    TWICE_DAILY = "twice_daily"
    WEEKLY = "weekly"
    AS_NEEDED = "as_needed"


class Pharmacy(Base):
    """Verified pharmacy record."""

    __tablename__ = "pharmacies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    state: Mapped[str | None] = mapped_column(String(120), nullable=True)
    country: Mapped[str] = mapped_column(String(120), nullable=False, default="Nigeria")
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    pharmacists: Mapped[list["Pharmacist"]] = relationship("Pharmacist", back_populates="pharmacy", cascade="all, delete-orphan")
    licenses: Mapped[list["PharmacyLicense"]] = relationship("PharmacyLicense", back_populates="pharmacy", cascade="all, delete-orphan")
    verification_records: Mapped[list["VerificationRecord"]] = relationship("VerificationRecord", back_populates="pharmacy", cascade="all, delete-orphan")
    medications: Mapped[list["MedicationRecord"]] = relationship("MedicationRecord", back_populates="pharmacy", cascade="all, delete-orphan")


class Pharmacist(Base):
    """Pharmacist attachment to a pharmacy and a user identity reference."""

    __tablename__ = "pharmacists"
    __table_args__ = (UniqueConstraint("user_id", name="uq_pharmacist_user"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    license_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    pharmacy: Mapped[Pharmacy] = relationship("Pharmacy", back_populates="pharmacists")
    medications: Mapped[list["MedicationRecord"]] = relationship("MedicationRecord", back_populates="pharmacist", cascade="all, delete-orphan")


class PharmacyLicense(Base):
    """A licensing record for a pharmacy or pharmacist verification flow."""

    __tablename__ = "pharmacy_licenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False)
    license_number: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    issued_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, native_enum=False, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
        default=VerificationStatus.PENDING,
    )
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    pharmacy: Mapped[Pharmacy] = relationship("Pharmacy", back_populates="licenses")


class VerificationRecord(Base):
    """Formal approval/rejection record for pharmacy or staff verification decisions."""

    __tablename__ = "verification_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pharmacy_id: Mapped[str | None] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=True)
    pharmacist_id: Mapped[str | None] = mapped_column(ForeignKey("pharmacists.id", ondelete="SET NULL"), nullable=True)
    reviewer_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    decision: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, native_enum=False, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
        default=VerificationStatus.PENDING,
    )
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    pharmacy: Mapped[Pharmacy | None] = relationship("Pharmacy", back_populates="verification_records")
    pharmacist: Mapped["Pharmacist | None"] = relationship("Pharmacist")


class MedicationRecord(Base):
    """Medication entry maintained by a pharmacy or pharmacist."""

    __tablename__ = "medication_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False)
    pharmacist_id: Mapped[str | None] = mapped_column(ForeignKey("pharmacists.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    generic_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    dosage_form: Mapped[str | None] = mapped_column(String(60), nullable=True)
    strength: Mapped[str | None] = mapped_column(String(80), nullable=True)
    instructions: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    pharmacy: Mapped[Pharmacy] = relationship("Pharmacy", back_populates="medications")
    pharmacist: Mapped["Pharmacist | None"] = relationship("Pharmacist", back_populates="medications")
    schedules: Mapped[list["MedicationSchedule"]] = relationship("MedicationSchedule", back_populates="medication", cascade="all, delete-orphan")


class MedicationSchedule(Base):
    """A dosing schedule for an approved medication record."""

    __tablename__ = "medication_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    medication_id: Mapped[str] = mapped_column(ForeignKey("medication_records.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    frequency: Mapped[MedicationFrequency] = mapped_column(
        SAEnum(MedicationFrequency, native_enum=False, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
    )
    time_of_day: Mapped[str | None] = mapped_column(String(120), nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    medication: Mapped[MedicationRecord] = relationship("MedicationRecord", back_populates="schedules")


class AuditLog(Base):
    """Audit record for privileged actions and sensitive state changes."""

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    details: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
