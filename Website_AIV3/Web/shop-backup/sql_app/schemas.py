from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Product Schemas
class ProductBase(BaseModel):
    name: str
    brand: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    category: Optional[str] = "Nước hoa"
    gender: Optional[str] = "Unisex"
    description: Optional[str] = None
    stock: int
    is_featured: bool = False
    # --- THÊM 3 DÒNG NÀY ---
    concentration: Optional[str] = None
    longevity: Optional[str] = None
    origin: Optional[str] = None
    fragrance_family: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
     from_attributes = True

# Coupon Schemas
class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_order_amount: float = 0
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    used_count: int = 0
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True

class CouponCreate(CouponBase):
    used_count: int = 0

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class Coupon(CouponBase):
    id: int

    class Config:
        from_attributes = True

class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float

class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_amount: float = 0
    message: str

class RelatedProductResponse(Product):
    score: int
    reason: List[str]

class TrendSearchTrack(BaseModel):
    keyword: str

class TrendClickTrack(BaseModel):
    product_id: int

class AIRecommendedProduct(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    fragrance_family: Optional[str] = None
    short_intro: str
    reason: List[str]
    score: int

class AIRecommendationResponse(BaseModel):
    intro: str
    items: List[AIRecommendedProduct]

class AIRecommendationClickTrack(BaseModel):
    product_id: int
    source_product_id: Optional[int] = None

# User & Token Schemas
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Order Schemas
class OrderCreate(BaseModel):
    fullName: str
    email: str
    phone: str
    address: str
    city: str
    district: str
    ward: str
    paymentMethod: str
    note: Optional[str] = None
    cart: List[dict] # Nhận mảng cart từ frontend
    total: float
    couponCode: Optional[str] = None

class OrderCreateResponse(BaseModel):
    order_id: int
    payment_method: str
    payment_status: str
    message: str

class OrderOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    address: str
    city: str
    district: str
    ward: str
    note: Optional[str] = None
    payment_method: str
    payment_status: str
    items: List[dict]
    subtotal: float = 0
    discount_amount: float = 0
    shipping_fee: float = 0
    coupon_code: Optional[str] = None
    total_price: float
    transaction_id: Optional[str] = None
    bank_code: Optional[str] = None
    response_code: Optional[str] = None
    created_at: Optional[datetime] = None

class VNPayCreatePaymentRequest(BaseModel):
    order_id: int

class VNPayCreatePaymentResponse(BaseModel):
    payment_url: str

# Contact Schemas
class ContactMessageCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str
