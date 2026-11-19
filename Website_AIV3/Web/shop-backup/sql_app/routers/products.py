from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List
from jose import JWTError, jwt

from .. import crud, models, schemas, security
from ..database import get_db

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user = Depends(get_current_user)):
    if not current_user.is_active or current_user.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

# === PUBLIC ROUTES ===
@router.get("/products", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@router.get("/products/{product_id}/related", response_model=List[schemas.RelatedProductResponse])
def read_related_products(product_id: int, db: Session = Depends(get_db)):
    related_products = crud.get_related_products(db, product_id=product_id, limit=4)
    if related_products is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return related_products

# === TRACKING XU HƯỚNG (không đăng nhập, ẩn danh) ===
@router.post("/products/track/search")
def track_search(payload: schemas.TrendSearchTrack, db: Session = Depends(get_db)):
    crud.track_search_trend(db, keyword=payload.keyword)
    return {"ok": True}

@router.post("/products/{product_id}/track-view")
def track_view(product_id: int, db: Session = Depends(get_db)):
    event = crud.track_click_trend(db, product_id=product_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}

# === ADMIN PROTECTED ROUTES ===
@router.post("/admin/products", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_new_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin)):
    return crud.create_product(db=db, product=product)

@router.put("/admin/products/{product_id}", response_model=schemas.Product)
def update_existing_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin)):
    db_product = crud.update_product(db, product_id, product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_a_product(product_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_admin)):
    db_product = crud.delete_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}