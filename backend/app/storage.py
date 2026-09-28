"""Filesystem locations for development and ephemeral serverless uploads."""

import os
from pathlib import Path

UPLOADS_DIRECTORY = (
    Path("/tmp/drugspot-uploads")
    if os.getenv("VERCEL")
    else Path(__file__).resolve().parents[1] / "uploads"
)
PRODUCT_IMAGE_DIRECTORY = UPLOADS_DIRECTORY / "product-images"
