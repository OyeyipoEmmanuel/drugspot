"""Move pharmacy stock and pricing into inventory items.

Revision ID: f4d97c1a6b23
Revises: d3a6c8e1f2b4
Create Date: 2026-09-28 12:00:00
"""

from collections.abc import Sequence
from uuid import uuid4

import sqlalchemy as sa

from alembic import op

revision: str = "f4d97c1a6b23"
down_revision: str | None = "d3a6c8e1f2b4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "inventory_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("product_id", sa.String(36), nullable=False),
        sa.Column("pharmacy_id", sa.String(36), nullable=False),
        sa.Column("stock_count", sa.Integer(), nullable=False),
        sa.Column("reorder_level", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("preorder_supported", sa.Boolean(), nullable=False),
        sa.Column("estimated_restock_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pharmacy_id"], ["pharmacies.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_inventory_items_product_id", "inventory_items", ["product_id"])
    op.create_index("ix_inventory_items_pharmacy_id", "inventory_items", ["pharmacy_id"])

    connection = op.get_bind()
    products = connection.execute(
        sa.text(
            "SELECT id, pharmacy_id, stock_count, reorder_level, unit_price, preorder_supported, "
            "estimated_restock_date, is_active, created_at, updated_at FROM products"
        )
    ).mappings()
    for product in products:
        connection.execute(
            sa.text(
                "INSERT INTO inventory_items "
                "(id, product_id, pharmacy_id, stock_count, reorder_level, unit_price, preorder_supported, "
                "estimated_restock_date, is_active, created_at, updated_at) "
                "VALUES (:id, :product_id, :pharmacy_id, :stock_count, :reorder_level, :unit_price, "
                ":preorder_supported, :estimated_restock_date, :is_active, :created_at, :updated_at)"
            ),
            {**product, "id": str(uuid4()), "product_id": product["id"]},
        )

    op.drop_index("ix_products_pharmacy_id", table_name="products")
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_column("pharmacy_id")
        batch_op.drop_column("stock_count")
        batch_op.drop_column("reorder_level")
        batch_op.drop_column("unit_price")
        batch_op.drop_column("preorder_supported")
        batch_op.drop_column("estimated_restock_date")


def downgrade() -> None:
    connection = op.get_bind()
    duplicate_products = connection.execute(
        sa.text(
            "SELECT product_id FROM inventory_items GROUP BY product_id HAVING COUNT(*) > 1 LIMIT 1"
        )
    ).first()
    if duplicate_products is not None:
        raise RuntimeError("Cannot downgrade inventory items while a product is stocked by multiple pharmacies.")

    missing_inventory = connection.execute(
        sa.text(
            "SELECT products.id FROM products LEFT JOIN inventory_items "
            "ON inventory_items.product_id = products.id WHERE inventory_items.id IS NULL LIMIT 1"
        )
    ).first()
    if missing_inventory is not None:
        raise RuntimeError("Cannot downgrade products that do not have an inventory item.")

    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(sa.Column("pharmacy_id", sa.String(36), nullable=True))
        batch_op.add_column(sa.Column("stock_count", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("reorder_level", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("unit_price", sa.Numeric(12, 2), nullable=True))
        batch_op.add_column(sa.Column("preorder_supported", sa.Boolean(), nullable=True))
        batch_op.add_column(sa.Column("estimated_restock_date", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key(
            "fk_products_pharmacy_id_pharmacies",
            "pharmacies",
            ["pharmacy_id"],
            ["id"],
            ondelete="CASCADE",
        )

    connection.execute(
        sa.text(
            "UPDATE products SET pharmacy_id = inventory_items.pharmacy_id, "
            "stock_count = inventory_items.stock_count, reorder_level = inventory_items.reorder_level, "
            "unit_price = inventory_items.unit_price, preorder_supported = inventory_items.preorder_supported, "
            "estimated_restock_date = inventory_items.estimated_restock_date "
            "FROM inventory_items WHERE inventory_items.product_id = products.id"
        )
    )

    with op.batch_alter_table("products") as batch_op:
        batch_op.alter_column("pharmacy_id", existing_type=sa.String(36), nullable=False)
        batch_op.alter_column("stock_count", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("reorder_level", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("unit_price", existing_type=sa.Numeric(12, 2), nullable=False)
        batch_op.alter_column("preorder_supported", existing_type=sa.Boolean(), nullable=False)

    op.create_index("ix_products_pharmacy_id", "products", ["pharmacy_id"])
    op.drop_index("ix_inventory_items_pharmacy_id", table_name="inventory_items")
    op.drop_index("ix_inventory_items_product_id", table_name="inventory_items")
    op.drop_table("inventory_items")