from sqlalchemy.orm import Session
from . import models, schemas, security
import json
import re
from collections import Counter
from datetime import datetime, timedelta

# CRUD cho User
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# CRUD cho Product
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    # ---> THÊM ĐÚNG DÒNG NÀY ĐỂ BẮT BỆNH <---
    print("=== DỮ LIỆU TỪ WEB GỬI LÊN ===", product.dict())
    db_product = get_product(db, product_id)
    if db_product:
        update_data = product.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_product, key, value)
        db.commit()
        db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if db_product:
        db.delete(db_product)
        db.commit()
    return db_product

# CRUD cho Order
class OrderValidationError(ValueError):
    pass

class CouponValidationError(ValueError):
    pass

def normalize_coupon_code(code: str):
    return (code or "").strip().upper()

def validate_coupon_rules(coupon: models.Coupon, subtotal: float, now=None):
    now = now or datetime.utcnow()
    if not coupon.is_active:
        raise CouponValidationError("Coupon is disabled")
    if coupon.starts_at and now < coupon.starts_at:
        raise CouponValidationError("Coupon has not started")
    if coupon.ends_at and now > coupon.ends_at:
        raise CouponValidationError("Coupon has expired")
    if subtotal < coupon.min_order_amount:
        raise CouponValidationError("Order does not meet the minimum amount")
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise CouponValidationError("Coupon usage limit reached")
    if coupon.discount_type == "percentage":
        if coupon.discount_value <= 0 or coupon.discount_value > 100:
            raise CouponValidationError("Invalid percentage discount")
        discount_amount = subtotal * coupon.discount_value / 100
        if coupon.max_discount is not None:
            discount_amount = min(discount_amount, coupon.max_discount)
    elif coupon.discount_type == "fixed":
        if coupon.discount_value <= 0:
            raise CouponValidationError("Invalid fixed discount")
        discount_amount = coupon.discount_value
    else:
        raise CouponValidationError("Invalid coupon discount type")
    return min(max(0, discount_amount), max(0, subtotal))

def get_coupon(db: Session, coupon_id: int):
    return db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()

def get_coupon_by_code(db: Session, code: str):
    normalized = normalize_coupon_code(code)
    return db.query(models.Coupon).filter(models.Coupon.code == normalized).first()

def list_coupons(db: Session):
    return db.query(models.Coupon).order_by(models.Coupon.created_at.desc()).all()

def create_coupon(db: Session, coupon_data: schemas.CouponCreate):
    payload = coupon_data.dict()
    payload["code"] = normalize_coupon_code(payload["code"])
    db_coupon = models.Coupon(**payload)
    db.add(db_coupon)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

def update_coupon(db: Session, coupon_id: int, coupon_data: schemas.CouponUpdate):
    db_coupon = get_coupon(db, coupon_id)
    if not db_coupon:
        return None
    update_data = coupon_data.dict(exclude_unset=True)
    if "code" in update_data:
        update_data["code"] = normalize_coupon_code(update_data["code"])
    for key, value in update_data.items():
        setattr(db_coupon, key, value)
    db.commit()
    db.refresh(db_coupon)
    return db_coupon

def delete_coupon(db: Session, coupon_id: int):
    db_coupon = get_coupon(db, coupon_id)
    if db_coupon:
        db.delete(db_coupon)
        db.commit()
    return db_coupon

def validate_coupon(db: Session, code: str, subtotal: float):
    normalized = normalize_coupon_code(code)
    coupon = get_coupon_by_code(db, normalized)
    if not coupon:
        raise CouponValidationError("Coupon does not exist")
    discount_amount = validate_coupon_rules(coupon, subtotal)
    return coupon, discount_amount

def seed_default_coupons(db: Session):
    defaults = (
        ("PERFUME10", 10),
        ("ELITE15", 15),
        ("WELCOME5", 5),
    )
    for code, discount_value in defaults:
        if not get_coupon_by_code(db, code):
            create_coupon(
                db,
                schemas.CouponCreate(
                    code=code,
                    discount_type="percentage",
                    discount_value=discount_value,
                ),
            )


