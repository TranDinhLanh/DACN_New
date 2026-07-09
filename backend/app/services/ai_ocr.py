"""
ai_ocr.py
=========
Lớp điều phối chính (Orchestrator) cho toàn bộ quy trình xử lý hóa đơn (OCR).

Quy trình xử lý hóa đơn:
  Ảnh hóa đơn đầu vào (image_path)
    → ocr_engine.py      (Trích xuất chuỗi văn bản thô)
    → receipt_parser.py  (Trích xuất merchant, amount, date, address bằng Regex)
    → ai_classify.py     (Phân loại danh mục dựa trên tên cửa hàng & nội dung bằng ML / Rule)
    → Kết quả trả về API

Lưu ý phát triển:
  - Để tránh việc hệ thống bị lỗi hoàn toàn trên môi trường máy cá nhân (chưa cài đặt được GPU/PaddleOCR),
    lớp này hỗ trợ chế độ Mock giả lập tự động nếu không thể import hoặc chạy PaddleOCR.
"""

import logging
from datetime import datetime

from app.services.ocr_engine import extract_raw_text, HAS_PADDLEOCR
from app.services.receipt_parser import parse_receipt_text
from app.services.ai_classify import classify_transaction

logger = logging.getLogger(__name__)


class OCRService:

    @staticmethod
    def process_receipt_image(image_path: str, file_name: str) -> dict:
        """
        Hàm điều phối chính để xử lý ảnh hóa đơn tải lên.
        """
        raw_text = ""
        is_mock = False
        debug_message = ""

        # Bước 1: Trích xuất văn bản thô bằng OCR hoặc Mock giả lập
        if HAS_PADDLEOCR:
            try:
                raw_text = extract_raw_text(image_path)
            except Exception as error:
                raw_text = _get_mock_ocr_text(file_name)
                is_mock = True
                debug_message = f"Lỗi OCR thực tế: {str(error)}. Chuyển sang chế độ giả lập."
        else:
            raw_text = _get_mock_ocr_text(file_name)
            is_mock = True
            debug_message = "Chưa cài đặt PaddleOCR. Chạy chế độ giả lập."

        # Bước 2: Gọi parser để trích xuất thông tin Regex
        parsed_data = parse_receipt_text(raw_text)

        # Bước 3: Phân loại danh mục bằng ML và Rule-based bổ trợ
        category = classify_transaction(parsed_data["merchant"], "")
        category = _fallback_category_rules(raw_text, category)

        # Bước 4: Tổng hợp dữ liệu kết quả trả về
        return {
            "merchant": parsed_data["merchant"],
            "amount": parsed_data["amount"],
            "category": category,
            "transaction_date": parsed_data["transaction_date"],
            "extracted_text": raw_text,
            "is_mock": is_mock,
            "debug_message": debug_message
        }


# ==============================================================================
# HÀM BỔ TRỢ HỖ TRỢ PHÂN LOẠI & MOCK DỮ LIỆU
# ==============================================================================

def _fallback_category_rules(full_text, current_category):
    """
    Quét toàn bộ văn bản thô để tìm các từ khóa đặc trưng.
    Áp dụng khi mô hình ML trả về danh mục "Other" (do cửa hàng lạ).
    """
    if current_category != "Other":
        return current_category

    # Chuyển văn bản thô sang không dấu và chữ thường
    from app.services.receipt_parser import _no_accent_vietnamese
    clean_text = _no_accent_vietnamese(full_text.lower())

    # Các từ khóa quét trực tiếp trên nội dung hóa đơn
    rules = {
        "Food & Beverage": ["coffee", "cafe", "ca phe", "tra sua", "tea", "sua", "bun", "pho", "com", "banh", "kem", "lau", "nuong"],
        "Transportation": ["grab", "taxi", "gojek", "be car", "be bike", "xang", "dau", "xe khach", "phuong trang"],
        "Shopping": ["shopee", "lazada", "tiki", "sieu thi", "winmart", "coopmart", "lotte", "circle k", "ministop", "gs25"],
        "Bills & Utilities": ["dien luc", "evn", "cap nuoc", "viettel", "mobifone", "vinaphone", "fpt", "vnpt", "internet", "wifi"],
        "Entertainment": ["cgv", "lotte cin", "galaxy", "chieu phim", "cinema", "netflix", "spotify", "game", "karaoke"]
    }

    for category, keywords in rules.items():
        if any(kw in clean_text for kw in keywords):
            return category

    return "Other"


def _get_mock_ocr_text(file_name):
    """
    Trả về chuỗi văn bản hóa đơn giả lập tương ứng với tên file để test nhanh.
    """
    name_lower = file_name.lower()
    
    if "starbucks" in name_lower:
        return "STARBUCKS COFFEE\n76 Le Lai, Q.1\nDate: 02/06/2026\nCaramel Macchiato  110,000 VND\nTOTAL: 110,000 VND"
    if "winmart" in name_lower:
        return "WINMART CONG HOA\nNgay: 01/06/2026\nSua tuoi TH True Milk  36,000\nTHANH TOAN: 36,000 VND"
    if "phuc" in name_lower or "long" in name_lower:
        return "PHUC LONG TEA\nNgay: 30/05/2026\nTra Dao Phuc Long  65,000\nTONG TIEN: 65,000 VND"
        
    return "HIGHLANDS COFFEE\nNgay: 27/05/2026\nCa phe sua da  45,000 d\nTONG TIEN: 45,000 VND"
