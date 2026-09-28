"""OCR response schemas."""

from pydantic import Field

from ..auth.schemas import ApiModel


class OcrMedicationDraft(ApiModel):
    name: str | None = None
    strength: str | None = None
    form: str | None = None
    instructions: str | None = None
    frequency: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    remaining_doses: int | None = Field(default=None, ge=0)
    schedule_times: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
    warnings: list[str]
    detected_nafdac_number: str | None = None
    nafdac_verified: bool | None = None


class OcrExtractionResult(ApiModel):
    medications: list[OcrMedicationDraft]
    source_file_name: str
    extracted_text: str
    warnings: list[str]