def create_order(db: Session, order_data: schemas.OrderCreate, customer_ip: str = None):
    payment_method = (order_data.paymentMethod or "").upper()
    if payment_method not in {"COD", "VNPAY"}:
        raise OrderValidationError("Invalid payment method")
    if not order_data.cart:
        raise OrderValidationError("Cart must not be empty")

    normalized_items = []
    quantities = {}
    products = {}
    for item in order_data.cart:
        try:
            product_id = int(item.get("id"))
            buy_qty = int(item.get("qty"))
        except (TypeError, ValueError, AttributeError):
            raise OrderValidationError("Cart contains an invalid product or quantity")
        if buy_qty <= 0:
            raise OrderValidationError("Product quantity must be greater than zero")
        quantities[product_id] = quantities.get(product_id, 0) + buy_qty

    for product_id, buy_qty in quantities.items():
        db_product = get_product(db, product_id)
        if db_product is None:
            raise OrderValidationError(f"Product {product_id} not found")
        if db_product.stock < buy_qty:
            raise OrderValidationError(f"Insufficient stock for product {product_id}")
        products[product_id] = db_product

    subtotal = 0
    for product_id, buy_qty in quantities.items():
        db_product = products[product_id]
        subtotal += db_product.price * buy_qty
        normalized_items.append({
            "id": db_product.id,
            "name": db_product.name,
            "brand": db_product.brand,
            "price": db_product.price,
            "image": db_product.image_url,
            "qty": buy_qty,
        })
    shipping_fee = 0 if subtotal >= 2000000 else 30000
    coupon_code = normalize_coupon_code(order_data.couponCode)
    coupon = None
    discount_amount = 0
    if coupon_code:
        try:
            coupon, discount_amount = validate_coupon(db, coupon_code, subtotal)
        except CouponValidationError as exc:
            raise OrderValidationError(str(exc))
    server_total = max(0, subtotal + shipping_fee - discount_amount)

    payment_status = "PROCESSING" if payment_method == "COD" else "PENDING"
    # 1. Tạo lưu thông tin đơn hàng
    db_order = models.Order(
        full_name=order_data.fullName,
        email=order_data.email,
        phone=order_data.phone,
        address=order_data.address,
        city=order_data.city,
        district=order_data.district,
        ward=order_data.ward,
        payment_method=payment_method,
        note=order_data.note,
        cart_items=json.dumps(normalized_items),
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_fee=shipping_fee,
        coupon_code=coupon_code or None,
        coupon_usage_counted=bool(coupon and payment_method == "COD"),
        total_price=server_total,
        payment_status=payment_status,
        customer_ip=customer_ip,
    )
    db.add(db_order)

    # 2. TỰ ĐỘNG TRỪ TỒN KHO SẢN PHẨM
    for product_id, buy_qty in quantities.items():
        products[product_id].stock -= buy_qty
    if coupon and payment_method == "COD":
        coupon.used_count += 1

    # 3. Lưu tất cả thay đổi vào Database
    db.commit()
    db.refresh(db_order)
    return db_order


def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_order_by_txn_ref(db: Session, txn_ref: str):
    return db.query(models.Order).filter(models.Order.vnp_txn_ref == txn_ref).first()


def set_order_txn_ref(db: Session, order: models.Order, txn_ref: str):
    order.vnp_txn_ref = txn_ref
    db.commit()
    db.refresh(order)
    return order


def mark_order_paid(db: Session, order: models.Order, transaction_id: str = None,
                    bank_code: str = None, response_code: str = None):
    if order.payment_status == "PAID":
        return order
    order.payment_status = "PAID"
    order.transaction_id = transaction_id
    order.bank_code = bank_code
    order.response_code = response_code
    if order.coupon_code and not order.coupon_usage_counted:
        coupon = get_coupon_by_code(db, order.coupon_code)
        if coupon:
            coupon.used_count += 1
        order.coupon_usage_counted = True
    db.commit()
    db.refresh(order)
    return order


