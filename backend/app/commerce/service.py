"""Commerce workflows and frontend response mapping."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth.models import User, UserRole
from ..config import get_settings
from ..models import add_audit_log
from ..pharmacy_verification.models import Pharmacist, Pharmacy, VerificationStatus
from ..pharmacy_verification.service import to_public
from .models import InventoryItem, Order, OrderItem, OrderStatus, PaymentStatus, Product, RefillRequest, RefillStatus
from .schemas import CheckoutInput, InventoryUpdate, NafdacVerificationResult, ProductCreate


def stock_status(item: Product | InventoryItem) -> str:
    stock_count = getattr(item, "stock_count", 0)
    reorder_level = getattr(item, "reorder_level", 0)
    if stock_count == 0:
        return "out_of_stock"
    if stock_count <= reorder_level:
        return "low_stock"
    return "available"


def inventory_status(item: Product | InventoryItem) -> str:
    return "in_stock" if stock_status(item) == "available" else stock_status(item)


def inventory_offer_payload(item: InventoryItem) -> dict:
    return {
        "id": item.id,
        "productId": item.product_id,
        "pharmacyId": item.pharmacy_id,
        "price": float(item.unit_price),
        "stockCount": item.stock_count,
        "stockStatus": stock_status(item),
        "reorderLevel": item.reorder_level,
        "preorderSupported": item.preorder_supported,
        "estimatedRestockDate": item.estimated_restock_date,
    }


def inventory_payload(item: InventoryItem) -> dict:
    return {
        "id": item.product_id,
        "productId": item.product_id,
        "productName": item.product.name,
        "strength": item.product.strength,
        "sku": item.product.sku,
        "category": item.product.category,
        "imageUrl": item.product.image_url,
        "stockCount": item.stock_count,
        "reorderLevel": item.reorder_level,
        "unitPrice": float(item.unit_price),
        "requiresPrescription": item.product.requires_prescription,
        "nafdacNumber": item.product.nafdac_number,
        "nafdacVerified": item.product.nafdac_verified,
        "nafdacProductName": item.product.nafdac_product_name,
        "nafdacManufacturer": item.product.nafdac_manufacturer,
        "nafdacExpiryDate": item.product.nafdac_expiry_date,
        "status": inventory_status(item),
        "updatedAt": item.updated_at,
    }


def product_payload(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "genericName": product.generic_name,
        "brand": product.brand,
        "category": product.category,
        "form": product.form,
        "strength": product.strength,
        "packSize": product.pack_size,
        "description": product.description,
        "imageUrl": product.image_url,
        "requiresPrescription": product.requires_prescription,
        "requiresPharmacistReview": product.requires_pharmacist_review,
        "nafdacNumber": product.nafdac_number,
        "nafdacVerified": product.nafdac_verified,
        "nafdacProductName": product.nafdac_product_name,
        "nafdacManufacturer": product.nafdac_manufacturer,
        "nafdacExpiryDate": product.nafdac_expiry_date,
        "offers": [inventory_offer_payload(item) for item in product.inventory_items if item.is_active],
    }


async def workspace_pharmacy(session: AsyncSession, user: User) -> Pharmacy:
    if user.role == UserRole.PHARMACY_ADMIN:
        pharmacy = await session.scalar(select(Pharmacy).where(Pharmacy.owner_user_id == user.id))
    else:
        profile = await session.scalar(select(Pharmacist).where(Pharmacist.user_id == user.id))
        pharmacy = await session.get(Pharmacy, profile.pharmacy_id) if profile and profile.is_active else None
    if pharmacy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pharmacy workspace not found")
    if pharmacy.verification_status != VerificationStatus.APPROVED or not pharmacy.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pharmacy approval is required")
    return pharmacy


async def list_public_products(
    session: AsyncSession, *, search: str | None, category: str | None, availability: str | None
) -> list[dict]:
    query = (
        select(Product)
        .options(selectinload(Product.inventory_items).selectinload(InventoryItem.pharmacy))
        .join(InventoryItem, InventoryItem.product_id == Product.id)
        .join(Pharmacy, InventoryItem.pharmacy_id == Pharmacy.id)
        .where(
            Product.is_active.is_(True),
            InventoryItem.is_active.is_(True),
            Pharmacy.is_active.is_(True),
            Pharmacy.verification_status == VerificationStatus.APPROVED,
        )
        .order_by(Product.name)
    )
    products = list((await session.scalars(query)).all())
    products = list(dict.fromkeys(products))
    if search:
        needle = search.lower()
        products = [p for p in products if needle in f"{p.name} {p.generic_name} {p.brand} {p.category}".lower()]
    if category and category.lower() != "all":
        products = [p for p in products if p.category.lower() == category.lower()]
    if availability == "available":
        products = [p for p in products if any(item.stock_count > 0 for item in p.inventory_items)]
    elif availability == "preorder":
        products = [p for p in products if any(item.stock_count == 0 and item.preorder_supported for item in p.inventory_items)]
    return [product_payload(product) for product in products]


async def get_public_product(session: AsyncSession, product_id: str) -> dict:
    products = await list_public_products(session, search=None, category=None, availability=None)
    product = next((item for item in products if item["id"] == product_id), None)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


async def create_product(
    session: AsyncSession,
    pharmacy: Pharmacy,
    actor: User,
    payload: ProductCreate,
    nafdac: NafdacVerificationResult,
) -> Product:
    existing_product = await session.scalar(select(Product).where(Product.sku == payload.sku))
    if not nafdac.verified:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=nafdac.reason)
    if existing_product is None and nafdac.nafdac_number:
        existing_product = await session.scalar(select(Product).where(Product.nafdac_number == nafdac.nafdac_number))
    if existing_product is None and payload.name:
        existing_product = await session.scalar(
            select(Product).where(
                or_(Product.name == payload.name, Product.name == nafdac.official_name),
                Product.brand == (nafdac.manufacturer or payload.brand),
                Product.strength == (nafdac.strength or payload.strength),
            )
        )
    if existing_product is not None:
        product = existing_product
    else:
        product_data = payload.model_dump(
            by_alias=False,
            exclude={"stock_count", "reorder_level", "unit_price", "preorder_supported"},
        )
        product_data.update(
            name=nafdac.official_name,
            generic_name=nafdac.ingredient or payload.generic_name,
            brand=nafdac.manufacturer or payload.brand,
            form=payload.form or nafdac.description,
            strength=nafdac.strength or payload.strength,
            pack_size=nafdac.pack_size or payload.pack_size,
            description=nafdac.description or nafdac.composition or payload.description,
            nafdac_number=nafdac.nafdac_number,
        )
        product = Product(
            **product_data,
            nafdac_product_id=nafdac.nafdac_product_id,
            nafdac_verified=True,
            nafdac_verified_at=datetime.now(UTC),
            nafdac_product_name=nafdac.official_name,
            nafdac_manufacturer=nafdac.manufacturer,
            nafdac_approval_date=nafdac.approval_date,
            nafdac_expiry_date=nafdac.expiry_date,
        )
        session.add(product)
        await session.flush()
        add_audit_log(session, actor_id=actor.id, entity_type="product", entity_id=product.id, action="created")

    inventory_item = await session.scalar(
        select(InventoryItem).where(InventoryItem.product_id == product.id, InventoryItem.pharmacy_id == pharmacy.id)
    )
    if inventory_item is None:
        inventory_item = InventoryItem(
            product_id=product.id,
            pharmacy_id=pharmacy.id,
            stock_count=payload.stock_count,
            reorder_level=payload.reorder_level,
            unit_price=Decimal(str(payload.unit_price)),
            preorder_supported=payload.preorder_supported,
            estimated_restock_date=None,
        )
        session.add(inventory_item)
    else:
        inventory_item.stock_count = payload.stock_count
        inventory_item.reorder_level = payload.reorder_level
        inventory_item.unit_price = Decimal(str(payload.unit_price))
        inventory_item.preorder_supported = payload.preorder_supported
    await session.commit()
    await session.refresh(product)
    return product


async def update_inventory(
    session: AsyncSession, pharmacy: Pharmacy, actor: User, product_id: str, payload: InventoryUpdate
) -> InventoryItem:
    inventory_item = await session.scalar(
        select(InventoryItem).where(InventoryItem.product_id == product_id, InventoryItem.pharmacy_id == pharmacy.id)
    )
    if inventory_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
    inventory_item.stock_count = payload.stock_count
    inventory_item.reorder_level = payload.reorder_level
    inventory_item.unit_price = Decimal(str(payload.unit_price))
    add_audit_log(
        session, actor_id=actor.id, entity_type="inventory_item", entity_id=inventory_item.id, action="inventory_updated"
    )
    await session.commit()
    await session.refresh(inventory_item)
    return inventory_item


async def checkout(session: AsyncSession, patient: User, payload: CheckoutInput) -> Order:
    product_ids = [str(item.product.get("id", "")) for item in payload.items]
    products = list((await session.scalars(select(Product).where(Product.id.in_(product_ids)))).all())
    by_id = {product.id: product for product in products}
    if len(by_id) != len(set(product_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more products are unavailable")
    pharmacy_ids = {item.pharmacy.get("id") for item in payload.items if item.pharmacy.get("id")}
    if len(pharmacy_ids) != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An order must contain one pharmacy")
    pharmacy = await session.get(Pharmacy, pharmacy_ids.pop())
    if pharmacy is None or not pharmacy.is_active or pharmacy.verification_status != VerificationStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pharmacy is unavailable")
    if payload.fulfillment_method == "delivery" and not payload.delivery_address:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Delivery address is required")

    subtotal = Decimal("0")
    requires_prescription = False
    quantities: dict[str, int] = {}
    inventory_by_offer: dict[str, InventoryItem] = {}
    for item in payload.items:
        product = by_id[str(item.product["id"])]
        quantities[product.id] = quantities.get(product.id, 0) + item.quantity
        offer_id = item.offer.get("id") if isinstance(item.offer, dict) else None
        inventory_item = None
        if offer_id:
            inventory_item = await session.get(InventoryItem, offer_id)
        if inventory_item is None:
            inventory_item = await session.scalar(
                select(InventoryItem).where(
                    InventoryItem.product_id == product.id,
                    InventoryItem.pharmacy_id == pharmacy.id,
                )
            )
        if inventory_item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Offer for {product.name} is unavailable")
        inventory_by_offer[product.id] = inventory_item
    for product_id, quantity in quantities.items():
        product = by_id[product_id]
        inventory_item = inventory_by_offer[product_id]
        if not product.is_active or inventory_item.stock_count < quantity:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Insufficient stock for {product.name}")
        subtotal += inventory_item.unit_price * quantity
        requires_prescription = requires_prescription or product.requires_prescription
    if requires_prescription and not payload.prescription_file_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Prescription attachment is required"
        )

    delivery_fee = Decimal(str(pharmacy.delivery_fee)) if payload.fulfillment_method == "delivery" else Decimal("0")
    order = Order(
        reference=f"DSP-{uuid4().hex[:8].upper()}",
        patient_user_id=patient.id,
        pharmacy_id=pharmacy.id,
        status=OrderStatus.PHARMACY_REVIEW if requires_prescription else OrderStatus.PLACED,
        payment_status=PaymentStatus.PENDING,
        payment_method=payload.payment_method,
        fulfillment_method=payload.fulfillment_method,
        recipient_name=payload.recipient_name,
        phone=payload.phone,
        delivery_address=payload.delivery_address,
        prescription_file_name=payload.prescription_file_name,
        notes=payload.notes,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=subtotal + delivery_fee,
    )
    session.add(order)
    await session.flush()
    for product_id, quantity in quantities.items():
        product = by_id[product_id]
        inventory_item = inventory_by_offer[product_id]
        inventory_item.stock_count -= quantity
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                name=product.name,
                strength=product.strength,
                quantity=quantity,
                unit_price=inventory_item.unit_price,
                requires_prescription=product.requires_prescription,
            )
        )
    add_audit_log(session, actor_id=patient.id, entity_type="order", entity_id=order.id, action="placed")
    await session.commit()
    order = await get_order(session, order.id, patient.id)
    if get_settings().auto_fulfill_non_prescription:
        order = await auto_fulfill_non_prescription_order(session, pharmacy, order)
    return order


async def get_order(session: AsyncSession, order_id: str, patient_id: str | None = None) -> Order:
    query = select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    if patient_id:
        query = query.where(Order.patient_user_id == patient_id)
    order = await session.scalar(query)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def order_payload(session: AsyncSession, order: Order, *, workspace: bool = False) -> dict:
    pharmacy = await session.get(Pharmacy, order.pharmacy_id)
    patient = await session.get(User, order.patient_user_id)
    items = [
        {
            "id": item.id,
            "productId": item.product_id,
            "name": item.name if workspace else item.name,
            "strength": item.strength,
            "quantity": item.quantity,
            "unitPrice": float(item.unit_price),
            "requiresPrescription": item.requires_prescription,
        }
        for item in order.items
    ]
    if workspace:
        return {
            "id": order.id,
            "reference": order.reference,
            "patientName": order.recipient_name,
            "patientPhone": order.phone,
            "items": items,
            "status": order.status,
            "paymentStatus": order.payment_status,
            "fulfillmentMethod": order.fulfillment_method,
            "total": float(order.total),
            "createdAt": order.created_at,
            "prescriptionFileName": order.prescription_file_name,
        }
    return {
        "id": order.id,
        "reference": order.reference,
        "pharmacy": to_public(pharmacy),
        "items": items,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "paymentMethod": order.payment_method,
        "fulfillmentMethod": order.fulfillment_method,
        "recipientName": order.recipient_name,
        "phone": order.phone,
        "deliveryAddress": order.delivery_address,
        "prescriptionFileName": order.prescription_file_name,
        "subtotal": float(order.subtotal),
        "deliveryFee": float(order.delivery_fee),
        "total": float(order.total),
        "createdAt": order.created_at,
        "timeline": timeline_payload(order),
        "patientEmail": patient.email if patient else None,
    }


def timeline_payload(order: Order) -> list[dict]:
    sequence = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING]
    sequence.append(
        OrderStatus.READY_FOR_PICKUP if order.fulfillment_method == "pickup" else OrderStatus.OUT_FOR_DELIVERY
    )
    sequence.append(OrderStatus.COMPLETED)
    current = sequence.index(order.status) if order.status in sequence else -1
    return [
        {
            "id": f"{order.id}-{item.value}",
            "status": item,
            "label": item.value.replace("_", " ").title(),
            "occurredAt": order.created_at if index == 0 else None,
            "complete": index <= current,
        }
        for index, item in enumerate(sequence)
    ]


ALLOWED_TRANSITIONS = {
    OrderStatus.PLACED: {OrderStatus.ACCEPTED, OrderStatus.CANCELLED},
    OrderStatus.PHARMACY_REVIEW: {OrderStatus.ACCEPTED, OrderStatus.CANCELLED},
    OrderStatus.ACCEPTED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED},
    OrderStatus.READY_FOR_PICKUP: {OrderStatus.COMPLETED, OrderStatus.CANCELLED},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.COMPLETED, OrderStatus.CANCELLED},
}


async def change_order_status(
    session: AsyncSession, pharmacy: Pharmacy, actor: User | None, order_id: str, next_status: OrderStatus
) -> Order:
    order = await session.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id, Order.pharmacy_id == pharmacy.id)
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if next_status not in ALLOWED_TRANSITIONS.get(order.status, set()):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invalid order status transition")
    if next_status == OrderStatus.CANCELLED:
        for item in order.items:
            inventory_item = await session.scalar(
                select(InventoryItem).where(
                    InventoryItem.product_id == item.product_id,
                    InventoryItem.pharmacy_id == order.pharmacy_id,
                )
            )
            if inventory_item:
                inventory_item.stock_count += item.quantity
    order.status = next_status
    add_audit_log(
        session,
        actor_id=actor.id if actor else None,
        entity_type="order",
        entity_id=order.id,
        action=f"status_{next_status.value}",
    )
    await session.commit()
    return await get_order(session, order.id)


async def auto_fulfill_non_prescription_order(
    session: AsyncSession, pharmacy: Pharmacy, order: Order
) -> Order:
    if order.status != OrderStatus.PLACED or any(item.requires_prescription for item in order.items):
        return order
    if order.payment_status != PaymentStatus.PAID and order.payment_method != "cash_on_delivery":
        return order

    status_path = [OrderStatus.ACCEPTED, OrderStatus.PREPARING]
    status_path.append(
        OrderStatus.OUT_FOR_DELIVERY
        if order.fulfillment_method == "delivery"
        else OrderStatus.READY_FOR_PICKUP
    )
    status_path.append(OrderStatus.COMPLETED)
    for next_status in status_path:
        order = await change_order_status(session, pharmacy, None, order.id, next_status)
    return order


async def customer_payloads(session: AsyncSession, orders: list[Order]) -> list[dict]:
    grouped: dict[str, list[Order]] = {}
    for order in orders:
        grouped.setdefault(order.patient_user_id, []).append(order)
    result = []
    for patient_id, patient_orders in grouped.items():
        patient = await session.get(User, patient_id)
        latest = max(item.created_at for item in patient_orders)
        result.append(
            {
                "id": patient_id,
                "name": f"{patient.first_name} {patient.last_name}" if patient else patient_orders[0].recipient_name,
                "phone": patient.phone if patient else patient_orders[0].phone,
                "email": patient.email if patient else "",
                "orderCount": len(patient_orders),
                "totalSpent": float(sum((item.total for item in patient_orders), Decimal("0"))),
                "lastOrderAt": latest,
            }
        )
    return sorted(result, key=lambda item: item["lastOrderAt"], reverse=True)


async def refill_payload(session: AsyncSession, refill: RefillRequest) -> dict:
    patient = await session.get(User, refill.patient_user_id)
    return {
        "id": refill.id,
        "patientName": f"{patient.first_name} {patient.last_name}" if patient else "Patient",
        "medicationName": refill.medication_name,
        "strength": refill.strength,
        "quantity": refill.quantity,
        "status": refill.status,
        "requestedAt": refill.requested_at,
        "notes": refill.notes,
    }


async def dashboard_payload(session: AsyncSession, pharmacy: Pharmacy) -> dict:
    orders = list(
        (
            await session.scalars(
                select(Order).options(selectinload(Order.items)).where(Order.pharmacy_id == pharmacy.id)
            )
        ).all()
    )
    refills = list((await session.scalars(select(RefillRequest).where(RefillRequest.pharmacy_id == pharmacy.id))).all())
    now = datetime.now(UTC)
    week_start = now - timedelta(days=7)
    paid_week = [item for item in orders if item.payment_status == PaymentStatus.PAID and item.created_at >= week_start]
    recent = sorted(orders, key=lambda item: item.created_at, reverse=True)[:4]
    inventory_rows = list(
        (await session.scalars(select(InventoryItem).where(InventoryItem.pharmacy_id == pharmacy.id))).all()
    )
    return {
        "pharmacyName": pharmacy.name,
        "openOrders": sum(item.status not in {OrderStatus.COMPLETED, OrderStatus.CANCELLED} for item in orders),
        "lowStockItems": sum(item.stock_count <= item.reorder_level for item in inventory_rows),
        "refillRequests": sum(item.status == RefillStatus.REQUESTED for item in refills),
        "todaySales": float(
            sum((item.total for item in paid_week if item.created_at.date() == now.date()), Decimal("0"))
        ),
        "weekSales": float(sum((item.total for item in paid_week), Decimal("0"))),
        "fulfilledThisWeek": sum(
            item.status == OrderStatus.COMPLETED and item.updated_at >= week_start for item in orders
        ),
        "recentOrders": [await order_payload(session, item, workspace=True) for item in recent],
        "lowStock": [inventory_payload(item) for item in inventory_rows if item.stock_count <= item.reorder_level][:4],
    }
