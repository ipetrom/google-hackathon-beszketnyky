import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.apartment import Apartment
from app.models.inventory_item import InventoryItem
from app.schemas.inventory import InventoryItemResponse, InventoryUpdate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["inventory"])


@router.get("/apartments/{apartment_id}/inventory")
async def get_inventory(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get all inventory items for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    items = (
        db.query(InventoryItem)
        .filter(InventoryItem.apartment_id == apartment_id)
        .order_by(InventoryItem.created_at.desc())
        .all()
    )
    return {"inventory_items": [InventoryItemResponse.model_validate(item) for item in items]}


@router.post("/apartments/{apartment_id}/inventory/generate")
async def generate_inventory(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Generate inventory items from apartment photos using Gemini Vision AI."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    # Fetch all move-in photos
    from app.models.photo import Photo
    photos = (
        db.query(Photo)
        .filter(Photo.apartment_id == apartment_id, Photo.photo_type == "move-in")
        .all()
    )

    if not photos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No photos uploaded. Upload photos first before generating inventory.",
        )

    # Analyze each photo with Gemini Vision
    from app.services import inventory_ai_service
    from app.core.config import settings

    photo_results = []
    for photo in photos:
        gcs_uri = f"gs://{settings.GCS_BUCKET_NAME}/{photo.storage_url}"
        logger.info("Analyzing photo: %s", gcs_uri)
        result = inventory_ai_service.analyze_photo(gcs_uri)
        photo_results.append(result)

    # Delete existing inventory items
    db.query(InventoryItem).filter(InventoryItem.apartment_id == apartment_id).delete()

    # Save items per photo (NO deduplication across photos — each photo is a separate group)
    created_items = []
    photo_notes = []
    for photo, result in zip(photos, photo_results):
        if result.get("photo_notes"):
            photo_notes.append({
                "detected_room": result.get("detected_room", "unknown"),
                "notes": result.get("photo_notes", ""),
                "photo_id": str(photo.id),
            })

        for obj in result.get("objects", []):
            item = InventoryItem(
                id=uuid.uuid4(),
                apartment_id=apartment_id,
                room_type=result.get("detected_room", obj.get("room")),
                item_type=obj.get("name", "Unknown"),
                condition_notes=obj.get("notes"),
                object_type=obj.get("type"),
                color=obj.get("color"),
                material=obj.get("material"),
                condition=obj.get("condition"),
                position=obj.get("position"),
                photo_id=photo.id,  # Link item to its source photo
            )
            db.add(item)
            db.flush()
            created_items.append(InventoryItemResponse.model_validate(item))

    # Save photo notes on apartment
    apartment.photo_notes = photo_notes
    db.commit()

    logger.info(
        "Generated %d inventory items for apartment %s from %d photos",
        len(created_items), apartment_id, len(photos),
    )
    return {
        "inventory_items": created_items,
        "photo_notes": photo_notes,
        "message": f"Analyzed {len(photos)} photos, found {len(created_items)} items",
    }


@router.patch("/apartments/{apartment_id}/inventory")
async def update_inventory(
    apartment_id: str,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
) -> dict:
    """Update inventory items for an apartment (replace all)."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    # Delete existing inventory items
    db.query(InventoryItem).filter(InventoryItem.apartment_id == apartment_id).delete()

    # Insert new items
    new_items: list[InventoryItemResponse] = []
    for item_data in data.items:
        item = InventoryItem(
            id=uuid.uuid4(),
            apartment_id=apartment_id,
            room_type=item_data.room_type,
            item_type=item_data.item_type,
            condition_notes=item_data.condition_notes,
            photo_id=item_data.photo_id,
            object_type=item_data.object_type,
            color=item_data.color,
            material=item_data.material,
            condition=item_data.condition,
            position=item_data.position,
        )
        db.add(item)
        db.flush()
        new_items.append(InventoryItemResponse.model_validate(item))

    db.commit()
    logger.info("Updated inventory for apartment %s with %d items", apartment_id, len(new_items))
    return {"inventory_items": new_items}
