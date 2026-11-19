from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, Float, Text, DateTime
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    brand = Column(String, index=True)
    price = Column(Float, nullable=False)
    image_url = Column(String)
    category = Column(String, default="Nước hoa")
    gender = Column(String, default="Unisex")
    description = Column(Text)
    stock = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    # --- THÊM 3 DÒNG NÀY ---
    concentration = Column(String, nullable=True)
    longevity = Column(String, nullable=True)
    origin = Column(String, nullable=True)
    fragrance_family = Column(String, nullable=True)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_type = Column(String(20), nullable=False, default="percentage")
    discount_value = Column(Float, nullable=False)
    min_order_amount = Column(Float, nullable=False, default=0)
    max_discount = Column(Float, nullable=True)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, nullable=False, default=0)
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    district = Column(String, nullable=False)
    ward = Column(String, nullable=False)
    note = Column(Text)
    payment_method = Column(String, nullable=False)
    cart_items = Column(Text) # Lưu cart dưới dạng chuỗi JSON cho đơn giản
    subtotal = Column(Float, nullable=False, default=0)
    discount_amount = Column(Float, nullable=False, default=0)
    shipping_fee = Column(Float, nullable=False, default=0)
    coupon_code = Column(String(50), nullable=True)
    coupon_usage_counted = Column(Boolean, nullable=False, default=False)
    total_price = Column(Float, nullable=False)
    payment_status = Column(String, nullable=False, default="PENDING")
    customer_ip = Column(String)
    vnp_txn_ref = Column(String, unique=True, index=True)
    transaction_id = Column(String)
    bank_code = Column(String)
    response_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)

class TrendEvent(Base):
    __tablename__ = "trend_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)  # search | click | ai_click
    keyword = Column(String, nullable=True)
    product_id = Column(Integer, nullable=True)
    brand = Column(String, nullable=True)
    fragrance_family = Column(String, nullable=True)
    # Sản phẩm đang xem khi người dùng bấm vào 1 gợi ý AI (dùng cho thống kê hiệu quả gợi ý)
    source_product_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
