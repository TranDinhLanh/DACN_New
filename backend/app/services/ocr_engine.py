"""
ocr_engine.py
=============
Lớp này chịu trách nhiệm: Trích xuất chuỗi văn bản thô từ ảnh hóa đơn bằng PaddleOCR.

Đầu vào:
  - Đường dẫn ảnh hóa đơn (image_path)
Đầu ra:
  - Toàn bộ nội dung chữ thô tìm thấy trên ảnh hóa đơn (mỗi dòng cách nhau bởi dấu xuống dòng)

Tại sao dùng PaddleOCR?
  - Hỗ trợ nhận diện chữ tiếng Việt rất tốt.
  - Phù hợp chạy offline, không tốn phí API như Google Vision hay OpenAI.
"""

import os
import logging

logger = logging.getLogger(__name__)

# Kiểm tra xem thư viện paddleocr đã được cài đặt trong môi trường chưa
HAS_PADDLEOCR = False
try:
    from paddleocr import PaddleOCR
    HAS_PADDLEOCR = True
    logger.info("✅ Thư viện PaddleOCR sẵn sàng hoạt động.")
except ImportError:
    logger.warning("⚠️ PaddleOCR chưa được cài đặt. Hệ thống sẽ hoạt động ở chế độ mô phỏng.")


def extract_raw_text(image_path):
    """
    Thực hiện quét ảnh hóa đơn và trả về chuỗi văn bản thô.

    Quy trình:
    1. Kiểm tra thư viện PaddleOCR có sẵn không.
    2. Khởi tạo đối tượng OCR với ngôn ngữ tiếng Việt (lang='vi').
    3. Thực hiện quét (ocr) trên đường dẫn ảnh.
    4. Gom tất cả dòng chữ quét được có độ tin cậy > 50% lại thành một chuỗi văn bản dài.
    """
    # Bước 1: Nếu không có thư viện, ném ra lỗi để module điều phối xử lý
    if not HAS_PADDLEOCR:
        raise ImportError("Chưa cài đặt thư viện PaddleOCR. Vui lòng chạy lệnh: pip install paddleocr")

    # Bước 2: Tắt tính năng oneDNN của Windows để tránh xung đột phần cứng
    os.environ['FLAGS_use_mkldnn'] = '0'

    # Khởi tạo PaddleOCR với tiếng Việt (chỉ hiển thị log lỗi để tránh rác console)
    import logging as paddle_logging
    paddle_logging.getLogger('ppocr').setLevel(paddle_logging.ERROR)
    
    ocr_runner = PaddleOCR(lang='vi')

    # Bước 3: Chạy OCR trên ảnh
    raw_results = ocr_runner.ocr(image_path)

    # Kiểm tra kết quả quét
    if not raw_results or not raw_results[0]:
        raise ValueError("PaddleOCR không tìm thấy văn bản nào trong ảnh hóa đơn này.")

    # Bước 4: Lọc và ghép các dòng chữ
    extracted_lines = []
    for line in raw_results[0]:
        text_content = line[1][0]
        confidence_score = line[1][1]

        # Chỉ lấy những dòng có độ tin cậy trên 50%
        if confidence_score > 0.5:
            extracted_lines.append(text_content)

    # Nối lại bằng ký tự xuống dòng
    return "\n".join(extracted_lines)
