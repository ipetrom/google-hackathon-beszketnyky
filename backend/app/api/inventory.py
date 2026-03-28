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
    """Generate inventory items for an apartment (mock for MVP)."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    mock_items = [
        {"room_type": "living_room", "item_type": "Sofa", "condition_notes": "Good condition"},
        {"room_type": "living_room", "item_type": "Coffee Table", "condition_notes": "Minor scratches"},
        {"room_type": "living_room", "item_type": "TV", "condition_notes": "Working, 55 inch"},
        {"room_type": "bathroom", "item_type": "Washing Machine", "condition_notes": "Good condition"},
        {"room_type": "kitchen", "item_type": "Refrigerator", "condition_notes": "Good condition, clean"},
    ]

    created_items: list[InventoryItemResponse] = []
    for item_data in mock_items:
        item = InventoryItem(
            id=uuid.uuid4(),
            apartment_id=apartment_id,
            room_type=item_data["room_type"],
            item_type=item_data["item_type"],
            condition_notes=item_data["condition_notes"],
        )
        db.add(item)
        db.flush()
        created_items.append(InventoryItemResponse.model_validate(item))

    db.commit()
    logger.info("Generated %d mock inventory items for apartment %s", len(created_items), apartment_id)
    return {"inventory_items": created_items, "message": "Inventory generated (mock)"}


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
        )
        db.add(item)
        db.flush()
        new_items.append(InventoryItemResponse.model_validate(item))

    db.commit()
    logger.info("Updated inventory for apartment %s with %d items", apartment_id, len(new_items))
    return {"inventory_items": new_items}
