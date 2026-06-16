# 🌟 AuraFinance - Personal Finance Management & AI Intelligence

AuraFinance là hệ thống quản lý tài chính cá nhân thông minh ứng dụng thị giác máy tính và học máy để tự động hóa quy trình ghi chép chi tiêu, phân tích cơ cấu và dự báo dòng tiền tương lai.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS v4, Lucide React, Recharts.
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy, Pydantic, Passlib, Python-Jose (JWT).
- **Database**: PostgreSQL (Dockerized).
- **AI/ML Engine**: PaddleOCR (Đọc hóa đơn), Scikit-Learn (Phân loại chi tiêu), Facebook Prophet (Dự báo dòng tiền).

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
personal-finance/
├── backend/                   # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API Router endpoints
│   │   ├── core/              # Config, Security, DB session
│   │   ├── models/            # SQLAlchemy Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # AI engines (OCR, Classifier, Forecast stubs)
│   ├── requirements.txt       # Thư viện Python
│   └── main.py                # Điểm khởi chạy API
│
├── frontend/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Landing page, Dashboard pages
│   │   ├── components/        # Thư mục chứa UI, Charts, Form
│   │   └── lib/               # API clients
│   ├── package.json
│   └── tailwind.config.js
│
├── docker-compose.yml         # Container chạy PostgreSQL
└── README.md                  # Hướng dẫn chạy & Chia việc cho nhóm
```

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

Làm theo 3 bước sau để khởi chạy toàn bộ hệ thống cục bộ:

### Bước 1: Khởi động Cơ sở dữ liệu (PostgreSQL)
Đảm bảo bạn đã cài đặt Docker và Docker Desktop. Chạy lệnh sau ở thư mục gốc:
```bash
docker compose up -d
```
*Lưu ý: Cơ sở dữ liệu sẽ chạy ở cổng `5432` với tài khoản mặc định `pfm_user` / mật khẩu `pfm_secure_password123`.*

### Bước 2: Khởi chạy FastAPI Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Tạo môi trường ảo python và cài đặt thư viện:
   ```bash
   python -m venv venv
   # Trên Windows:
   .\venv\Scripts\activate
   # Cài đặt thư viện:
   pip install -r requirements.txt
   ```
3. Chạy Server ở cổng `8000`:
   ```bash
   uvicorn main:app --reload
   ```
   *Truy cập tài liệu API tự động tại: [http://localhost:8000/docs](http://localhost:8000/docs)*

### Bước 3: Khởi chạy Next.js Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các package npm:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Chạy Server ở cổng `3000`:
   ```bash
   npm run dev
   ```
   *Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)*

---

## 👥 Phân Chia Công Việc Thành Viên (Roadmap)

Dự án được thiết kế theo module hóa cao giúp các thành viên phát triển độc lập không lo bị xung đột code:

### 1. Thành viên 1: Core Backend & DB Setup (Track 1)
- **Tập trung làm việc tại**: `backend/app/models/`, `backend/app/api/auth.py`, `backend/app/api/transactions.py`, `backend/app/api/budgets.py`.
- **Mục tiêu**: Hoàn thiện CRUD giao dịch thật, lưu database thật, hoàn thiện gửi email OTP thật.

### 2. Thành viên 2: Frontend & Dashboard UX (Track 2)
- **Tập trung làm việc tại**: `frontend/src/app/`, `frontend/components/`.
- **Mục tiêu**: Nối API Axios/Fetch từ frontend sang các cổng `/api/v1/auth` và `/api/v1/transactions` để thay thế cho mock-state hiện tại. Thiết kế thêm trang quản trị (Admin Dashboard).

### 3. Thành viên 3: Trí tuệ nhân tạo OCR (Track 3)
- **Tập trung làm việc tại**: `backend/app/services/ai_ocr.py`, `backend/app/api/ocr.py`.
- **Mục tiêu**: Cài đặt PaddleOCR, viết code xử lý ảnh (xoay, lọc mờ, tăng tương phản) để đọc bill tiếng Việt. Trích xuất chính xác tiền bằng Regex nâng cao.

### 4. Thành viên 4: Học máy Phân Loại & Dự Báo (Track 4)
- **Tập trung làm việc tại**: `backend/app/services/ai_classify.py`, `backend/app/services/ai_forecast.py`.
- **Mục tiêu**: Thu thập dataset mô tả Việt hóa, huấn luyện model Scikit-Learn lưu file `.pkl` để phân loại danh mục. Tích hợp Facebook Prophet để dự báo chuỗi thời gian 30 ngày.

---

## 📈 Kế hoạch Nghiệm Thu Đồ Án
Dự án cơ bản đã dựng sẵn giao diện **AuraFinance** cực kỳ bóng bẩy, hỗ trợ sẵn tính năng mô phỏng OCR, dự đoán AI realtime ngay khi gõ và biểu đồ trực quan. Đây là nền tảng vững chắc để nhóm tự tin bảo vệ xuất sắc!
