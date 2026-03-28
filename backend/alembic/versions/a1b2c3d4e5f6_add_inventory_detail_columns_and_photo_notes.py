"""add inventory detail columns and photo notes

Revision ID: a1b2c3d4e5f6
Revises: 75d4c5a39bf5
Create Date: 2026-03-28 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "75d4c5a39bf5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("inventory_items", sa.Column("object_type", sa.String(50), nullable=True))
    op.add_column("inventory_items", sa.Column("color", sa.String(100), nullable=True))
    op.add_column("inventory_items", sa.Column("material", sa.String(100), nullable=True))
    op.add_column("inventory_items", sa.Column("condition", sa.String(50), nullable=True))
    op.add_column("inventory_items", sa.Column("position", sa.String(255), nullable=True))
    op.add_column("apartments", sa.Column("photo_notes", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("inventory_items", "object_type")
    op.drop_column("inventory_items", "color")
    op.drop_column("inventory_items", "material")
    op.drop_column("inventory_items", "condition")
    op.drop_column("inventory_items", "position")
    op.drop_column("apartments", "photo_notes")
