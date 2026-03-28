import logging
import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.apartment import Apartment
from app.models.damage_report import DamageReport
from app.models.inventory_item import InventoryItem
from app.models.photo import Photo
from app.schemas.moveout import (
    AssessmentItemResponse,
    DamageReportCreate,
    DamageReportResponse,
    MoveoutApartmentResponse,
    RoomAssessmentResponse,
    RoomGroupResponse,
    RoomItemResponse,
    ValidationResponse,
)
from app.services import damage_ai_service, gcs_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/moveout", tags=["moveout"])


@router.get("/apartments")
async def list_moveout_apartments(db: Session = Depends(get_db)) -> dict:
    """List apartments eligible for move-out inspection."""
    apartments = db.query(Apartment).order_by(Apartment.created_at.desc()).all()
    result = []
    for apt in apartments:
        inventory_count = db.query(InventoryItem).filter(InventoryItem.apartment_id == apt.id).count()
        result.append({
            "id": str(apt.id),
            "address": apt.address,
            "city": apt.city,
            "rooms": apt.rooms,
            "sqm": apt.sqm,
            "status": apt.status,
            "inventory_count": inventory_count,
            "moveout_date": "2026-03-31",
        })
    return {"apartments": result}


@router.get("/apartments/{apartment_id}/rooms")
async def get_apartment_rooms(apartment_id: str, db: Session = Depends(get_db)) -> dict:
    """Get inventory items grouped by room for move-out inspection."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    items = db.query(InventoryItem).filter(InventoryItem.apartment_id == apartment_id).all()

    rooms: dict[str, list] = {}
    for item in items:
        room = item.room_type or "other"
        if room not in rooms:
            rooms[room] = []
        rooms[room].append(RoomItemResponse.model_validate(item))

    return {
        "rooms": [
            RoomGroupResponse(room_name=room_name, items=room_items)
            for room_name, room_items in rooms.items()
        ]
    }


@router.post("/apartments/{apartment_id}/rooms/{room}/validate")
async def validate_room_photo(
    apartment_id: str,
    room: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
) -> dict:
    """Upload move-out photo for a room and validate that expected items are present."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    # Get expected items for this room
    items = db.query(InventoryItem).filter(
        InventoryItem.apartment_id == apartment_id,
        InventoryItem.room_type == room,
    ).all()

    if not items:
        raise HTTPException(status_code=400, detail=f"No inventory items found for room: {room}")

    # Upload first photo to GCS
    file = files[0]
    photo_id = uuid.uuid4()
    ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
    file_bytes = await file.read()

    object_path = gcs_service.upload_photo(
        apartment_id=apartment_id,
        photo_id=str(photo_id),
        file_bytes=file_bytes,
        content_type=file.content_type or "image/jpeg",
        ext=ext,
        photo_type="move-out",
    )

    # Save photo record
    photo = Photo(
        id=photo_id,
        apartment_id=apartment_id,
        storage_url=object_path,
        room_type=room,
        photo_type="move-out",
    )
    db.add(photo)
    db.commit()

    # Validate with AI
    gcs_uri = f"gs://{settings.GCS_BUCKET_NAME}/{object_path}"
    expected = [
        {
            "item_type": item.item_type,
            "color": item.color,
            "material": item.material,
        }
        for item in items
    ]

    result = damage_ai_service.validate_objects_in_photo(gcs_uri, expected)
    result["photo_url"] = gcs_service.get_public_url(object_path)
    result["photo_storage_url"] = object_path

    return result


@router.post("/apartments/{apartment_id}/rooms/{room}/assess")
async def assess_room_damage(
    apartment_id: str,
    room: str,
    body: dict,
    db: Session = Depends(get_db),
) -> dict:
    """Run damage assessment on a validated move-out photo for a room."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    photo_storage_url = body.get("photo_storage_url")
    if not photo_storage_url:
        raise HTTPException(status_code=400, detail="photo_storage_url is required")

    items = db.query(InventoryItem).filter(
        InventoryItem.apartment_id == apartment_id,
        InventoryItem.room_type == room,
    ).all()

    gcs_uri = f"gs://{settings.GCS_BUCKET_NAME}/{photo_storage_url}"
    inventory_data = [
        {
            "item_type": item.item_type,
            "object_type": item.object_type,
            "color": item.color,
            "material": item.material,
            "condition": item.condition,
            "condition_notes": item.condition_notes,
        }
        for item in items
    ]

    result = damage_ai_service.assess_damage(gcs_uri, inventory_data, room)
    return result


@router.post("/apartments/{apartment_id}/report", status_code=201)
async def save_damage_report(
    apartment_id: str,
    body: DamageReportCreate,
    db: Session = Depends(get_db),
) -> dict:
    """Save finalized damage report."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    # Delete existing report if any
    existing = db.query(DamageReport).filter(DamageReport.apartment_id == apartment_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    report = DamageReport(
        apartment_id=apartment_id,
        report_data=body.report_data,
        notes=body.notes,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    logger.info("Saved damage report for apartment %s", apartment_id)
    return DamageReportResponse.model_validate(report).model_dump(mode="json")


@router.get("/apartments/{apartment_id}/report")
async def get_damage_report(apartment_id: str, db: Session = Depends(get_db)) -> dict:
    """Get damage report for an apartment."""
    report = db.query(DamageReport).filter(DamageReport.apartment_id == apartment_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="No damage report found for this apartment")
    return DamageReportResponse.model_validate(report).model_dump(mode="json")
