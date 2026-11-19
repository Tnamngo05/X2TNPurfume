import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from .products import get_current_admin

logger = logging.getLogger("orders")

router = APIRouter()


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


@router.post("/orders", response_model=schemas.OrderCreateResponse)
def create_new_order(order: schemas.OrderCreate, request: Request, db: Session = Depends(get_db)):
    try:
        created_order = crud.create_order(db=db, order_data=order, customer_ip=_get_client_ip(request))
    except crud.OrderValidationError as exc:
        logger.warning("Order validation failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))

    logger.info(
        "Order created id=%s payment_method=%s payment_status=%s total=%s",
        created_order.id, created_order.payment_method, created_order.payment_status, created_order.total_price,
    )

    message = (
        "Đơn hàng đã được tiếp nhận, đang chờ giao"
        if created_order.payment_method == "COD"
        else "Đơn hàng đã được tạo, vui lòng hoàn tất thanh toán"
    )
    return schemas.OrderCreateResponse(
        order_id=created_order.id,
        payment_method=created_order.payment_method,
        payment_status=created_order.payment_status,
        message=message,
    )


@router.get("/orders/{order_id}", response_model=schemas.OrderOut)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return crud.build_order_out(order)


@router.get("/admin/orders", response_model=List[schemas.OrderOut])
def list_admin_orders(
    payment_status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    customer_name: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    orders = crud.list_orders(
        db,
        payment_status=payment_status,
        payment_method=payment_method,
        customer_name=customer_name,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return [crud.build_order_out(o) for o in orders]


@router.post("/contact")
def create_contact_form_entry(message: schemas.ContactMessageCreate, db: Session = Depends(get_db)):
    crud.create_contact_message(db=db, message=message)
    return {"message": "Contact message received"}
