import uuid

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address = Column(String(255), nullable=False)
    building = Column(String(50), nullable=True)
    apartment_number = Column(String(50), nullable=True)
    city = Column(String(100), nullable=False)
    rooms = Column(Integer, nullable=False)
    sqm = Column(Float, nullable=False)
    floor = Column(Integer, nullable=True)
    specifications = Column(JSONB, nullable=True)
    status = Column(String(50), nullable=False, default="vacant")
    thumbnail_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    photos = relationship("Photo", back_populates="apartment", cascade="all, delete-orphan")
    inventory_items = relationship(
        "InventoryItem", back_populates="apartment", cascade="all, delete-orphan"
    )
    listings = relationship("Listing", back_populates="apartment", cascade="all, delete-orphan")
    conversations = relationship(
        "Conversation", back_populates="apartment", cascade="all, delete-orphan"
    )
    lease_periods = relationship(
        "LeasePeriod", back_populates="apartment", cascade="all, delete-orphan"
    )
    damage_report = relationship(
        "DamageReport", back_populates="apartment", cascade="all, delete-orphan", uselist=False
    )

    __table_args__ = (
        Index("idx_apartments_status", "status"),
        Index("idx_apartments_city", "city"),
    )
