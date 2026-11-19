
# X2TN Perfume — Fullstack Shop (React + FastAPI + Django VNPay)

Website bán nước hoa với đầy đủ tính năng: frontend React (Vite), backend FastAPI (Python), tích hợp thanh toán VNPay (Django).

---

## 1. Yêu cầu hệ thống

- **Node.js**: Khuyến nghị v20+
- **Python**: 3.10 trở lên
- **(Tùy chọn)**: Git để clone/cập nhật source

---

## 2. Cài đặt & Chạy dự án

### 2.1. Backend (FastAPI)

```bash
# Lưu ý: Đặt project trong ổ C để tránh lỗi đường dẫn (nếu có)
cd shop-backup

# B1: Tạo môi trường ảo Python
python -m venv venv

# B2: Kích hoạt môi trường ảo
.\venv\Scripts\activate

# B3: Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# B4: Chạy server FastAPI (auto reload khi code thay đổi)
python -m uvicorn sql_app.main:app --reload
```

- API docs: http://127.0.0.1:8000/docs
- Tài khoản admin mặc định:  
  - Username: `admin`  
  - Password: `admin123`  
  (Hãy đổi mật khẩu khi triển khai thực tế!)

---

### 2.2. Frontend (React + Vite)

```bash
cd fe
npm install
npm run dev
```

- Truy cập: http://127.0.0.1:5173

#### Tuỳ chỉnh API endpoint

Tạo file `.env` trong thư mục `fe` với nội dung:

```
VITE_API_BASE=http://127.0.0.1:8000
```

---

### 2.3. Thanh toán VNPay (Django)

```bash
cd vnpay.py
# Tạo môi trường ảo nếu cần
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Chạy server Django
python manage.py runserver
```

- Truy cập giao diện VNPay: http://127.0.0.1:8000 (hoặc port Django mặc định)
- Các template mẫu:  
  - `payment.html`, `payment_return.html`, `refund.html`, `query.html`

---

## 3. Cấu trúc thư mục

```
shop-backup/
├─ fe/                # Frontend React + Vite
│  ├─ src/
│  │  ├─ components/  # Footer, NavBar, ProductCard
│  │  ├─ images/
│  │  ├─ lib/         # api.js (gọi API backend)
│  │  ├─ pages/       # Các trang: Home, Products, Cart, Checkout, Admin, ...
│  │  ├─ App.jsx, main.jsx, styles.css
│  ├─ index.html, package.json, vite.config.js
│
├─ sql_app/           # Backend FastAPI
│  ├─ routers/        # auth, cart, contact, orders, products
│  ├─ auth.py, crud.py, database.py, ...
│  ├─ main.py         # Entrypoint FastAPI
│
├─ vnpay.py/          # Thanh toán VNPay (Django)
│  ├─ vnpay_python/   # Xử lý logic VNPay
│  ├─ templates/      # Giao diện thanh toán
│  ├─ static/         # CSS, JS cho giao diện
│  ├─ manage.py, requirements.txt
│
├─ requirements.txt   # Python dependencies (FastAPI)
├─ README.md
└─ .env               # Biến môi trường (nếu có)
```

---

## 4. Thư viện cần cài thêm

- **Frontend**:  
  - `chart.js` và `react-chartjs-2` (nếu dùng biểu đồ)
    ```bash
    cd fe
    npm install chart.js react-chartjs-2
    ```

---

## 5. Ghi chú

- Đảm bảo backend và frontend cùng chạy để frontend gọi được API.
- Có thể cần chỉnh sửa CORS hoặc endpoint nếu deploy thực tế.
- Đổi mật khẩu admin mặc định trước khi sử dụng thật.
- Nếu gặp lỗi về đường dẫn hoặc quyền, hãy kiểm tra lại vị trí project và quyền truy cập thư mục.

---

## 6. Liên hệ & Đóng góp

- Đóng góp, báo lỗi hoặc đề xuất: [Tạo issue trên GitHub hoặc liên hệ tác giả]

---

**Chúc bạn sử dụng thành công!**
