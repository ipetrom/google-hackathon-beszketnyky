import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Listing(Base):
    __tablename__ = "listings"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("apartments.id", ondelete="CASCADE"),
        nullable=False,
    )
    platform = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    amenities = Column(JSONB, nullable=True)
    price = Column(Float, nullable=True)
    rental_type = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    apartment = relationship("Apartment", back_populates="listings")

    __table_args__ = (
        Index("idx_listings_apartment_id", "apartment_id"),
        Index("idx_listings_platform", "platform"),
    )
