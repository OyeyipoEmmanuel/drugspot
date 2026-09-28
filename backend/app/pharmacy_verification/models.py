"""Pharmacy ownership, professional identity, and verification models."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from ..models import new_uuid, utcnow


class VerificationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    country: Mapped[str] = mapped_column(String(120), default="Nigeria", nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    hours: Mapped[str] = mapped_column(String(160), default="Mon-Sat, 8:00 AM-8:00 PM", nullable=False)
    supports_delivery: Mapped[bool] = mapped_column(default=True, nullable=False)
    supports_pickup: Mapped[bool] = mapped_column(default=True, nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    review_count: Mapped[int] = mapped_column(default=0, nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        default=VerificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    owner = relationship("User", back_populates="owned_pharmacies", foreign_keys=[owner_user_id])
    pharmacists: Mapped[list[Pharmacist]] = relationship(back_populates="pharmacy", cascade="all, delete-orphan")
    licenses: Mapped[list[PharmacyLicense]] = relationship(back_populates="pharmacy", cascade="all, delete-orphan")
    verification_records: Mapped[list[VerificationRecord]] = relationship(
        back_populates="pharmacy", cascade="all, delete-orphan"
    )


class Pharmacist(Base):
    __tablename__ = "pharmacists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), unique=True, nullable=False)
    license_number: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    license_issued_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    license_document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        default=VerificationStatus.PENDING,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    pharmacy: Mapped[Pharmacy] = relationship(back_populates="pharmacists")
    user = relationship("User", back_populates="pharmacist_profile")


class PharmacyLicense(Base):
    __tablename__ = "pharmacy_licenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False)
    license_number: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    issued_by: Mapped[str] = mapped_column(String(200), nullable=False)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    document_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    pharmacy: Mapped[Pharmacy] = relationship(back_populates="licenses")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    pharmacy_id: Mapped[str | None] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=True)
    pharmacist_id: Mapped[str | None] = mapped_column(ForeignKey("pharmacists.id", ondelete="CASCADE"), nullable=True)
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    decision: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    pharmacy: Mapped[Pharmacy | None] = relationship(back_populates="verification_records")
    pharmacist: Mapped[Pharmacist | None] = relationship()
    reviewer = relationship("User", foreign_keys=[reviewer_id])
