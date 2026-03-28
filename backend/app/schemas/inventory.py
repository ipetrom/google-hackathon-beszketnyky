from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InventoryItemCreate(BaseModel):
    room_type: str
    item_type: str
    condition_notes: str | None = None
    photo_id: str | None = None


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    apartment_id: UUID
    room_type: str | None = None
    item_type: str
    condition_notes: str | None = None
    photo_id: UUID | None = None
    created_at: datetime


class InventoryUpdate(BaseModel):
    items: list[InventoryItemCreate]
