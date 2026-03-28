from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MoveoutApartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    address: str
    city: str
    rooms: int
    sqm: float
    status: str
    inventory_count: int
    moveout_date: str


class RoomItemResponse(BaseModel):
    id: UUID
    item_type: str
    object_type: str | None = None
    color: str | None = None
    material: str | None = None
    condition: str | None = None
    condition_notes: str | None = None
    model_config = ConfigDict(from_attributes=True)


class RoomGroupResponse(BaseModel):
    room_name: str
    photo_id: str | None = None
    photo_url: str | None = None
    items: list[RoomItemResponse]


class ValidationResponse(BaseModel):
    detected_items: list[str]
    missing_items: list[str]
    notes: str
    photo_url: str | None = None


class AssessmentItemResponse(BaseModel):
    item_name: str
    original_condition: str | None = None
    current_status: str  # ok, damaged, missing
    damage_description: str | None = None
    action: str | None = None  # repair, replace, null
    estimated_cost_pln: float = 0


class RoomAssessmentResponse(BaseModel):
    room: str
    assessments: list[AssessmentItemResponse]
    room_notes: str | None = None


class DamageReportCreate(BaseModel):
    report_data: dict
    notes: str | None = None


class DamageReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    apartment_id: UUID
    report_data: dict
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
