"""Add product reference image URL.

Revision ID: b7e2f4a9c1d3
Revises: 9f1c2b7a4d6e
Create Date: 2026-09-27 23:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b7e2f4a9c1d3"
down_revision: str | None = "9f1c2b7a4d6e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("image_url", sa.String(length=1000), server_default="", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("products", "image_url")
