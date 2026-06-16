# 🔧 Fix OneDNN Error trên Windows

## ⚠️ Vấn Đề

Khi chạy PaddleOCR trên Windows, bạn gặp lỗi:

```
(Unimplemented) ConvertPirAttribute2RuntimeAttribute not support 
[pir::ArrayAttribute<pir::DoubleAttribute>]
```

Hệ thống sẽ fallback sang **mock mode** (dữ liệu giả).

## ✅ Giải Pháp Đã Áp Dụng

### 1. Disable OneDNN trong `app/main.py`

File `app/main.py` đã được cập nhật để tắt OneDNN **NGAY KHI APP KHỞI ĐỘNG**:

```python
import os

# FIX: Disable OneDNN NGAY KHI APP KHỞI ĐỘNG (Windows compatibility)
os.environ['FLAGS_use_mkldnn'] = '0'
os.environ['PADDLE_SKIP_CHECK_MKLDNN'] = '1'

from fastapi import FastAPI
```

### 2. Đơn giản hóa PaddleOCR init

File `app/services/ai_ocr.py` chỉ dùng parameter tối thiểu:

```python
# PaddleOCR 3.x: Chỉ cần lang parameter
ocr = PaddleOCR(lang='vi')
```

### 3. Set environment trong `setup_and_run.bat`

```batch
set FLAGS_use_mkldnn=0
set PADDLE_SKIP_CHECK_MKLDNN=1
```

## 🚀 Cách Chạy

### Option 1: Tự Động (Khuyến nghị)

```powershell
.\setup_and_run.bat
```

### Option 2: Thủ Công

```powershell
# Kích hoạt venv
.\venv\Scripts\Activate.ps1

# Chạy server (environment variables đã set trong main.py)
uvicorn app.main:app --reload
```

## 🧪 Kiểm Tra Fix Có Hoạt Động

### Test 1: Khởi động server

```powershell
.\setup_and_run.bat
```

**Không còn thấy lỗi OneDNN = ✅ Success!**

### Test 2: Upload hóa đơn qua API

```bash
curl -X POST "http://localhost:8000/api/v1/ocr/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

**Kiểm tra response:**

```json
{
  "is_mock": false,  // ✅ Phải là false!
  "merchant": "Highlands Coffee",
  "amount": 85000,
  "debug_message": ""  // ✅ Không có error message
}
```

## ⚡ Backup Plan: Downgrade PaddlePaddle

Nếu fix trên **vẫn không hoạt động**, chạy:

```powershell
.\fix_paddleocr_windows.bat
```

Script này sẽ:
1. Gỡ PaddlePaddle hiện tại
2. Cài phiên bản ổn định (2.6.0) không bị lỗi OneDNN

## 📊 Trạng Thái

| Component | Status | Note |
|-----------|--------|------|
| Environment Variables | ✅ Set trong main.py | FLAGS_use_mkldnn=0 |
| PaddleOCR Init | ✅ Simplified | Chỉ dùng lang='vi' |
| Batch Script | ✅ Updated | Auto set env vars |
| Backup Plan | ✅ Ready | Downgrade script available |

## 🎯 Expected Results

Sau khi apply fix:

1. ✅ Server khởi động không lỗi
2. ✅ PaddleOCR load thành công
3. ✅ OCR API hoạt động với ảnh thật
4. ✅ `is_mock: false` trong response
5. ✅ Không còn warning OneDNN

## 🐛 Nếu Vẫn Gặp Vấn Đề

### Kiểm tra environment variables

```python
python -c "import os; print('FLAGS_use_mkldnn:', os.environ.get('FLAGS_use_mkldnn'))"
```

**Output mong đợi:** `FLAGS_use_mkldnn: 0`

### Clear cache và reinstall

```powershell
# 1. Xóa cache
rmdir /s /q "%USERPROFILE%\.paddlex"
rmdir /s /q "%USERPROFILE%\.paddleocr"

# 2. Reinstall
.\fix_paddleocr_windows.bat
```

### Kiểm tra log chi tiết

```powershell
# Chạy với log level DEBUG
$env:LOGLEVEL = "DEBUG"
uvicorn app.main:app --reload
```

## 📚 Tài Liệu Liên Quan

- [Fix OneDNN Error - Chi tiết](docs/fix_onednn_error.md)
- [PaddleOCR Setup](docs/paddleocr_setup.md)
- [Migration Summary](MIGRATION_COMPLETE.md)

## 🎉 Summary

**Fix đã được apply tự động!** Chỉ cần chạy:

```powershell
.\setup_and_run.bat
```

Nếu có vấn đề, chạy backup plan:

```powershell
.\fix_paddleocr_windows.bat
```

---

**Last Updated**: June 9, 2026  
**Status**: ✅ Fix Applied  
**Platform**: Windows 10/11
