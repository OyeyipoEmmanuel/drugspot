"""Frontend-compatible commerce schemas."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import Field

from ..auth.schemas import ApiModel
from .models import OrderStatus, PaymentStatus, RefillStatus


class ProductCreate(ApiModel):
    name: str = Field(min_length=2, max_length=200)
    generic_name: str = Field(default="", max_length=200)
    brand: str = Field(default="", max_length=160)
    category: str = Field(min_length=2, max_length=120)
    form: str = Field(default="", max_length=80)
    strength: str = Field(default="", max_length=80)
    pack_size: str = Field(default="", max_length=100)
    description: str = Field(default="", max_length=2000)
    image_url: str = Field(min_length=5, max_length=1000)
    sku: str = Field(min_length=2, max_length=100)
    nafdac_number: str = Field(min_length=3, max_length=50)
    stock_count: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=5, ge=0)
    unit_price: float = Field(gt=0)
    requires_prescription: bool = False
    requires_pharmacist_review: bool = False
    preorder_supported: bool = False


class NafdacVerificationInput(ApiModel):
    nafdac_number: str = Field(min_length=3, max_length=50)
    product_name: str = Field(min_length=2, max_length=200)
    strength: str = Field(default="", max_length=80)


class NafdacVerificationResult(ApiModel):
    verified: bool
    reason: str
    nafdac_number: str
    nafdac_product_id: int | None = None
    official_name: str = ""
    strength: str = ""
    pack_size: str = ""
    description: str = ""
    composition: str = ""
    ingredient: str = ""
    manufacturer: str = ""
    approval_date: date | None = None
    expiry_date: date | None = None
    name_matches: bool = False


class ProductImageUploadResult(ApiModel):
    image_url: str


class InventoryUpdate(ApiModel):
    stock_count: int = Field(ge=0)
    reorder_level: int = Field(ge=0)
    unit_price: float = Field(gt=0)


class OrderStatusUpdate(ApiModel):
    status: OrderStatus


class RefillStatusUpdate(ApiModel):
    status: RefillStatus


class CheckoutItem(ApiModel):
    product: dict[str, Any]
    offer: dict[str, Any]
    pharmacy: dict[str, Any]
    quantity: int = Field(ge=1)


class CheckoutInput(ApiModel):
    items: list[CheckoutItem] = Field(min_length=1)
    fulfillment_method: Literal["delivery", "pickup"]
    payment_method: Literal["card", "bank_transfer", "cash_on_delivery"]
    recipient_name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=7, max_length=30)
    delivery_address: str | None = Field(default=None, max_length=500)
    prescription_file_name: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=2000)


class PreorderInput(ApiModel):
    product_id: str
    pharmacy_id: str
    quantity: int = Field(ge=1)


class RefillCreate(ApiModel):
    pharmacy_id: str
    medication_name: str = Field(min_length=2, max_length=200)
    strength: str = Field(default="", max_length=80)
    quantity: int = Field(ge=1)
    notes: str | None = Field(default=None, max_length=2000)


class CommercePayload(ApiModel):
    """Documents dynamic response payloads while preserving camel-case serialization."""

    data: dict[str, Any] | None = None


class TimestampedResponse(ApiModel):
    id: str
    created_at: datetime


OrderStatusType = OrderStatus
PaymentStatusType = PaymentStatus
RefillStatusType = RefillStatus
