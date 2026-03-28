import logging
import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.apartment import Apartment
from app.models.photo import Photo
from app.schemas.apartment import ApartmentCreate, ApartmentResponse, ApartmentUpdate
from app.schemas.photo import PhotoResponse
from app.services import gcs_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/apartments", tags=["apartments"])


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

    # Clean up photos from GCS (best-effort)
    try:
        deleted_count = gcs_service.delete_apartment_photos(str(apartment_id))
        logger.info("Cleaned up %d photos from GCS for apartment %s", deleted_count, apartment_id)
    except Exception as e:
        logger.warning("Failed to clean up GCS photos for apartment %s: %s", apartment_id, e)

    db.delete(apartment)
    db.commit()
    logger.info("Deleted apartment %s", apartment_id)
    return {"message": "Apartment deleted"}


# --- Photo endpoints ---


async def _save_uploaded_photos(
    apartment_id: str,
    files: list[UploadFile],
    room_types: list[str] | None,
    photo_type: str,
    db: Session,
) -> list[dict]:
    """Upload photos to GCS and create DB records."""
    photo_responses = []
    for i, file in enumerate(files):
        photo_id = uuid.uuid4()
        ext = os.path.splitext(file.filename or "photo.jpg")[1] or ".jpg"

        file_bytes = await file.read()

        # Upload to GCS
        object_path = gcs_service.upload_photo(
            apartment_id=apartment_id,
            photo_id=str(photo_id),
            file_bytes=file_bytes,
            content_type=file.content_type or "image/jpeg",
            ext=ext,
            photo_type=photo_type,
        )

        room_type = None
        if room_types and i < len(room_types):
            room_type = room_types[i]

        photo = Photo(
            id=photo_id,
            apartment_id=apartment_id,
            storage_url=object_path,  # Store GCS object path
            room_type=room_type,
            photo_type=photo_type,
        )
        db.add(photo)
        db.flush()

        # Return with public URL
        response = PhotoResponse.model_validate(photo)
        response_dict = response.model_dump()
        response_dict["storage_url"] = gcs_service.get_public_url(object_path)
        photo_responses.append(response_dict)

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

    photos = await _save_uploaded_photos(apartment_id, files, room_types, "move-in", db)
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
    photo_list = []
    for p in photos:
        response = PhotoResponse.model_validate(p)
        response_dict = response.model_dump()
        response_dict["storage_url"] = gcs_service.get_public_url(p.storage_url)
        photo_list.append(response_dict)
    return {"photos": photo_list}


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

    photos = await _save_uploaded_photos(apartment_id, files, room_types, "move-out", db)
    logger.info("Uploaded %d move-out photos for apartment %s", len(photos), apartment_id)
    return {"photos": photos}
