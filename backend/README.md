# 💰 Backend - Ứng Dụng Quản Lý Tài Chính Cá Nhân

Backend API cho ứng dụng quản lý tài chính với tính năng OCR hóa đơn tiếng Việt.

## ✨ Tính Năng

- 🔐 **Authentication**: JWT-based auth với register/login
- 📸 **OCR Hóa Đơn**: Trích xuất thông tin từ ảnh hóa đơn Việt Nam (PaddleOCR)
- 💳 **Transactions**: CRUD operations cho giao dịch
- 💰 **Budgets**: Quản lý ngân sách theo category
- 📊 **Forecast**: Dự đoán chi tiêu (AI-powered)
- 🤖 **AI Classification**: Tự động phân loại giao dịch

## 🚀 Quick Start

### Cách 1: Tự Động (Khuyến nghị)

```powershell
# 1. Cài PaddleOCR (chỉ cần 1 lần)
.\install_paddleocr.bat

# 2. Chạy server
.\setup_and_run.bat
```

Server sẽ chạy tại:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### Cách 2: Thủ Công

```powershell
# 1. Kích hoạt virtual environment
.\venv\Scripts\Activate.ps1

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Chạy server
uvicorn app.main:app --reload
```

## 📦 Tech Stack

- **Framework**: FastAPI 0.110.0
- **Database**: SQLAlchemy + PostgreSQL (hoặc SQLite local)
- **OCR**: PaddleOCR 3.6.0 (tiếng Việt)
- **AI/ML**: scikit-learn, numpy
- **Auth**: JWT (pyjwt)

## 📁 Cấu Trúc Dự Án

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── ocr.py        # OCR upload
│   │   ├── transactions.py
│   │   ├── budgets.py
│   │   └── forecast.py
│   ├── core/             # Core config
│   │   ├── config.py     # Settings
│   │   ├── database.py   # DB connection
│   │   └── security.py   # JWT utils
│   ├── models/           # Database models
│   │   └── models.py
│   ├── schemas/          # Pydantic schemas
│   │   └── schemas.py
│   ├── services/         # Business logic
│   │   ├── ai_ocr.py     # ⭐ OCR service (PaddleOCR)
│   │   ├── ai_classify.py
│   │   └── ai_forecast.py
│   └── main.py           # FastAPI app
├── docs/                 # Documentation
│   ├── paddleocr_setup.md
│   ├── ocr_migration_summary.md
│   └── supabase_setup.md
├── static/uploads/       # Uploaded receipts
├── test_ocr.py          # Test suite
├── requirements.txt
└── .env                 # Environment variables
```

## 🔧 Environment Variables

Tạo file `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname
# Hoặc SQLite local:
# DATABASE_URL=sqlite:///./local_database.db

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Optional: LLM APIs cho OCR thông minh hơn
OPENAI_API_KEY=sk-your-key-here
# HOẶC
GEMINI_API_KEY=your-gemini-key
```

## 📡 API Endpoints

### Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

### OCR

```
POST /api/v1/ocr/upload        # Upload ảnh hóa đơn
```

### Transactions

```
GET    /api/v1/transactions    # List all
POST   /api/v1/transactions    # Create
GET    /api/v1/transactions/:id
PUT    /api/v1/transactions/:id
DELETE /api/v1/transactions/:id
```

### Budgets

```
GET    /api/v1/budgets
POST   /api/v1/budgets
GET    /api/v1/budgets/:id
PUT    /api/v1/budgets/:id
DELETE /api/v1/budgets/:id
```

### Forecast

```
POST /api/v1/forecast          # Dự đoán chi tiêu
```

## 🧪 Testing

```powershell
# Chạy test suite
python test_ocr.py

# Test API với curl
curl http://localhost:8000/docs
```

## 📸 OCR Workflow

### 1. Upload Hóa Đơn

```bash
curl -X POST "http://localhost:8000/api/v1/ocr/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

### 2. Response

```json
{
  "merchant": "Highlands Coffee",
  "amount": 85000,
  "category": "Food & Beverage",
  "transaction_date": "2026-05-27",
  "extracted_text": "HIGHLANDS COFFEE\n...",
  "is_mock": false
}
```

### 3. Quy Trình Xử Lý

```
Ảnh → PaddleOCR (tiếng Việt) → Text
        ↓
    Có LLM API?
    ├─ Yes → GPT/Gemini → Structured JSON
    └─ No  → Regex → Structured JSON
        ↓
    Category Classification
        ↓
    Lưu vào Database
```

## 🎯 Supported Receipt Types

- ☕ Café (Highlands, Starbucks, Phúc Long...)
- 🛒 Siêu thị (WinMart, CoopMart, Circle K...)
- 🍔 Nhà hàng (KFC, Lotteria, Pizza...)
- 🚗 Grab, Be
- 🎬 CGV, Lotte Cinema
- 🏪 Các cửa hàng khác

## 📊 Categories

- `Food & Beverage` - Ăn uống
- `Shopping` - Mua sắm
- `Transportation` - Đi lại
- `Entertainment` - Giải trí
- `Healthcare` - Y tế
- `Education` - Giáo dục
- `Utilities` - Hóa đơn (điện, nước, internet...)
- `Other` - Khác

## 🐛 Troubleshooting

### Server không start

```powershell
# Kiểm tra venv đã activate chưa
.\venv\Scripts\Activate.ps1

# Cài lại dependencies
pip install -r requirements.txt
```

### PaddleOCR lỗi

```powershell
# Cài lại PaddleOCR
pip uninstall paddleocr paddlepaddle
pip install paddleocr paddlepaddle

# Windows: Cần Visual C++ Redistributable
# Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
```

### Database error

```bash
# Kiểm tra DATABASE_URL trong .env
# SQLite local (không cần setup):
DATABASE_URL=sqlite:///./local_database.db
```

## 📚 Documentation

- 📖 [Quick Start Guide](QUICKSTART.md)
- 🔄 [Migration Summary](MIGRATION_COMPLETE.md)
- 🎯 [PaddleOCR Setup](docs/paddleocr_setup.md)
- 📊 [OCR Migration Details](docs/ocr_migration_summary.md)
- 🗄️ [Supabase Setup](docs/supabase_setup.md)

## 🔒 Security

- JWT tokens với expiration
- Password hashing (bcrypt)
- CORS configuration
- File upload validation
- SQL injection prevention (SQLAlchemy ORM)

## 🚀 Deployment

### Local Development

```powershell
uvicorn app.main:app --reload
```

### Production

```bash
# Với Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Với Docker
docker-compose up -d
```

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 👨‍💻 Developers

- Backend API: FastAPI + PostgreSQL
- OCR Engine: PaddleOCR (Vietnamese)
- AI/ML: scikit-learn, Prophet

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourrepo/issues)
- 📖 Docs: http://localhost:8000/docs

---

**Version**: 2.0.0  
**Last Updated**: June 9, 2026  
**Status**: ✅ Production Ready
