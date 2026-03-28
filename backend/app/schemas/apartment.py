from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApartmentCreate(BaseModel):
    address: str
    building: str | None = None
    apartment_number: str | None = None
    city: str
    rooms: int = Field(ge=1, le=10)
    sqm: float = Field(ge=10, le=300)
    floor: int | None = None
    specifications: dict | None = None


class ApartmentUpdate(BaseModel):
    address: str | None = None
    building: str | None = None
    apartment_number: str | None = None
    city: str | None = None
    rooms: int | None = Field(default=None, ge=1, le=10)
    sqm: float | None = Field(default=None, ge=10, le=300)
    floor: int | None = None
    specifications: dict | None = None
    status: str | None = None
    thumbnail_url: str | None = None


class ApartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    address: str
    building: str | None = None
    apartment_number: str | None = None
    city: str
    rooms: int
    sqm: float
    floor: int | None = None
    specifications: dict | None = None
    status: str
    thumbnail_url: str | None = None
    created_at: datetime
    updated_at: datetime
