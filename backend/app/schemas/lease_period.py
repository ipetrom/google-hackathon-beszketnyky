from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LeasePeriodCreate(BaseModel):
    tenant_name: str | None = None
    start_date: date
    end_date: date
    rental_type: str | None = None


class LeasePeriodUpdate(BaseModel):
    tenant_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    rental_type: str | None = None
    status: str | None = None


class LeasePeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    apartment_id: UUID
    tenant_name: str | None = None
    start_date: date
    end_date: date
    rental_type: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
