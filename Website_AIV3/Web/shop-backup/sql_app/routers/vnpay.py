import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from vnpay import (
    vnpay,
    VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET,
    VNPAY_RETURN_URL,
    FRONTEND_RETURN_URL,
)

logger = logging.getLogger("vnpay")

router = APIRouter(prefix="/vnpay", tags=["VNPAY"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


# =========================
# 💳 TẠO PAYMENT URL (POST /vnpay/create)
# =========================
@router.post("/create", response_model=schemas.VNPayCreatePaymentResponse)
async def create_payment(
    payload: schemas.VNPayCreatePaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    order = crud.get_order(db, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    if order.payment_method != "VNPAY":
        raise HTTPException(status_code=400, detail="Đơn hàng này không sử dụng VNPay")
    if order.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Đơn hàng đã được thanh toán trước đó")

    # TxnRef = Order ID (yêu cầu nghiệp vụ), lưu lại để IPN/return tra ngược ra Order
    txn_ref = str(order.id)
    crud.set_order_txn_ref(db, order, txn_ref)

    vnp = vnpay()
    vnp.requestData = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": VNPAY_TMN_CODE,
        "vnp_Amount": int(round(order.total_price)) * 100,
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": f"Thanh toan don hang X2TN Perfume #{order.id}",
        "vnp_OrderType": "billpayment",
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": VNPAY_RETURN_URL,
        "vnp_IpAddr": _get_client_ip(request),
        "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
    }

    payment_url = vnp.get_payment_url()
    logger.info(
        "VNPay create_payment order_id=%s amount=%s txn_ref=%s",
        order.id, order.total_price, txn_ref,
    )
    return {"payment_url": payment_url}


# =========================
# 🔁 RETURN (GET /vnpay/return) - Khách được VNPay redirect về đây
# CHỈ verify checksum + đọc ResponseCode + redirect frontend. KHÔNG cập nhật Order.
# =========================
@router.get("/return")
async def vnpay_return(request: Request):
    params = dict(request.query_params)
    order_id = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")

    is_valid = vnpay.validate_response(params, VNPAY_HASH_SECRET)

    logger.info(
        "VNPay return order_id=%s response_code=%s checksum_valid=%s",
        order_id, response_code, is_valid,
    )

    if not is_valid:
        status_param = "invalid"
    elif response_code == "00":
        status_param = "success"
    else:
        status_param = "failed"

    redirect_url = f"{FRONTEND_RETURN_URL}?order_id={order_id}&status={status_param}"
    return RedirectResponse(redirect_url)


# =========================
# 📩 IPN (GET /vnpay/ipn) - VNPay gọi server-to-server
# Đây là nơi DUY NHẤT được phép cập nhật Database.
# =========================
@router.get("/ipn")
async def vnpay_ipn(request: Request, db: Session = Depends(get_db)):
    params = dict(request.query_params)
    txn_ref = params.get("vnp_TxnRef")

    is_valid = vnpay.validate_response(params, VNPAY_HASH_SECRET)
    if not is_valid:
        logger.warning("VNPay IPN checksum INVALID txn_ref=%s", txn_ref)
        return JSONResponse({"RspCode": "97", "Message": "Invalid signature"})

    if not txn_ref:
        return JSONResponse({"RspCode": "01", "Message": "Order not found"})

    order = crud.get_order_by_txn_ref(db, txn_ref)
    if not order:
        logger.warning("VNPay IPN order not found txn_ref=%s", txn_ref)
        return JSONResponse({"RspCode": "01", "Message": "Order not found"})

    vnp_amount = params.get("vnp_Amount")
    try:
        amount_match = int(vnp_amount) == int(round(order.total_price)) * 100
    except (TypeError, ValueError):
        amount_match = False
    if not amount_match:
        logger.warning("VNPay IPN amount mismatch order_id=%s vnp_amount=%s", order.id, vnp_amount)
        return JSONResponse({"RspCode": "04", "Message": "Invalid amount"})

    if order.payment_status == "PAID":
        # IPN có thể được VNPay gọi lại nhiều lần -> idempotent, không xử lý lại
        logger.info("VNPay IPN order_id=%s already confirmed PAID", order.id)
        return JSONResponse({"RspCode": "02", "Message": "Order already confirmed"})

    response_code = params.get("vnp_ResponseCode")

    if response_code == "00":
        crud.mark_order_paid(
            db,
            order,
            transaction_id=params.get("vnp_TransactionNo"),
            bank_code=params.get("vnp_BankCode"),
            response_code=response_code,
        )
        logger.info(
            "VNPay IPN order_id=%s -> PAID txn_no=%s bank_code=%s",
            order.id, params.get("vnp_TransactionNo"), params.get("vnp_BankCode"),
        )
    else:
        crud.mark_order_failed(
            db,
            order,
            response_code=response_code,
            note="VNPay báo giao dịch không thành công (khách có thể thanh toán lại)",
        )
        logger.info("VNPay IPN order_id=%s -> FAILED response_code=%s", order.id, response_code)

    return JSONResponse({"RspCode": "00", "Message": "Confirm Success"})
