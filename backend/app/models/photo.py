import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("apartments.id", ondelete="CASCADE"),
        nullable=False,
    )
    storage_url = Column(String(500), nullable=False)
    room_type = Column(String(50), nullable=True)
    photo_type = Column(String(50), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    apartment = relationship("Apartment", back_populates="photos")
    inventory_items = relationship("InventoryItem", back_populates="photo")

    __table_args__ = (
        Index("idx_photos_apartment_id", "apartment_id"),
        Index("idx_photos_photo_type", "photo_type"),
    )
