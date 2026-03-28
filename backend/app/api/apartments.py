import logging
import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.apartment import Apartment
from app.models.photo import Photo
from app.schemas.apartment import ApartmentCreate, ApartmentResponse, ApartmentUpdate
from app.schemas.photo import PhotoResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/apartments", tags=["apartments"])

UPLOAD_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


@router.get("")
async def list_apartments(db: Session = Depends(get_db)) -> dict:
    """List all apartments."""
    apartments = db.query(Apartment).order_by(Apartment.created_at.desc()).all()
    return {
        "apartments": [
            ApartmentResponse.model_validate(apt) for apt in apartments
        ]
    }


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ApartmentResponse)
async def create_apartment(
    data: ApartmentCreate,
    db: Session = Depends(get_db),
) -> ApartmentResponse:
    """Create a new apartment."""
    apartment = Apartment(
        address=data.address,
        building=data.building,
        apartment_number=data.apartment_number,
        city=data.city,
        rooms=data.rooms,
        sqm=data.sqm,
        floor=data.floor,
        specifications=data.specifications,
        status="vacant",
    )
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    logger.info("Created apartment %s at %s, %s", apartment.id, data.address, data.city)
    return ApartmentResponse.model_validate(apartment)


@router.get("/{apartment_id}", response_model=ApartmentResponse)
async def get_apartment(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> ApartmentResponse:
    """Get a single apartment by ID."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )
    return ApartmentResponse.model_validate(apartment)


@router.patch("/{apartment_id}", response_model=ApartmentResponse)
async def update_apartment(
    apartment_id: str,
    data: ApartmentUpdate,
    db: Session = Depends(get_db),
) -> ApartmentResponse:
    """Update an apartment's fields."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(apartment, field, value)

    db.commit()
    db.refresh(apartment)
    logger.info("Updated apartment %s", apartment_id)
    return ApartmentResponse.model_validate(apartment)


@router.delete("/{apartment_id}")
async def delete_apartment(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Delete an apartment and all related data (cascade)."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    db.delete(apartment)
    db.commit()
    logger.info("Deleted apartment %s", apartment_id)
    return {"message": "Apartment deleted"}


# --- Photo endpoints ---


def _save_uploaded_photos(
    apartment_id: str,
    files: list[UploadFile],
    room_types: list[str] | None,
    photo_type: str,
    db: Session,
) -> list[PhotoResponse]:
    """Save uploaded photos to local storage and create DB records."""
    upload_dir = os.path.join(UPLOAD_BASE_DIR, "apartments", apartment_id)
    os.makedirs(upload_dir, exist_ok=True)

    photo_responses: list[PhotoResponse] = []
    for i, file in enumerate(files):
        photo_id = uuid.uuid4()
        ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"
        filename = f"{photo_id}{ext}"
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        room_type = None
        if room_types and i < len(room_types):
            room_type = room_types[i]

        storage_url = f"/uploads/apartments/{apartment_id}/{filename}"

        photo = Photo(
            id=photo_id,
            apartment_id=apartment_id,
            storage_url=storage_url,
            room_type=room_type,
            photo_type=photo_type,
        )
        db.add(photo)
        db.flush()
        photo_responses.append(PhotoResponse.model_validate(photo))

    db.commit()
    return photo_responses


@router.post("/{apartment_id}/photos")
async def upload_photos(
    apartment_id: str,
    files: list[UploadFile] = File(...),
    room_types: list[str] = Form(None),
    db: Session = Depends(get_db),
) -> dict:
    """Upload move-in photos for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    photos = _save_uploaded_photos(apartment_id, files, room_types, "move-in", db)
    logger.info("Uploaded %d move-in photos for apartment %s", len(photos), apartment_id)
    return {"photos": photos}


@router.get("/{apartment_id}/photos")
async def get_photos(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get all photos for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    photos = (
        db.query(Photo)
        .filter(Photo.apartment_id == apartment_id)
        .order_by(Photo.uploaded_at.desc())
        .all()
    )
    return {"photos": [PhotoResponse.model_validate(p) for p in photos]}


@router.post("/{apartment_id}/move-out-photos")
async def upload_move_out_photos(
    apartment_id: str,
    files: list[UploadFile] = File(...),
    room_types: list[str] = Form(None),
    db: Session = Depends(get_db),
) -> dict:
    """Upload move-out photos for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    photos = _save_uploaded_photos(apartment_id, files, room_types, "move-out", db)
    logger.info("Uploaded %d move-out photos for apartment %s", len(photos), apartment_id)
    return {"photos": photos}
