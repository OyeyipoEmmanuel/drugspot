"""Persisted catalogue, order, and refill models."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from ..models import new_uuid, utcnow


class OrderStatus(StrEnum):
    PLACED = "placed"
    PHARMACY_REVIEW = "pharmacy_review"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    OUT_FOR_DELIVERY = "out_for_delivery"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class RefillStatus(StrEnum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    READY = "ready"


class PreorderStatus(StrEnum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    AVAILABLE = "available"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    generic_name: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    brand: Mapped[str] = mapped_column(String(160), default="", nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    form: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    strength: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    pack_size: Mapped[str] = mapped_column(String(100), default="", nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    image_url: Mapped[str] = mapped_column(String(1000), default="", nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    nafdac_number: Mapped[str] = mapped_column(String(50), default="", nullable=False, index=True)
    nafdac_product_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nafdac_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    nafdac_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    nafdac_product_name: Mapped[str] = mapped_column(String(200), default="", nullable=False)
    nafdac_manufacturer: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    nafdac_approval_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    nafdac_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    requires_pharmacist_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    inventory_items: Mapped[list["InventoryItem"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), index=True, nullable=False)
    stock_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    preorder_supported: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    estimated_restock_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    product: Mapped[Product] = relationship(back_populates="inventory_items")
    pharmacy: Mapped["Pharmacy"] = relationship("Pharmacy", back_populates="inventory_items")

    __table_args__ = ({"sqlite_autoincrement": True},)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    reference: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    patient_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="RESTRICT"), index=True)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        default=OrderStatus.PLACED,
        nullable=False,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        default=PaymentStatus.PENDING,
        nullable=False,
    )
    payment_method: Mapped[str] = mapped_column(String(40), nullable=False)
    fulfillment_method: Mapped[str] = mapped_column(String(30), nullable=False)
    recipient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    delivery_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    prescription_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    items: Mapped[list[OrderItem]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    strength: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")


class RefillRequest(Base):
    __tablename__ = "refill_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    patient_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), index=True)
    medication_name: Mapped[str] = mapped_column(String(200), nullable=False)
    strength: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[RefillStatus] = mapped_column(
        SAEnum(RefillStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        default=RefillStatus.REQUESTED,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class PreOrderRequest(Base):
    __tablename__ = "preorder_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    patient_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    pharmacy_id: Mapped[str] = mapped_column(ForeignKey("pharmacies.id", ondelete="CASCADE"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PreorderStatus] = mapped_column(
        SAEnum(PreorderStatus, native_enum=False, values_callable=lambda enum: [item.value for item in enum]),
        default=PreorderStatus.REQUESTED,
        nullable=False,
    )
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
