import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("apartments.id", ondelete="CASCADE"),
        nullable=False,
    )
    room_type = Column(String(50), nullable=True)
    item_type = Column(String(100), nullable=False)
    condition_notes = Column(Text, nullable=True)
    photo_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("photos.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    apartment = relationship("Apartment", back_populates="inventory_items")
    photo = relationship("Photo", back_populates="inventory_items")

    __table_args__ = (Index("idx_inventory_items_apartment_id", "apartment_id"),)
