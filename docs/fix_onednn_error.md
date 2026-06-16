# Fix Lỗi OneDNN trên Windows

## 🐛 Lỗi

```
(Unimplemented) ConvertPirAttribute2RuntimeAttribute not support 
[pir::ArrayAttribute<pir::DoubleAttribute>] 
(at ..\paddle\fluid\framework\new_executor\instruction\onednn\onednn_instruction.cc:118)
```

## ❓ Nguyên Nhân

Đây là lỗi compatibility giữa PaddlePaddle và OneDNN (Intel MKL-DNN) trên Windows. OneDNN là thư viện tối ưu hóa cho Intel CPU nhưng có thể gây xung đột.

## ✅ Giải Pháp

### Giải Pháp 1: Disable OneDNN (Khuyến nghị)

#### A. Trong Code (Đã áp dụng)

File `app/services/ai_ocr.py` đã được cập nhật:

```python
# FIX: Disable OneDNN để tránh lỗi trên Windows
os.environ['FLAGS_use_mkldnn'] = '0'

ocr = PaddleOCR(
    use_angle_cls=True,
    lang='vi',
    use_gpu=False  # Chạy trên CPU
)
```

#### B. Qua Environment Variable (Global)

**Windows PowerShell:**
```powershell
$env:FLAGS_use_mkldnn = "0"
uvicorn app.main:app --reload
```

**Windows CMD:**
```cmd
set FLAGS_use_mkldnn=0
uvicorn app.main:app --reload
```

**File .env:**
```bash
FLAGS_use_mkldnn=0
```

#### C. Trong Script (setup_and_run.bat)

File đã được cập nhật tự động.

### Giải Pháp 2: Cài PaddlePaddle không có OneDNN

```powershell
# Gỡ version hiện tại
pip uninstall paddlepaddle

# Cài version CPU thuần (không có MKL)
pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Giải Pháp 3: Downgrade PaddlePaddle

```powershell
pip uninstall paddlepaddle paddleocr
pip install paddlepaddle==2.5.2 paddleocr==2.7.0
```

## 🧪 Test Fix

```powershell
# Kích hoạt venv
.\venv\Scripts\Activate.ps1

# Test PaddleOCR
python test_paddleocr_fix.py
```

**Kết quả mong đợi:**
```
✅ Import thành công!
✅ Khởi tạo thành công!
✅ OCR thành công!
🎉 TẤT CẢ TESTS PASS!
```

## 📊 Performance Impact

| Config | Tốc độ | Ổn định |
|--------|--------|---------|
| **Với OneDNN** | Nhanh hơn ~20% | ❌ Lỗi trên Windows |
| **Không OneDNN** | Bình thường | ✅ Ổn định |
| **Use GPU** | Rất nhanh | ⚠️ Cần CUDA |

**Kết luận:** Disable OneDNN là lựa chọn tốt nhất cho Windows + CPU.

## 🔧 Troubleshooting

### Vẫn còn lỗi sau khi disable OneDNN?

**1. Kiểm tra environment variable:**
```powershell
python -c "import os; print(os.environ.get('FLAGS_use_mkldnn'))"
# Output: 0
```

**2. Restart terminal/IDE:**
Environment variables cần restart để có hiệu lực.

**3. Clear PaddlePaddle cache:**
```powershell
# Windows
rmdir /s /q "%USERPROFILE%\.paddleocr"
rmdir /s /q "%USERPROFILE%\.paddlex"
```

**4. Reinstall PaddlePaddle:**
```powershell
pip uninstall paddlepaddle paddleocr -y
pip install paddlepaddle==2.6.0 paddleocr==2.7.3
```

### Lỗi "DLL load failed"?

**Cài Visual C++ Redistributable:**
https://aka.ms/vs/17/release/vc_redist.x64.exe

### Muốn dùng GPU thay vì CPU?

```python
# Cần CUDA toolkit 11.x hoặc 12.x
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='vi',
    use_gpu=True,
    gpu_mem=500  # 500MB
)
```

**Cài PaddlePaddle GPU version:**
```powershell
pip uninstall paddlepaddle
pip install paddlepaddle-gpu
```

## 📝 Code Changes Summary

### File: `app/services/ai_ocr.py`

**Thêm:**
```python
# FIX: Disable OneDNN để tránh lỗi trên Windows
os.environ['FLAGS_use_mkldnn'] = '0'
```

**Cập nhật:**
```python
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='vi',
    use_gpu=False  # Thêm dòng này
)
```

### File: `setup_and_run.bat`

**Thêm:**
```batch
set FLAGS_use_mkldnn=0
```

## ✅ Verification

Sau khi áp dụng fix, bạn sẽ thấy:

1. ✅ Không còn lỗi OneDNN
2. ✅ OCR chạy thành công
3. ✅ API `/api/v1/ocr/upload` hoạt động
4. ✅ `is_mock: false` trong response

**Test thử:**
```bash
curl -X POST "http://localhost:8000/api/v1/ocr/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

**Response mong đợi:**
```json
{
  "merchant": "Highlands Coffee",
  "amount": 85000,
  "category": "Food & Beverage",
  "transaction_date": "2026-06-09",
  "is_mock": false,  // ✅ Không còn mock!
  "debug_message": ""
}
```

## 🎯 Next Steps

1. ✅ Apply fix OneDNN
2. ✅ Test với `test_paddleocr_fix.py`
3. ✅ Chạy server: `uvicorn app.main:app --reload`
4. ✅ Test API với ảnh hóa đơn thật
5. 🎉 Enjoy!

## 📚 References

- [PaddleOCR Issues](https://github.com/PaddlePaddle/PaddleOCR/issues)
- [PaddlePaddle Environment Variables](https://www.paddlepaddle.org.cn/documentation/docs/zh/guides/flags/flags_cn.html)
- [OneDNN Documentation](https://github.com/oneapi-src/oneDNN)

---

**Status**: ✅ Fixed  
**Platform**: Windows  
**Date**: June 9, 2026
