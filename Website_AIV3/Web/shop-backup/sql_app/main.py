import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, crud, schemas
from .database import engine, get_db
from .routers import auth, products, orders, chat, vnpay, coupons
from .sample_data import sample_products

# ✅ THÊM 2 DÒNG NÀY
from dotenv import load_dotenv
import os
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="X2TN Perfume API",
    version="1.0.0",
    openapi_url="/x2tn_shop.json"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url and _frontend_url not in origins:
    origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ giữ chat
app.include_router(auth.router, prefix="/auth")
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(chat.router)
app.include_router(vnpay.router)  # 💳 VNPAY
app.include_router(coupons.router)

@app.on_event("startup")
def on_startup():
    db = next(get_db())

    admin = crud.get_user_by_username(db, "admin")
    if not admin:
        user = schemas.UserCreate(username="admin", password="admin123")
        crud.create_user(db=db, user=user)

    if not crud.get_products(db):
        for p in sample_products:
            product = schemas.ProductCreate(
                name=p.get("name"),
                brand=p.get("brand"),
                price=p.get("price"),
                image_url=p.get("image"),
                category=p.get("category"),
                gender=p.get("gender"),
                description=p.get("description"),
                stock=p.get("stock"),
                is_featured=p.get("isFeatured"),
                fragrance_family=p.get("fragrance_family"),
            )
            crud.create_product(db, product)
    crud.seed_default_coupons(db)

@app.get("/")
def root():
    return {"message": "API OK"}