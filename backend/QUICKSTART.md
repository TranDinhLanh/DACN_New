# 🚀 Quick Start - Backend Server

## Cách 1: Chạy Tự Động (Khuyến nghị)

### Bước 1: Cài đặt PaddleOCR (chỉ cần chạy 1 lần)

Nhấp đúp vào file hoặc chạy trong PowerShell:

```powershell
.\install_paddleocr.bat
```

### Bước 2: Chạy server

Nhấp đúp vào file hoặc chạy trong PowerShell:

```powershell
.\setup_and_run.bat
```

Server sẽ chạy tại:
- **API:** http://localhost:8000
- **Docs:** http://localhost:8000/docs

---

## Cách 2: Chạy Thủ Công (PowerShell)

### Bước 1: Kích hoạt virtual environment

```powershell
.\venv\Scripts\Activate.ps1
```

**Lỗi "cannot be loaded because running scripts is disabled"?**

Chạy lệnh này (chỉ cần 1 lần):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Bước 2: Cài đặt dependencies

```powershell
pip install -r requirements.txt
```

### Bước 3: Cài đặt PaddleOCR

```powershell
pip install paddleocr paddlepaddle
```

### Bước 4: Chạy server

```powershell
uvicorn app.main:app --reload
```

---

## Cách 3: Chạy Thủ Công (CMD)

### Bước 1: Kích hoạt virtual environment

```cmd
venv\Scripts\activate.bat
```

### Bước 2: Cài đặt dependencies

```cmd
pip install -r requirements.txt
pip install paddleocr paddlepaddle
```

### Bước 3: Chạy server

```cmd
uvicorn app.main:app --reload
```

---

## 🧪 Test API

### 1. Mở trình duyệt

Truy cập: http://localhost:8000/docs

### 2. Test OCR endpoint

```powershell
# Tạo file test
curl -X POST "http://localhost:8000/api/ocr/upload" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -F "file=@receipt.jpg"
```

---

## 🐛 Troubleshooting

### Lỗi: "uvicorn is not recognized"

**Nguyên nhân:** Virtual environment chưa được kích hoạt

**Giải pháp:**
```powershell
.\venv\Scripts\Activate.ps1
```

Sau khi kích hoạt, bạn sẽ thấy `(venv)` ở đầu command prompt:
```
(venv) PS D:\HOC KI FINAL\DACN\backend>
```

### Lỗi: "cannot be loaded because running scripts is disabled"

**Nguyên nhân:** PowerShell không cho phép chạy scripts

**Giải pháp:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Lỗi: "PaddleOCR chưa được cài đặt"

**Giải pháp:**
```powershell
pip install paddleocr paddlepaddle
```

### Lỗi: "DLL load failed" (Windows)

**Nguyên nhân:** Thiếu Visual C++ Redistributable

**Giải pháp:** Download và cài đặt:
https://aka.ms/vs/17/release/vc_redist.x64.exe

---

## 📦 Optional: Cài đặt LLM API

### OpenAI GPT

```powershell
pip install openai
```

Thêm vào file `.env`:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### Google Gemini

```powershell
pip install google-generativeai
```

Thêm vào file `.env`:
```
GEMINI_API_KEY=your-gemini-api-key-here
```

---

## 📝 Các Lệnh Hữu Ích

```powershell
# Kích hoạt venv
.\venv\Scripts\Activate.ps1

# Deactivate venv
deactivate

# Xem các packages đã cài
pip list

# Update pip
python -m pip install --upgrade pip

# Cài lại dependencies
pip install -r requirements.txt --upgrade

# Chạy server với custom port
uvicorn app.main:app --reload --port 8001

# Chạy server trên tất cả network interfaces
uvicorn app.main:app --reload --host 0.0.0.0
```

---

## 🎯 Next Steps

1. ✅ Cài đặt PaddleOCR: `.\install_paddleocr.bat`
2. ✅ Chạy server: `.\setup_and_run.bat`
3. 🌐 Mở browser: http://localhost:8000/docs
4. 📸 Test upload hóa đơn
5. 🎉 Tích hợp với frontend!