def mark_order_failed(db: Session, order: models.Order, response_code: str = None,
                      note: str = None):
    order.payment_status = "FAILED"
    order.response_code = response_code
    if note:
        order.note = note
    db.commit()
    db.refresh(order)
    return order


def list_orders(db: Session, payment_status: str = None, payment_method: str = None,
                customer_name: str = None, date_from: datetime = None,
                date_to: datetime = None, skip: int = 0, limit: int = 200):
    query = db.query(models.Order)
    if payment_status:
        query = query.filter(models.Order.payment_status == payment_status.upper())
    if payment_method:
        query = query.filter(models.Order.payment_method == payment_method.upper())
    if customer_name:
        query = query.filter(models.Order.full_name.ilike(f"%{customer_name}%"))
    if date_from:
        query = query.filter(models.Order.created_at >= date_from)
    if date_to:
        query = query.filter(models.Order.created_at <= date_to)
    return query.order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()


def build_order_out(order: models.Order):
    try:
        items = json.loads(order.cart_items) if order.cart_items else []
    except (TypeError, json.JSONDecodeError):
        items = []
    return {
        "id": order.id,
        "full_name": order.full_name,
        "email": order.email,
        "phone": order.phone,
        "address": order.address,
        "city": order.city,
        "district": order.district,
        "ward": order.ward,
        "note": order.note,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "items": items,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "shipping_fee": order.shipping_fee,
        "coupon_code": order.coupon_code,
        "total_price": order.total_price,
        "transaction_id": order.transaction_id,
        "bank_code": order.bank_code,
        "response_code": order.response_code,
        "created_at": order.created_at,
    }

