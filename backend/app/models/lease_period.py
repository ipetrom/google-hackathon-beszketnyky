import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class LeasePeriod(Base):
    __tablename__ = "lease_periods"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("apartments.id", ondelete="CASCADE"),
        nullable=False,
    )
    tenant_name = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    rental_type = Column(String(50), nullable=True)
    status = Column(String(50), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    apartment = relationship("Apartment", back_populates="lease_periods")

    __table_args__ = (
        Index("idx_lease_periods_apartment_id", "apartment_id"),
        Index("idx_lease_periods_dates", "start_date", "end_date"),
    )
