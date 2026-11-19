from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Sử dụng SQLite cho đơn giản, hoặc đổi sang PostgreSQL
# SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
    # Nếu dùng SQLite, thêm: connect_args={"check_same_thread": False}
)

def ensure_product_schema():
    inspector = inspect(engine)
    if not inspector.has_table("products"):
        return

    columns = {col["name"] for col in inspector.get_columns("products")}
    with engine.begin() as conn:
        if "fragrance_family" not in columns:
            conn.execute(text("ALTER TABLE products ADD COLUMN fragrance_family VARCHAR"))


def ensure_trend_event_schema():
    inspector = inspect(engine)
    if not inspector.has_table("trend_events"):
        return

    columns = {col["name"] for col in inspector.get_columns("trend_events")}
    with engine.begin() as conn:
        if "source_product_id" not in columns:
            conn.execute(text("ALTER TABLE trend_events ADD COLUMN source_product_id INTEGER"))

def ensure_order_schema():
    inspector = inspect(engine)
    if not inspector.has_table("orders"):
        return

    columns = {col["name"] for col in inspector.get_columns("orders")}
    with engine.begin() as conn:
        if "subtotal" not in columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN subtotal FLOAT DEFAULT 0"))
        if "discount_amount" not in columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN discount_amount FLOAT DEFAULT 0"))
        if "shipping_fee" not in columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_fee FLOAT DEFAULT 0"))
        if "coupon_code" not in columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50)"))
        if "coupon_usage_counted" not in columns:
            conn.execute(text("ALTER TABLE orders ADD COLUMN coupon_usage_counted BOOLEAN DEFAULT 0"))

ensure_product_schema()
ensure_trend_event_schema()
ensure_order_schema()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency để lấy session db trong mỗi request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()