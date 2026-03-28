import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.apartment import Apartment
from app.models.listing import Listing
from app.schemas.listing import ListingGenerateRequest, ListingResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["listings"])


class ListingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


@router.get("/apartments/{apartment_id}/listings")
async def get_listings(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get all listings for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    listings = (
        db.query(Listing)
        .filter(Listing.apartment_id == apartment_id)
        .order_by(Listing.created_at.desc())
        .all()
    )
    return {"listings": [ListingResponse.model_validate(lst) for lst in listings]}


@router.post("/apartments/{apartment_id}/listings/generate")
async def generate_listings(
    apartment_id: str,
    data: ListingGenerateRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Generate listings for an apartment (mock for MVP)."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    created_listings: list[ListingResponse] = []
    for platform in data.platforms:
        listing = Listing(
            id=uuid.uuid4(),
            apartment_id=apartment_id,
            platform=platform,
            title=f"{apartment.rooms}-room apartment in {apartment.city} - {platform.capitalize()}",
            description=(
                f"Beautiful {apartment.rooms}-room apartment located at {apartment.address}, "
                f"{apartment.city}. {apartment.sqm} sqm of living space. "
                f"Available for {data.rental_type} rental at {data.price} PLN. "
                f"(This is a placeholder listing for {platform}.)"
            ),
            amenities=apartment.specifications,
            price=data.price,
            rental_type=data.rental_type,
            status="draft",
        )
        db.add(listing)
        db.flush()
        created_listings.append(ListingResponse.model_validate(listing))

    db.commit()
    logger.info(
        "Generated %d mock listings for apartment %s on platforms: %s",
        len(created_listings),
        apartment_id,
        ", ".join(data.platforms),
    )
    return {"listings": created_listings}


@router.patch("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: str,
    data: ListingUpdate,
    db: Session = Depends(get_db),
) -> ListingResponse:
    """Update a listing's title or description."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing {listing_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)
    logger.info("Updated listing %s", listing_id)
    return ListingResponse.model_validate(listing)
