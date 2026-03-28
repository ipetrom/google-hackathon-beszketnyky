from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    apartment_id: UUID
    platform: str
    title: str
    description: str
    amenities: dict | None = None
    price: float | None = None
    rental_type: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ListingGenerateRequest(BaseModel):
    platforms: list[str]
    rental_type: str
    price: float
