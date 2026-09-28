"""pharmacist applications

Revision ID: 23fb5d3c5649
Revises: c004a2094f0f
Create Date: 2026-09-27 15:30:42.618908
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "23fb5d3c5649"
down_revision: Union[str, None] = "c004a2094f0f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.alter_column(
            "role",
            existing_type=sa.VARCHAR(length=14),
            type_=sa.Enum(
                "patient",
                "pharmacist_applicant",
                "pharmacist",
                "pharmacy_admin",
                "platform_admin",
                name="userrole",
                native_enum=False,
            ),
            existing_nullable=False,
        )
    with op.batch_alter_table("verification_records") as batch:
        batch.add_column(sa.Column("pharmacist_id", sa.String(length=36), nullable=True))
        batch.alter_column("pharmacy_id", existing_type=sa.VARCHAR(length=36), nullable=True)
        batch.create_foreign_key(
            "fk_verification_records_pharmacist_id",
            "pharmacists",
            ["pharmacist_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    with op.batch_alter_table("verification_records") as batch:
        batch.drop_constraint("fk_verification_records_pharmacist_id", type_="foreignkey")
        batch.alter_column("pharmacy_id", existing_type=sa.VARCHAR(length=36), nullable=False)
        batch.drop_column("pharmacist_id")
    with op.batch_alter_table("users") as batch:
        batch.alter_column(
            "role",
            existing_type=sa.Enum(
                "patient",
                "pharmacist_applicant",
                "pharmacist",
                "pharmacy_admin",
                "platform_admin",
                name="userrole",
                native_enum=False,
            ),
            type_=sa.VARCHAR(length=14),
            existing_nullable=False,
        )

