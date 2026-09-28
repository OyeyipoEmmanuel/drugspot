"""Medication and conversation request schemas."""

from datetime import date
from typing import Literal

from pydantic import Field

from ..auth.schemas import ApiModel
from .models import AdherenceStatus


class MedicationInput(ApiModel):
    name: str = Field(min_length=2, max_length=200)
    strength: str = Field(min_length=1, max_length=80)
    form: str = Field(min_length=1, max_length=80)
    instructions: str = Field(min_length=5, max_length=2000)
    frequency: str = Field(min_length=1, max_length=80)
    start_date: date
    end_date: date
    remaining_doses: int = Field(ge=0)
    schedule_times: list[str] = Field(min_length=1)


class AdherenceInput(ApiModel):
    status: AdherenceStatus


class StartConversationInput(ApiModel):
    pharmacist_id: str
    subject: str = Field(min_length=4, max_length=200)
    message: str = Field(min_length=2, max_length=4000)
    medication_name: str | None = Field(default=None, max_length=255)


class SendMessageInput(ApiModel):
    body: str = Field(min_length=2, max_length=4000)
    sender_role: Literal["patient", "pharmacist"] | None = None
    attachment_name: str | None = Field(default=None, max_length=255)
    medication_name: str | None = Field(default=None, max_length=255)
