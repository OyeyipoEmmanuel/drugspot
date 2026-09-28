"""Add live medication tracking and conversations.

Revision ID: d3a6c8e1f2b4
Revises: b7e2f4a9c1d3
Create Date: 2026-09-28 10:20:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d3a6c8e1f2b4"
down_revision: str | None = "b7e2f4a9c1d3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "medications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("strength", sa.String(80), nullable=False),
        sa.Column("form", sa.String(80), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("frequency", sa.String(80), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("remaining_doses", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_medications_patient_user_id", "medications", ["patient_user_id"])
    op.create_table(
        "medication_schedules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("medication_id", sa.String(36), sa.ForeignKey("medications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("time", sa.String(5), nullable=False),
        sa.Column("label", sa.String(80), nullable=False),
    )
    op.create_index("ix_medication_schedules_medication_id", "medication_schedules", ["medication_id"])
    op.create_table(
        "adherence_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("medication_id", sa.String(36), sa.ForeignKey("medications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_adherence_events_medication_id", "adherence_events", ["medication_id"])
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pharmacist_id", sa.String(36), sa.ForeignKey("pharmacists.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("pharmacy_id", sa.String(36), sa.ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_conversations_patient_user_id", "conversations", ["patient_user_id"])
    op.create_index("ix_conversations_pharmacist_id", "conversations", ["pharmacist_id"])
    op.create_index("ix_conversations_pharmacy_id", "conversations", ["pharmacy_id"])
    op.create_table(
        "conversation_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("sender_role", sa.String(20), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("attachment_name", sa.String(255), nullable=True),
        sa.Column("medication_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_conversation_messages_conversation_id", "conversation_messages", ["conversation_id"])


def downgrade() -> None:
    op.drop_table("conversation_messages")
    op.drop_table("conversations")
    op.drop_table("adherence_events")
    op.drop_table("medication_schedules")
    op.drop_table("medications")
