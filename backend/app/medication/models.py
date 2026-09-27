import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


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
