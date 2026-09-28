"""Public marketplace, patient ordering, and pharmacy workspace routes."""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.concurrency import run_in_threadpool

from ..auth.deps import require_roles
from ..auth.models import User, UserRole
from ..database import get_db
from ..pharmacy_verification.models import Pharmacy
from .models import Order, PreOrderRequest, Product, RefillRequest
from .nafdac import NafdacClient, get_nafdac_client
from .schemas import (
    CheckoutInput,
    InventoryUpdate,
    NafdacVerificationInput,
    NafdacVerificationResult,
    OrderStatusUpdate,
    PreorderInput,
    ProductCreate,
    ProductImageUploadResult,
    RefillCreate,
    RefillStatusUpdate,
)
from .service import (
    change_order_status,
    checkout,
    create_product,
    customer_payloads,
    dashboard_payload,
    get_order,
    get_public_product,
    inventory_payload,
    list_public_products,
    order_payload,
    refill_payload,
    update_inventory,
    workspace_pharmacy,
)

public_router = APIRouter(tags=["marketplace"])
patient_router = APIRouter(tags=["patient commerce"])
workspace_router = APIRouter(prefix="/pharmacy", tags=["pharmacy workspace"])

PRODUCT_IMAGE_TYPES = {
    "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
    "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
}
MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
PRODUCT_IMAGE_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads" / "product-images"


@public_router.get("/products/")
async def products(
    search: str | None = None,
    category: str | None = None,
    availability: str | None = Query(default=None, pattern="^(all|available|preorder)$"),
    db: AsyncSession = Depends(get_db),
):
    return await list_public_products(db, search=search, category=category, availability=availability)


@public_router.get("/products/{product_id}/")
async def product(product_id: str, db: AsyncSession = Depends(get_db)):
    return await get_public_product(db, product_id)


@patient_router.post("/orders/checkout/", status_code=status.HTTP_201_CREATED)
async def place_order(
    payload: CheckoutInput,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    order = await checkout(db, patient, payload)
    return await order_payload(db, order)


@patient_router.get("/orders/")
async def patient_orders(
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    orders = list(
        (
            await db.scalars(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.patient_user_id == patient.id)
                .order_by(Order.created_at.desc())
            )
        ).all()
    )
    return [await order_payload(db, order) for order in orders]


@patient_router.get("/orders/{order_id}/")
async def patient_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    return await order_payload(db, await get_order(db, order_id, patient.id))


@patient_router.post("/refill-requests/", status_code=status.HTTP_201_CREATED)
async def request_refill(
    payload: RefillCreate,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    refill = RefillRequest(patient_user_id=patient.id, **payload.model_dump(by_alias=False))
    db.add(refill)
    await db.commit()
    await db.refresh(refill)
    return await refill_payload(db, refill)


@patient_router.post("/pre-order-requests/", status_code=status.HTTP_201_CREATED)
async def request_preorder(
    payload: PreorderInput,
    db: AsyncSession = Depends(get_db),
    patient: User = Depends(require_roles(UserRole.PATIENT)),
):
    product = await db.scalar(
        select(Product).where(
            Product.id == payload.product_id,
            Product.pharmacy_id == payload.pharmacy_id,
            Product.preorder_supported.is_(True),
        )
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pre-order is not available")
    request = PreOrderRequest(
        patient_user_id=patient.id,
        product_id=product.id,
        pharmacy_id=product.pharmacy_id,
        quantity=payload.quantity,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    pharmacy = await db.get(Pharmacy, product.pharmacy_id)
    return {
        "id": request.id,
        "productId": product.id,
        "productName": product.name,
        "pharmacyId": product.pharmacy_id,
        "pharmacyName": pharmacy.name,
        "quantity": request.quantity,
        "status": request.status,
        "requestedAt": request.requested_at,
        "estimatedRestockDate": product.estimated_restock_date,
    }


async def workspace_context(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.PHARMACY_ADMIN, UserRole.PHARMACIST)),
):
    return db, user, await workspace_pharmacy(db, user)


@workspace_router.get("/access/")
async def workspace_access(context=Depends(workspace_context)):
    _, _, pharmacy = context
    return {
        "approved": True,
        "pharmacyId": pharmacy.id,
        "pharmacyName": pharmacy.name,
        "verificationStatus": pharmacy.verification_status,
    }


@workspace_router.get("/dashboard/")
async def workspace_dashboard(context=Depends(workspace_context)):
    db, _, pharmacy = context
    return await dashboard_payload(db, pharmacy)


@workspace_router.get("/inventory/")
async def inventory(context=Depends(workspace_context)):
    db, _, pharmacy = context
    products = list(
        (await db.scalars(select(Product).where(Product.pharmacy_id == pharmacy.id).order_by(Product.name))).all()
    )
    return [inventory_payload(product) for product in products]


@workspace_router.post("/inventory/verify-nafdac/", response_model=NafdacVerificationResult)
async def verify_inventory_nafdac(
    payload: NafdacVerificationInput,
    context=Depends(workspace_context),
    nafdac: NafdacClient = Depends(get_nafdac_client),
):
    del context
    return await nafdac.verify(
        nafdac_number=payload.nafdac_number,
        product_name=payload.product_name,
        strength=payload.strength,
    )


@workspace_router.post("/inventory/product-image/", response_model=ProductImageUploadResult)
async def upload_product_image(
    request: Request,
    image: UploadFile = File(...),
    context=Depends(workspace_context),
):
    del context
    image_type = PRODUCT_IMAGE_TYPES.get(image.content_type or "")
    if image_type is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPEG, PNG, or WebP product image.",
        )
    contents = await image.read(MAX_PRODUCT_IMAGE_BYTES + 1)
    await image.close()
    if not contents:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The image file is empty.")
    if len(contents) > MAX_PRODUCT_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Product images must be 5 MB or smaller.",
        )
    extension, signature_matches = image_type
    if not signature_matches(contents):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file does not contain a valid product image.",
        )

    PRODUCT_IMAGE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    await run_in_threadpool((PRODUCT_IMAGE_DIRECTORY / filename).write_bytes, contents)
    base_url = str(request.base_url).rstrip("/")
    return ProductImageUploadResult(image_url=f"{base_url}/uploads/product-images/{filename}")


