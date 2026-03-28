from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ConversationCreate(BaseModel):
    apartment_id: str
    tenant_name: str | None = None
    platform_source: str | None = None


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    apartment_id: UUID
    tenant_name: str | None = None
    platform_source: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    sender: str
    message_text: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    sender: str
    message_text: str
    timestamp: datetime
