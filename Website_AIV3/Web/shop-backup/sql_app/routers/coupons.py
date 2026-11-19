from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from .products import get_current_admin

router = APIRouter(prefix="/coupons", tags=["Coupons"])


def _validate_payload(payload, partial=False):
    code = getattr(payload, "code", None)
    discount_type = getattr(payload, "discount_type", None)
    discount_value = getattr(payload, "discount_value", None)
    min_order_amount = getattr(payload, "min_order_amount", None)
    max_discount = getattr(payload, "max_discount", None)
    usage_limit = getattr(payload, "usage_limit", None)
    starts_at = getattr(payload, "starts_at", None)
    ends_at = getattr(payload, "ends_at", None)

    if not partial or code is not None:
        if not code or crud.normalize_coupon_code(code) != code.strip().upper():
            raise HTTPException(status_code=400, detail="Coupon code is required")
    if not partial or discount_type is not None:
        if discount_type not in {"percentage", "fixed"}:
            raise HTTPException(status_code=400, detail="Invalid discount type")
    if not partial or discount_value is not None:
        if discount_value is None or discount_value <= 0:
            raise HTTPException(status_code=400, detail="Discount value must be positive")
        if discount_type == "percentage" and discount_value > 100:
            raise HTTPException(status_code=400, detail="Percentage cannot exceed 100")
    for value in (min_order_amount, max_discount, usage_limit):
        if value is not None and value < 0:
            raise HTTPException(status_code=400, detail="Coupon values cannot be negative")
    if starts_at and ends_at and ends_at < starts_at:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")


@router.get("", response_model=List[schemas.Coupon])
def list_all_coupons(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    return crud.list_coupons(db)


@router.post("", response_model=schemas.Coupon, status_code=status.HTTP_201_CREATED)
def create_new_coupon(
    coupon: schemas.CouponCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    _validate_payload(coupon)
    if crud.get_coupon_by_code(db, coupon.code):
        raise HTTPException(status_code=409, detail="Coupon code already exists")
    return crud.create_coupon(db, coupon)


@router.put("/{coupon_id}", response_model=schemas.Coupon)
def update_existing_coupon(
    coupon_id: int,
    coupon: schemas.CouponUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    existing_coupon = crud.get_coupon(db, coupon_id)
    if not existing_coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    effective_type = coupon.discount_type or existing_coupon.discount_type
    effective_value = coupon.discount_value if coupon.discount_value is not None else existing_coupon.discount_value
    if effective_type not in {"percentage", "fixed"}:
        raise HTTPException(status_code=400, detail="Invalid discount type")
    if effective_value <= 0 or (effective_type == "percentage" and effective_value > 100):
        raise HTTPException(status_code=400, detail="Invalid discount value")
    _validate_payload(coupon, partial=True)
    if coupon.code:
        existing = crud.get_coupon_by_code(db, coupon.code)
        if existing and existing.id != coupon_id:
            raise HTTPException(status_code=409, detail="Coupon code already exists")
    return crud.update_coupon(db, coupon_id, coupon)


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    if not crud.delete_coupon(db, coupon_id):
        raise HTTPException(status_code=404, detail="Coupon not found")


@router.post("/validate", response_model=schemas.CouponValidateResponse)
def validate_coupon_code(payload: schemas.CouponValidateRequest, db: Session = Depends(get_db)):
    if payload.subtotal < 0:
        return schemas.CouponValidateResponse(
            valid=False,
            code=crud.normalize_coupon_code(payload.code),
            discount_amount=0,
            message="Subtotal cannot be negative",
        )
    try:
        coupon, discount_amount = crud.validate_coupon(db, payload.code, payload.subtotal)
    except crud.CouponValidationError as exc:
        return schemas.CouponValidateResponse(
            valid=False,
            code=crud.normalize_coupon_code(payload.code),
            discount_amount=0,
            message=str(exc),
        )
    return schemas.CouponValidateResponse(
        valid=True,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=discount_amount,
        message="Coupon applied successfully",
    )
