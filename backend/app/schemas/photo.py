from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    apartment_id: UUID
    storage_url: str
    room_type: str | None = None
    photo_type: str
    uploaded_at: datetime
