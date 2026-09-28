"""Filesystem locations for development and ephemeral serverless uploads."""

import os
import tempfile
from pathlib import Path


def resolve_uploads_directory() -> Path:
    configured = os.getenv("UPLOADS_DIRECTORY")
    preferred = Path(configured) if configured else Path(__file__).resolve().parents[1] / "uploads"
    try:
        preferred.mkdir(parents=True, exist_ok=True)
        return preferred
    except OSError:
        fallback = Path(tempfile.gettempdir()) / "drugspot-uploads"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


UPLOADS_DIRECTORY = resolve_uploads_directory()
PRODUCT_IMAGE_DIRECTORY = UPLOADS_DIRECTORY / "product-images"
