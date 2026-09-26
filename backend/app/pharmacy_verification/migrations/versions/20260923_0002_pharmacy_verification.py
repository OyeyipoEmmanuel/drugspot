"""Initial pharmacy verification and medication management tables.

Revision ID: 20260923_0002
Revises: 20260923_0001
Create Date: 2026-09-23
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260923_0002"
down_revision = "20260923_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create the pharmacy verification and medication management tables."""
    op.create_table(
        "pharmacies",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("state", sa.String(length=120), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=False, server_default="Nigeria"),
        sa.Column("phone_number", sa.String(length=30), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "pharmacists",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("pharmacy_id", sa.String(length=36), sa.ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("license_number", sa.String(length=120), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "pharmacy_licenses",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("pharmacy_id", sa.String(length=36), sa.ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("license_number", sa.String(length=120), nullable=False),
        sa.Column("issued_by", sa.String(length=200), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", "expired", name="verificationstatus", native_enum=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("notes", sa.String(length=1000), nullable=True),
    )

    op.create_table(
        "verification_records",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("pharmacy_id", sa.String(length=36), sa.ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=True),
        sa.Column("pharmacist_id", sa.String(length=36), sa.ForeignKey("pharmacists.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewer_id", sa.String(length=36), nullable=True),
        sa.Column(
            "decision",
            sa.Enum("pending", "approved", "rejected", "expired", name="verificationstatus", native_enum=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "medication_records",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("pharmacy_id", sa.String(length=36), sa.ForeignKey("pharmacies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pharmacist_id", sa.String(length=36), sa.ForeignKey("pharmacists.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("generic_name", sa.String(length=200), nullable=True),
        sa.Column("dosage_form", sa.String(length=60), nullable=True),
        sa.Column("strength", sa.String(length=80), nullable=True),
        sa.Column("instructions", sa.String(length=1000), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "medication_schedules",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("medication_id", sa.String(length=36), sa.ForeignKey("medication_records.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column(
            "frequency",
            sa.Enum("daily", "twice_daily", "weekly", "as_needed", name="medicationfrequency", native_enum=False),
            nullable=False,
        ),
        sa.Column("time_of_day", sa.String(length=120), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("actor_id", sa.String(length=36), nullable=True),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("details", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    """Drop pharmacy verification and medication tables."""
    op.drop_table("audit_logs")
    op.drop_table("medication_schedules")
    op.drop_table("medication_records")
    op.drop_table("verification_records")
    op.drop_table("pharmacy_licenses")
    op.drop_table("pharmacists")
    op.drop_table("pharmacies")
