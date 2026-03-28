"""initial schema

Revision ID: 75d4c5a39bf5
Revises:
Create Date: 2026-03-28 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "75d4c5a39bf5"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === apartments ===
    op.create_table(
        "apartments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("building", sa.String(length=50), nullable=True),
        sa.Column("apartment_number", sa.String(length=50), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("rooms", sa.Integer(), nullable=False),
        sa.Column("sqm", sa.Float(), nullable=False),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("specifications", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="vacant"),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_apartments_status", "apartments", ["status"], unique=False)
    op.create_index("idx_apartments_city", "apartments", ["city"], unique=False)

    # === photos ===
    op.create_table(
        "photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("apartment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("storage_url", sa.String(length=500), nullable=False),
        sa.Column("room_type", sa.String(length=50), nullable=True),
        sa.Column("photo_type", sa.String(length=50), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["apartment_id"], ["apartments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_photos_apartment_id", "photos", ["apartment_id"], unique=False)
    op.create_index("idx_photos_photo_type", "photos", ["photo_type"], unique=False)

    # === inventory_items ===
    op.create_table(
        "inventory_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("apartment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("room_type", sa.String(length=50), nullable=True),
        sa.Column("item_type", sa.String(length=100), nullable=False),
        sa.Column("condition_notes", sa.Text(), nullable=True),
        sa.Column("photo_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["apartment_id"], ["apartments.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["photo_id"], ["photos.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_inventory_items_apartment_id", "inventory_items", ["apartment_id"], unique=False
    )

    # === listings ===
    op.create_table(
        "listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("apartment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("amenities", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("rental_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="draft"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["apartment_id"], ["apartments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_listings_apartment_id", "listings", ["apartment_id"], unique=False)
    op.create_index("idx_listings_platform", "listings", ["platform"], unique=False)

    # === conversations ===
    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("apartment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_name", sa.String(length=255), nullable=True),
        sa.Column("platform_source", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="ai_handled"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["apartment_id"], ["apartments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_conversations_apartment_id", "conversations", ["apartment_id"], unique=False
    )
    op.create_index("idx_conversations_status", "conversations", ["status"], unique=False)

    # === messages ===
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender", sa.String(length=50), nullable=False),
        sa.Column("message_text", sa.Text(), nullable=False),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"], ["conversations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_messages_conversation_id", "messages", ["conversation_id"], unique=False
    )
    op.create_index("idx_messages_timestamp", "messages", ["timestamp"], unique=False)

    # === lease_periods ===
    op.create_table(
        "lease_periods",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("apartment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_name", sa.String(length=255), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("rental_type", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["apartment_id"], ["apartments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_lease_periods_apartment_id", "lease_periods", ["apartment_id"], unique=False
    )
    op.create_index(
        "idx_lease_periods_dates", "lease_periods", ["start_date", "end_date"], unique=False
    )

    # === damage_reports ===
    op.create_table(
        "damage_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("apartment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["apartment_id"], ["apartments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("apartment_id"),
    )


def downgrade() -> None:
    op.drop_table("damage_reports")
    op.drop_index("idx_lease_periods_dates", table_name="lease_periods")
    op.drop_index("idx_lease_periods_apartment_id", table_name="lease_periods")
    op.drop_table("lease_periods")
    op.drop_index("idx_messages_timestamp", table_name="messages")
    op.drop_index("idx_messages_conversation_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("idx_conversations_status", table_name="conversations")
    op.drop_index("idx_conversations_apartment_id", table_name="conversations")
    op.drop_table("conversations")
    op.drop_index("idx_listings_platform", table_name="listings")
    op.drop_index("idx_listings_apartment_id", table_name="listings")
    op.drop_table("listings")
    op.drop_index("idx_inventory_items_apartment_id", table_name="inventory_items")
    op.drop_table("inventory_items")
    op.drop_index("idx_photos_photo_type", table_name="photos")
    op.drop_index("idx_photos_apartment_id", table_name="photos")
    op.drop_table("photos")
    op.drop_index("idx_apartments_city", table_name="apartments")
    op.drop_index("idx_apartments_status", table_name="apartments")
    op.drop_table("apartments")
