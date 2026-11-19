from dotenv import load_dotenv
import os
import hashlib
import hmac
import logging
import urllib.parse

# ✅ load env
load_dotenv()

logger = logging.getLogger("vnpay")

# ================= CONFIG =================
VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "DEMO")
VNPAY_HASH_SECRET = os.getenv("VNPAY_HASH_SECRET", "SECRET")
VNPAY_URL = os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")

# 🔥 URL VNPay gọi về sau khi khách thanh toán xong (backend xử lý rồi redirect tiếp về frontend)
VNPAY_RETURN_URL = os.getenv("VNPAY_RETURN_URL")

# 👉 Trang frontend hiển thị kết quả thanh toán cho khách (PaymentReturn.jsx)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FRONTEND_PAYMENT_RETURN_PATH = os.getenv("FRONTEND_PAYMENT_RETURN_PATH", "/payment/return")
FRONTEND_RETURN_URL = f"{FRONTEND_URL.rstrip('/')}{FRONTEND_PAYMENT_RETURN_PATH}"

logger.info("VNPAY_RETURN_URL configured = %s", VNPAY_RETURN_URL)


class vnpay:
    def __init__(self):
        self.requestData = {}
        self.responseData = {}

    def get_payment_url(self, base_url=None, secret_key=None):

        # ✅ fallback nếu thiếu env
        if not base_url:
            base_url = VNPAY_URL

        if not secret_key:
            secret_key = VNPAY_HASH_SECRET

        # ❗ nếu return_url bị None → báo lỗi ngay
        if not VNPAY_RETURN_URL:
            raise Exception("❌ VNPAY_RETURN_URL chưa được cấu hình trong .env")

        inputData = sorted(self.requestData.items())

        queryString = ""
        hashData = ""

        for key, value in inputData:
            if value is not None and value != "":
                queryString += f"{key}={urllib.parse.quote_plus(str(value))}&"
                hashData += f"{key}={value}&"

        queryString = queryString.rstrip("&")
        hashData = hashData.rstrip("&")

        # 🔐 tạo hash
        secure_hash = hmac.new(
            secret_key.encode(),
            hashData.encode(),
            hashlib.sha512
        ).hexdigest()

        payment_url = f"{base_url}?{queryString}&vnp_SecureHash={secure_hash}"

        return payment_url

    @staticmethod
    def validate_response(response_data: dict, secret_key: str = None) -> bool:
        """Xác thực checksum (vnp_SecureHash) của dữ liệu VNPay gửi về (return/IPN).

        KHÔNG được tin bất kỳ dữ liệu nào từ query string/browser nếu hàm này trả về False.
        """
        if not secret_key:
            secret_key = VNPAY_HASH_SECRET

        data = dict(response_data)
        received_hash = data.pop("vnp_SecureHash", None)
        data.pop("vnp_SecureHashType", None)

        if not received_hash:
            return False

        input_data = sorted(data.items())
        hash_data = "&".join(
            f"{key}={value}" for key, value in input_data if value is not None and value != ""
        )

        calculated_hash = hmac.new(
            secret_key.encode(),
            hash_data.encode(),
            hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(calculated_hash, received_hash)