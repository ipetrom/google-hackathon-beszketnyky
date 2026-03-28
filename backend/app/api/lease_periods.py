import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.apartment import Apartment
from app.models.lease_period import LeasePeriod
from app.schemas.lease_period import LeasePeriodCreate, LeasePeriodResponse, LeasePeriodUpdate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["lease-periods"])


@router.get("/apartments/{apartment_id}/lease-periods")
async def get_lease_periods(
    apartment_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Get all lease periods for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    lease_periods = (
        db.query(LeasePeriod)
        .filter(LeasePeriod.apartment_id == apartment_id)
        .order_by(LeasePeriod.start_date.desc())
        .all()
    )
    return {"lease_periods": [LeasePeriodResponse.model_validate(lp) for lp in lease_periods]}


@router.post(
    "/apartments/{apartment_id}/lease-periods",
    status_code=status.HTTP_201_CREATED,
    response_model=LeasePeriodResponse,
)
async def create_lease_period(
    apartment_id: str,
    data: LeasePeriodCreate,
    db: Session = Depends(get_db),
) -> LeasePeriodResponse:
    """Create a new lease period for an apartment."""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Apartment {apartment_id} not found",
        )

    lease_period = LeasePeriod(
        id=uuid.uuid4(),
        apartment_id=apartment_id,
        tenant_name=data.tenant_name,
        start_date=data.start_date,
        end_date=data.end_date,
        rental_type=data.rental_type,
        status="active",
    )
    db.add(lease_period)
    db.commit()
    db.refresh(lease_period)
    logger.info("Created lease period %s for apartment %s", lease_period.id, apartment_id)
    return LeasePeriodResponse.model_validate(lease_period)


@router.patch("/lease-periods/{lease_period_id}", response_model=LeasePeriodResponse)
async def update_lease_period(
    lease_period_id: str,
    data: LeasePeriodUpdate,
    db: Session = Depends(get_db),
) -> LeasePeriodResponse:
    """Update a lease period."""
    lease_period = db.query(LeasePeriod).filter(LeasePeriod.id == lease_period_id).first()
    if not lease_period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lease period {lease_period_id} not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lease_period, field, value)

    db.commit()
    db.refresh(lease_period)
    logger.info("Updated lease period %s", lease_period_id)
    return LeasePeriodResponse.model_validate(lease_period)


@router.delete("/lease-periods/{lease_period_id}")
async def delete_lease_period(
    lease_period_id: str,
    db: Session = Depends(get_db),
) -> dict:
    """Delete a lease period."""
    lease_period = db.query(LeasePeriod).filter(LeasePeriod.id == lease_period_id).first()
    if not lease_period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lease period {lease_period_id} not found",
        )

    db.delete(lease_period)
    db.commit()
    logger.info("Deleted lease period %s", lease_period_id)
    return {"message": "Lease period deleted"}
