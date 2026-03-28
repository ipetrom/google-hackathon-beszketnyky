from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InventoryItemCreate(BaseModel):
    room_type: str | None = None
    item_type: str
    condition_notes: str | None = None
    photo_id: str | None = None
    object_type: str | None = None
    color: str | None = None
    material: str | None = None
    condition: str | None = None
    position: str | None = None


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    apartment_id: UUID
    room_type: str | None = None
    item_type: str
    condition_notes: str | None = None
    photo_id: UUID | None = None
    object_type: str | None = None
    color: str | None = None
    material: str | None = None
    condition: str | None = None
    position: str | None = None
    created_at: datetime


class InventoryUpdate(BaseModel):
    items: list[InventoryItemCreate]