@workspace_router.post("/inventory/", status_code=status.HTTP_201_CREATED)
async def add_inventory(
    payload: ProductCreate,
    context=Depends(workspace_context),
    nafdac: NafdacClient = Depends(get_nafdac_client),
):
    db, user, pharmacy = context
    verification = await nafdac.verify(
        nafdac_number=payload.nafdac_number,
        product_name=payload.name,
        strength=payload.strength,
    )
    return inventory_payload(await create_product(db, pharmacy, user, payload, verification))


@workspace_router.patch("/inventory/{product_id}/")
async def patch_inventory(product_id: str, payload: InventoryUpdate, context=Depends(workspace_context)):
    db, user, pharmacy = context
    return inventory_payload(await update_inventory(db, pharmacy, user, product_id, payload))


@workspace_router.get("/orders/")
async def workspace_orders(context=Depends(workspace_context)):
    db, _, pharmacy = context
    orders = list(
        (
            await db.scalars(
                select(Order)
                .options(selectinload(Order.items))
                .where(Order.pharmacy_id == pharmacy.id)
                .order_by(Order.created_at.desc())
            )
        ).all()
    )
    return [await order_payload(db, order, workspace=True) for order in orders]


@workspace_router.patch("/orders/{order_id}/status/")
async def patch_order_status(order_id: str, payload: OrderStatusUpdate, context=Depends(workspace_context)):
    db, user, pharmacy = context
    order = await change_order_status(db, pharmacy, user, order_id, payload.status)
    return await order_payload(db, order, workspace=True)


@workspace_router.get("/customers/")
async def customers(context=Depends(workspace_context)):
    db, _, pharmacy = context
    orders = list((await db.scalars(select(Order).where(Order.pharmacy_id == pharmacy.id))).all())
    return await customer_payloads(db, orders)


@workspace_router.get("/refill-requests/")
async def refills(context=Depends(workspace_context)):
    db, _, pharmacy = context
    items = list(
        (
            await db.scalars(
                select(RefillRequest)
                .where(RefillRequest.pharmacy_id == pharmacy.id)
                .order_by(RefillRequest.requested_at.desc())
            )
        ).all()
    )
    return [await refill_payload(db, item) for item in items]


@workspace_router.patch("/refill-requests/{refill_id}/status/")
async def patch_refill_status(refill_id: str, payload: RefillStatusUpdate, context=Depends(workspace_context)):
    db, _, pharmacy = context
    refill = await db.scalar(
        select(RefillRequest).where(RefillRequest.id == refill_id, RefillRequest.pharmacy_id == pharmacy.id)
    )
    if refill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refill request not found")
    refill.status = payload.status
    await db.commit()
    await db.refresh(refill)
    return await refill_payload(db, refill)
