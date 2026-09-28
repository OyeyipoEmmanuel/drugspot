"""Add NAFDAC verification metadata to products.

Revision ID: 9f1c2b7a4d6e
Revises: 0cd34eef93f8
Create Date: 2026-09-27 22:15:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "9f1c2b7a4d6e"
down_revision: str | None = "0cd34eef93f8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("nafdac_number", sa.String(length=50), server_default="", nullable=False),
    )
    op.add_column("products", sa.Column("nafdac_product_id", sa.Integer(), nullable=True))
    op.add_column(
        "products",
        sa.Column("nafdac_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("products", sa.Column("nafdac_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "products",
        sa.Column("nafdac_product_name", sa.String(length=200), server_default="", nullable=False),
    )
    op.add_column(
        "products",
        sa.Column("nafdac_manufacturer", sa.String(length=255), server_default="", nullable=False),
    )
    op.add_column("products", sa.Column("nafdac_approval_date", sa.Date(), nullable=True))
    op.add_column("products", sa.Column("nafdac_expiry_date", sa.Date(), nullable=True))
    op.create_index("ix_products_nafdac_number", "products", ["nafdac_number"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_products_nafdac_number", table_name="products")
    op.drop_column("products", "nafdac_expiry_date")
    op.drop_column("products", "nafdac_approval_date")
    op.drop_column("products", "nafdac_manufacturer")
    op.drop_column("products", "nafdac_product_name")
    op.drop_column("products", "nafdac_verified_at")
    op.drop_column("products", "nafdac_verified")
    op.drop_column("products", "nafdac_product_id")
    op.drop_column("products", "nafdac_number")
