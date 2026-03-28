import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DamageReport(Base):
    __tablename__ = "damage_reports"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("apartments.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    report_data = Column(JSONB, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    apartment = relationship("Apartment", back_populates="damage_report")
