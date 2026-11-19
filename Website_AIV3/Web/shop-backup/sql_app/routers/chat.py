from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db # Import hàm lấy DB của bạn
from ..rag_engine import get_chat_response, build_vector_db
from .products import get_current_admin

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def chat_with_ai(request: ChatRequest):
    answer = get_chat_response(request.message)
    return {"reply": answer}

@router.post("/sync-data")
def sync_product_data(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_admin),
):
    """API dùng để cập nhật lại Vector DB mỗi khi thêm/sửa sản phẩm"""
    success = build_vector_db(db)
    return {"message": "Đã đồng bộ dữ liệu RAG thành công" if success else "Không có dữ liệu"}

# === AI GỢI Ý SẢN PHẨM KHI XEM CHI TIẾT (chỉ gọi khi người dùng bấm nút, không tự động gửi) ===
@router.get("/recommend/{product_id}", response_model=schemas.AIRecommendationResponse)
def get_ai_recommendation(product_id: int, db: Session = Depends(get_db)):
    bundle = crud.get_ai_recommendation_bundle(db, product_id=product_id)
    if bundle is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return bundle

@router.post("/recommend/click")
def track_ai_recommendation_click(payload: schemas.AIRecommendationClickTrack, db: Session = Depends(get_db)):
    """Ghi nhận analytics khi người dùng bấm vào sản phẩm được AI gợi ý."""
    event = crud.track_ai_recommendation_click(
        db, product_id=payload.product_id, source_product_id=payload.source_product_id
    )
    if event is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}