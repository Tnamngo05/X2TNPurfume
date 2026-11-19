from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, auth
from ..database import get_db

router = APIRouter()

@router.post("/add")
def add_to_cart(
    cart_item: schemas.OrderItemCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    # Kiểm tra sản phẩm tồn tại và có đủ hàng
    product = crud.get_product(db, product_id=cart_item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.stock < cart_item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    # Ở đây chúng ta có thể lưu giỏ hàng vào database hoặc session
    # Tạm thời trả về thông báo thành công
    return {"message": "Product added to cart successfully", "product_id": cart_item.product_id}