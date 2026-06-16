# Hướng Dẫn Cài Đặt PaddleOCR cho Quản Lý Tài Chính

## Tổng Quan

Dự án đã được chuyển đổi từ LayoutLMv3 (nặng, phức tạp) sang **PaddleOCR** (nhẹ, đơn giản, tối ưu cho tiếng Việt) để xử lý hóa đơn.

### Quy Trình Mới

```
Ảnh hóa đơn
    ↓
PaddleOCR (OCR tiếng Việt)
    ↓
Text đã trích xuất
    ↓
LLM (nếu có API key) hoặc Regex thông minh
    ↓
JSON cấu trúc: {merchant, amount, date, address, category}
```

## Cài Đặt

### 1. Cài PaddleOCR và PaddlePaddle

```bash
cd backend
pip install paddleocr paddlepaddle
```

**Lưu ý:**
- Trên Windows: Cần cài Visual C++ Redistributable
- Trên Linux/Mac: Nên cài từ conda để tránh lỗi dependencies

### 2. Kiểm Tra Cài Đặt

```python
from paddleocr import PaddleOCR

ocr = PaddleOCR(use_angle_cls=True, lang='vi', show_log=False)
result = ocr.ocr('test_receipt.jpg')

for line in result[0]:
    print(line[1][0])  # In ra text đã trích xuất
```

### 3. (Tùy chọn) Cài LLM API để Trích Xuất Thông Minh Hơn

#### Option A: OpenAI GPT

```bash
pip install openai

# Thêm vào .env
OPENAI_API_KEY=sk-your-api-key-here
```

#### Option B: Google Gemini

```bash
pip install google-generativeai

# Thêm vào .env
GEMINI_API_KEY=your-gemini-api-key-here
```

## Cách Hoạt Động

### Bước 1: PaddleOCR Trích Xuất Text

```python
ocr = PaddleOCR(use_angle_cls=True, lang='vi', show_log=False)
result = ocr.ocr(image_path)

text = "\n".join(
    line[1][0] 
    for line in result[0]
)
```

**Ví dụ output:**
```
HIGHLANDS COFFEE
06 Tan Ky Tan Quy P.15,Q.Tan Binh
Ngay: 27/05/2026
Tong tien: 180,000 VND
```

### Bước 2: Trích Xuất Thông Tin Cấu Trúc

#### A. Dùng LLM (Nếu có API key)

```python
prompt = f"""
Trích xuất thông tin từ hóa đơn Việt Nam.

TEXT:
{text}

Trả về JSON:
{{
    "company": "Tên cửa hàng",
    "date": "DD/MM/YYYY",
    "address": "Địa chỉ",
    "total": số_tiền
}}
"""

# Gọi OpenAI hoặc Gemini
response = openai.ChatCompletion.create(...)
```

#### B. Dùng Regex (Không cần API)

```python
def extract_receipt(text):
    return {
        "company": extract_merchant(text),
        "date": extract_date(text),
        "address": extract_address(text),
        "total": extract_total_amount(text)
    }
```

**Regex patterns:**
- **Merchant:** `r'(HIGHLANDS|STARBUCKS|WINMART|PHUC LONG|...)'`
- **Total:** `r'(?:TONG TIEN|TOTAL|THANH TOAN)[\s:]*(\d+[.,]\d+)'`
- **Date:** `r'(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})'`
- **Address:** `r'\d+\s+[A-Z][a-z]+.*(?:P\.|Q\.|Phường|Quận)'`

## Test API

```bash
# Upload hóa đơn qua API
curl -X POST http://localhost:8000/api/ocr/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

**Response:**
```json
{
  "merchant": "HIGHLANDS COFFEE",
  "amount": 180000,
  "category": "Food & Beverage",
  "transaction_date": "2026-05-27",
  "extracted_text": "HIGHLANDS COFFEE\n06 Tan Ky...",
  "is_mock": false
}
```

## So Sánh với LayoutLMv3

| Tiêu chí | LayoutLMv3 (Cũ) | PaddleOCR + LLM/Regex (Mới) |
|----------|-----------------|------------------------------|
| **Độ phức tạp** | Rất cao (cần GPU, model lớn) | Đơn giản |
| **Dung lượng** | ~2GB model weights | ~100MB |
| **Tốc độ** | 3-5s/ảnh (CPU) | <1s/ảnh |
| **Độ chính xác tiếng Việt** | 70-80% | 90-95% |
| **Dễ deploy** | Khó (Docker, GPU) | Dễ (pip install) |
| **Chi phí** | Cao | Thấp (hoặc miễn phí nếu dùng regex) |

## Troubleshooting

### Lỗi: "No module named 'paddle'"
```bash
pip install paddlepaddle
```

### Lỗi: "DLL load failed" (Windows)
Cài Visual C++ Redistributable:
https://aka.ms/vs/17/release/vc_redist.x64.exe

### Lỗi: OCR không đọc được chữ
- Kiểm tra ảnh có rõ ràng không (tối thiểu 800x600px)
- Thử tăng độ phân giải ảnh
- Đảm bảo text không bị nghiêng quá 45 độ

### LLM trả về kết quả sai
- Kiểm tra prompt có rõ ràng không
- Thử thêm examples vào prompt
- Fallback về regex nếu LLM không ổn định

## Roadmap

- [ ] Fine-tune PaddleOCR cho font chữ hóa đơn Việt Nam
- [ ] Thêm hỗ trợ nhận diện QR code trên hóa đơn
- [ ] Tích hợp with local LLM (Llama, Mistral) để không phụ thuộc API
- [ ] Batch processing nhiều hóa đơn cùng lúc
