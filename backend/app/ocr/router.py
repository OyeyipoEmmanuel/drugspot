"""Authenticated OCR upload route."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..auth.deps import require_roles
from ..auth.models import User, UserRole
from ..commerce.nafdac import NafdacClient, get_nafdac_client
from .schemas import OcrExtractionResult
from .service import OcrSpaceClient, build_medication_extraction, get_ocr_client

router = APIRouter(prefix="/medications", tags=["medication OCR"])

MAX_OCR_IMAGE_BYTES = 1024 * 1024
IMAGE_SIGNATURES = {
    "image/jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
    "image/png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP",
}


@router.post("/ocr/", response_model=OcrExtractionResult)
async def extract_medication(
    image: UploadFile = File(...),
    _: User = Depends(require_roles(UserRole.PATIENT)),
    ocr: OcrSpaceClient = Depends(get_ocr_client),
    nafdac: NafdacClient = Depends(get_nafdac_client),
):
    signature_matches = IMAGE_SIGNATURES.get(image.content_type or "")
    if signature_matches is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Upload a JPEG, PNG, or WebP image.",
        )
    contents = await image.read(MAX_OCR_IMAGE_BYTES + 1)
    await image.close()
    if not contents:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The image file is empty.")
    if len(contents) > MAX_OCR_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="OCR images must be 1 MB or smaller on the free service plan.",
        )
    if not signature_matches(contents):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file does not contain a valid image.",
        )

    file_name = image.filename or "medicine-image"
    text = await ocr.extract_text(file_name=file_name, content_type=image.content_type or "", contents=contents)
    return await build_medication_extraction(text, source_file_name=file_name, nafdac=nafdac)
