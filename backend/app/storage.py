"""Filesystem locations for development and ephemeral serverless uploads."""

import os
import tempfile
from pathlib import Path
from uuid import uuid4


def _prepare_writable_directory(path: Path) -> Path:
    """Create a directory and verify that the running process can write to it."""
    path.mkdir(parents=True, exist_ok=True)
    probe = path / f".drugspot-write-test-{uuid4().hex}"
    try:
        probe.write_bytes(b"")
    finally:
        probe.unlink(missing_ok=True)
    return path


def resolve_uploads_directory() -> Path:
    configured = os.getenv("UPLOADS_DIRECTORY")
    preferred = Path(configured) if configured else Path(__file__).resolve().parents[1] / "uploads"
    try:
        return _prepare_writable_directory(preferred)
    except OSError:
        fallback = Path(tempfile.gettempdir()) / "drugspot-uploads"
        return _prepare_writable_directory(fallback)


UPLOADS_DIRECTORY = resolve_uploads_directory()
PRODUCT_IMAGE_DIRECTORY = UPLOADS_DIRECTORY / "product-images"
