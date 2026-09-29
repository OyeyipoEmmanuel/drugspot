"""DrugSpot FastAPI application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .auth.router import router as auth_router
from .care.router import router as care_router
from .commerce.router import patient_router as commerce_patient_router
from .commerce.router import public_router as commerce_public_router
from .commerce.router import workspace_router as commerce_workspace_router
from .config import get_settings
from .ocr.router import router as ocr_router
from .pharmacy_verification.router import admin_router, pharmacy_router, professional_router, public_router
from .storage import UPLOADS_DIRECTORY

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for the DrugSpot online pharmacy MVP.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIRECTORY), name="uploads")


@app.get("/", tags=["system"])
async def root() -> dict[str, str]:
    """Return a public readiness response for deployment routers."""
    return {
        "name": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(commerce_public_router, prefix=settings.api_v1_prefix)
app.include_router(commerce_patient_router, prefix=settings.api_v1_prefix)
app.include_router(commerce_workspace_router, prefix=settings.api_v1_prefix)
app.include_router(ocr_router, prefix=settings.api_v1_prefix)
app.include_router(public_router, prefix=settings.api_v1_prefix)
app.include_router(professional_router, prefix=settings.api_v1_prefix)
app.include_router(care_router, prefix=settings.api_v1_prefix)
app.include_router(pharmacy_router, prefix=settings.api_v1_prefix)
app.include_router(admin_router, prefix=settings.api_v1_prefix)