# CRUD cho Contact
def create_contact_message(db: Session, message: schemas.ContactMessageCreate):
    db_message = models.ContactMessage(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

_FRAGRANCE_KEYWORDS = {
    "woody": ["woody", "gỗ", "go", "đàn hương", "huong go", "vetiver", "cedar", "sandalwood"],
    "fresh": ["fresh", "tươi mát", "tuoi mat", "clean", "green"],
    "floral": ["floral", "hoa", "hoa cỏ", "hoa co", "jasmine", "rose", "iris", "lily"],
    "oriental": ["oriental", "ambery", "phương đông", "phuong dong", "spicy", "gia vị", "gia vi"],
    "citrus": ["citrus", "cam", "chanh", "bergamot", "grapefruit", "lemon", "orange"],
    "vanilla": ["vanilla", "vani"],
    "aquatic": ["aquatic", "biển", "bien", "marine", "oceanic"],
    "amber": ["amber", "hổ phách", "ho phach"],
    "leather": ["leather", "da thuộc", "da thuoc"],
    "musky": ["musky", "xạ hương", "xa huong", "musk"],
}


def _normalize_text(value: str):
    if not value:
        return ""
    return re.sub(r"\s+", " ", str(value).strip().lower())


def _normalize_gender(value: str):
    text = _normalize_text(value)
    if not text:
        return ""
    if text in ("men", "male", "nam"):
        return "men"
    if text in ("women", "female", "nu", "nữ"):
        return "women"
    return "unisex"


def _normalize_category(product: models.Product):
    # Ưu tiên nồng độ (EDP/EDT/...) nếu có, fallback về category hiện tại.
    raw = product.concentration or product.category
    return _normalize_text(raw)


def _infer_fragrance_family(product: models.Product):
    explicit = _normalize_text(product.fragrance_family)
    if explicit:
        return explicit

    source = " ".join([
        _normalize_text(product.description),
        _normalize_text(product.category),
        _normalize_text(product.name),
    ])
    for family, keywords in _FRAGRANCE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in source:
                return family
    return ""


def get_related_products(db: Session, product_id: int, limit: int = 4):
    base_product = get_product(db, product_id)
    if not base_product:
        return None

    candidates = (
        db.query(models.Product)
        .filter(models.Product.id != product_id)
        .all()
    )

    base_brand = _normalize_text(base_product.brand)
    base_family = _infer_fragrance_family(base_product)
    base_gender = _normalize_gender(base_product.gender)
    base_category = _normalize_category(base_product)
    base_price = float(base_product.price or 0)
    min_price = base_price * 0.8
    max_price = base_price * 1.2

    evaluated = []
    for item in candidates:
        reasons = []
        score = 0

        item_brand = _normalize_text(item.brand)
        item_family = _infer_fragrance_family(item)
        item_gender = _normalize_gender(item.gender)
        item_category = _normalize_category(item)
        item_price = float(item.price or 0)

        brand_match = bool(base_brand and item_brand == base_brand)
        if brand_match:
            score += 60
            reasons.append("Cùng thương hiệu")

        family_match = bool(base_family and item_family and item_family == base_family)
        if family_match:
            score += 40
            reasons.append("Cùng nhóm mùi")

        gender_match = bool(base_gender and item_gender == base_gender)
        if gender_match:
            score += 25
            reasons.append("Cùng giới tính")

        category_match = bool(base_category and item_category == base_category)
        if category_match:
            score += 20
            reasons.append("Cùng danh mục")

        within_price_range = bool(base_price > 0 and min_price <= item_price <= max_price)
        if within_price_range:
            score += 10
            reasons.append("Cùng khoảng giá")

        price_distance = abs(item_price - base_price) if base_price > 0 else float("inf")
        evaluated.append({
            "product": item,
            "score": score,
            "reason": reasons,
            "brand_match": brand_match,
            "family_match": family_match,
            "gender_match": gender_match,
            "category_match": category_match,
            "price_distance": price_distance,
        })

    selected = []
    selected_ids = set()

    def take_from_pool(pool):
        for row in pool:
            if len(selected) >= limit:
                break
            pid = row["product"].id
            if pid in selected_ids:
                continue
            selected.append(row)
            selected_ids.add(pid)

    # 1) Ưu tiên cùng thương hiệu
    brand_pool = sorted(
        [row for row in evaluated if row["brand_match"]],
        key=lambda row: (row["score"], row["product"].id),
        reverse=True
    )
    take_from_pool(brand_pool)

    # 2) Nếu thiếu: cùng fragrance_family, nếu base thiếu family thì fallback sang category
    if len(selected) < limit:
        if base_family:
            family_pool = sorted(
                [row for row in evaluated if row["family_match"]],
                key=lambda row: (row["score"], row["product"].id),
                reverse=True
            )
            take_from_pool(family_pool)
        else:
            category_fallback_pool = sorted(
                [row for row in evaluated if row["category_match"]],
                key=lambda row: (row["score"], row["product"].id),
                reverse=True
            )
            take_from_pool(category_fallback_pool)

    # 3) Nếu thiếu: cùng gender
    if len(selected) < limit:
        gender_pool = sorted(
            [row for row in evaluated if row["gender_match"]],
            key=lambda row: (row["score"], row["product"].id),
            reverse=True
        )
        take_from_pool(gender_pool)

    # 4) Nếu thiếu: cùng category
    if len(selected) < limit:
        category_pool = sorted(
            [row for row in evaluated if row["category_match"]],
            key=lambda row: (row["score"], row["product"].id),
            reverse=True
        )
        take_from_pool(category_pool)

    # 5) Nếu vẫn thiếu: gần mức giá nhất
    if len(selected) < limit:
        price_pool = sorted(
            evaluated,
            key=lambda row: (row["price_distance"], -row["score"], -row["product"].id)
        )
        take_from_pool(price_pool)

    top_items = selected[:limit]

    result = []
    for row in top_items:
        product = row["product"]
        reasons = list(row["reason"])
        if not reasons:
            reasons.append("Giá tương đương")
        result.append({
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "price": product.price,
            "image_url": product.image_url,
            "category": product.category,
            "gender": product.gender,
            "description": product.description,
            "stock": product.stock,
            "is_featured": product.is_featured,
            "concentration": product.concentration,
            "longevity": product.longevity,
            "origin": product.origin,
            "fragrance_family": product.fragrance_family,
            "score": row["score"],
            "reason": reasons,
        })
    return result


def _build_short_intro(description: str, max_length: int = 130):
    text = (description or "").strip()
    if not text:
        return "Mùi hương tinh tế, phù hợp nhiều dịp sử dụng và phong cách khác nhau."
    text = re.sub(r"\s+", " ", text)
    if len(text) <= max_length:
        return text
    return text[: max_length - 3].rstrip() + "..."


def _fallback_ai_intro(base_product: models.Product):
    brand = base_product.brand or "sản phẩm này"
    family = _infer_fragrance_family(base_product)
    gender = _normalize_gender(base_product.gender)
    gender_text = {"men": "nam tính, mạnh mẽ", "women": "nữ tính, quyến rũ"}.get(gender, "thanh lịch, dễ ứng dụng")
    family_text = f" hương {family}" if family else ""
    return (
        f"Tôi thấy bạn đang xem {base_product.name}. "
        f"Nếu bạn thích phong cách {gender_text}{family_text} từ {brand}, "
        f"bạn có thể tham khảo thêm các sản phẩm sau."
    )


def _generate_ai_intro(base_product: models.Product):
    """Sinh câu dẫn nhập tự nhiên bằng LLM (rag_engine); nếu lỗi/không có API key thì dùng câu mẫu động."""
    try:
        from . import rag_engine

        family = _infer_fragrance_family(base_product) or "chưa rõ"
        gender = base_product.gender or "chưa rõ"
        prompt = (
            "Bạn là trợ lý tư vấn nước hoa. Khách đang xem sản phẩm sau:\n"
            f"Tên: {base_product.name}\n"
            f"Thương hiệu: {base_product.brand}\n"
            f"Nhóm mùi: {family}\n"
            f"Giới tính: {gender}\n"
            "Hãy viết 1-2 câu ngắn, thân thiện, tự nhiên bằng tiếng Việt để dẫn nhập trước khi gợi ý thêm "
            "các sản phẩm liên quan. Không bịa thêm thông tin sản phẩm nào khác, chỉ dẫn nhập chung."
        )
        response = rag_engine.llm.invoke(prompt)
        text = (getattr(response, "content", "") or "").strip()
        if text:
            return text
    except Exception:
        pass
    return _fallback_ai_intro(base_product)


def get_ai_recommendation_bundle(db: Session, product_id: int, limit: int = 4):
    """Trả về câu dẫn nhập (AI) + danh sách sản phẩm gợi ý (luôn lấy thật từ DB, không bịa)."""
    base_product = get_product(db, product_id)
    if not base_product:
        return None

    items = get_ai_trend_recommendations(db, product_id, limit=limit)
    intro = _generate_ai_intro(base_product)
    return {"intro": intro, "items": items or []}


def track_ai_recommendation_click(db: Session, product_id: int, source_product_id: int = None):
    """Ghi nhận việc người dùng bấm vào một sản phẩm được AI gợi ý (phục vụ thống kê hiệu quả gợi ý)."""
    product = get_product(db, product_id)
    if not product:
        return None
    event = models.TrendEvent(
        event_type="ai_click",
        product_id=product.id,
        brand=product.brand,
        fragrance_family=product.fragrance_family or _infer_fragrance_family(product),
        source_product_id=source_product_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def track_search_trend(db: Session, keyword: str):
    clean_keyword = re.sub(r"\s+", " ", (keyword or "").strip())
    if not clean_keyword:
        return None
    event = models.TrendEvent(
        event_type="search",
        keyword=clean_keyword[:150],
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def track_click_trend(db: Session, product_id: int):
    product = get_product(db, product_id)
    if not product:
        return None
    event = models.TrendEvent(
        event_type="click",
        product_id=product.id,
        brand=product.brand,
        fragrance_family=product.fragrance_family or _infer_fragrance_family(product),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_ai_trend_recommendations(db: Session, product_id: int, limit: int = 4):
    base_product = get_product(db, product_id)
    if not base_product:
        return None

    candidates = db.query(models.Product).filter(models.Product.id != product_id).all()
    if not candidates:
        return []

    from_time = datetime.utcnow() - timedelta(days=30)
    recent_events = db.query(models.TrendEvent).filter(models.TrendEvent.created_at >= from_time).all()

    brand_counter = Counter()
    family_counter = Counter()
    for event in recent_events:
        event_brand = _normalize_text(event.brand)
        event_family = _normalize_text(event.fragrance_family)
        if event_brand:
            brand_counter[event_brand] += 1
        if event_family:
            family_counter[event_family] += 1

    base_brand = _normalize_text(base_product.brand)
    base_family = _infer_fragrance_family(base_product)
    base_gender = _normalize_gender(base_product.gender)
    base_category = _normalize_category(base_product)
    base_price = float(base_product.price or 0)

    ranked = []
    for item in candidates:
        reasons = []
        score = 0

        item_brand = _normalize_text(item.brand)
        item_family = _infer_fragrance_family(item)
        item_gender = _normalize_gender(item.gender)
        item_category = _normalize_category(item)
        item_price = float(item.price or 0)

        if base_brand and item_brand == base_brand:
            score += 70
            reasons.append("Cùng thương hiệu")

        if base_family and item_family and item_family == base_family:
            score += 45
            reasons.append("Cùng nhóm mùi")
        elif not base_family and base_category and item_category == base_category:
            score += 30
            reasons.append("Cùng danh mục")

        if base_gender and item_gender == base_gender:
            score += 20
            reasons.append("Cùng giới tính")

        if base_category and item_category == base_category:
            score += 15
            if "Cùng danh mục" not in reasons:
                reasons.append("Cùng danh mục")

        if base_price > 0 and item_price > 0:
            ratio = abs(item_price - base_price) / base_price
            if ratio <= 0.2:
                score += 10
                reasons.append("Giá tương đương")

        brand_trend = brand_counter.get(item_brand, 0)
        if brand_trend > 0:
            score += min(25, brand_trend * 5)
            reasons.append("Thương hiệu đang được quan tâm")

        family_trend = family_counter.get(item_family, 0)
        if family_trend > 0:
            score += min(20, family_trend * 4)
            reasons.append("Mùi hương đang được quan tâm")

        if score > 0:
            ranked.append((score, item.id, item, reasons))

    ranked.sort(key=lambda row: (row[0], row[1]), reverse=True)
    top_rows = ranked[:limit]

    # Nếu dữ liệu xu hướng ít, fallback theo giá gần nhất để đủ số lượng.
    if len(top_rows) < limit:
        selected_ids = {row[1] for row in top_rows}
        fallback_rows = []
        for item in candidates:
            if item.id in selected_ids:
                continue
            item_price = float(item.price or 0)
            distance = abs(item_price - base_price) if base_price > 0 else item.id
            fallback_rows.append((distance, item.id, item))
        fallback_rows.sort(key=lambda row: (row[0], -row[1]))
        for _, _, item in fallback_rows:
            if len(top_rows) >= limit:
                break
            top_rows.append((5, item.id, item, ["Gợi ý theo xu hướng tìm kiếm gần đây"]))

    results = []
    for score, _, item, reasons in top_rows[:limit]:
        dedup_reasons = list(dict.fromkeys(reasons))
        results.append({
            "id": item.id,
            "name": item.name,
            "brand": item.brand,
            "price": item.price,
            "image_url": item.image_url,
            "fragrance_family": item.fragrance_family or _infer_fragrance_family(item),
            "short_intro": _build_short_intro(item.description),
            "reason": dedup_reasons,
            "score": score,
        })
    return results
