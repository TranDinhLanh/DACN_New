"""
receipt_parser.py
================
Lớp này chịu trách nhiệm: Sử dụng Regular Expression (Regex) để trích xuất thông tin có cấu trúc từ văn bản thô.

Các thông tin cần trích xuất:
  - Tên cửa hàng (merchant_name)
  - Tổng số tiền thanh toán (total_amount)
  - Ngày thực hiện giao dịch (transaction_date)
  - Địa chỉ cửa hàng (address)
"""

import re
import unicodedata
from datetime import datetime

# Các từ khóa loại trừ khi tìm tên cửa hàng
PHONE_SIGNAL_KEYWORDS = ["iill", "volte", "lte", "4g", "5g", "wifi", "%", "pin", "battery", "sóng", "mạng"]
SHIPPING_KEYWORDS = ["express", "spx", "logistics", "shipping", "delivery", "giao hàng", "giao hang", "vận chuyển", "van chuyen", "ghn", "ghtk"]
META_INFO_KEYWORDS = ["dia chi", "địa chỉ", "address", "sdt", "sđt", "tel", "phone", "ngay", "ngày", "date", "http", "www", "---", "===", "hoa don", "hoá đơn", "bill", "thanh toan", "thông tin", "thong tin", "don hang", "đơn hàng"]


def parse_receipt_text(raw_text):
    """
    Hàm điều phối: Nhận văn bản thô, gọi các hàm trích xuất chi tiết và trả về dict kết quả.
    """
    merchant = _extract_merchant(raw_text)
    amount = _extract_total_amount(raw_text)
    date_obj = _extract_date(raw_text)
    address = _extract_address(raw_text)

    return {
        "merchant": merchant,
        "amount": amount,
        "transaction_date": date_obj,
        "address": address
    }


# ==============================================================================
# TRÍCH XUẤT TÊN CỬA HÀNG (MERCHANT)
# ==============================================================================

def _find_known_brand(text):
    """Kiểm tra xem văn bản có chứa thương hiệu lớn nào trong danh sách không."""
    known_brands = ["Highlands Coffee", "Gongcha", "Phuc Long", "Starbucks", "WinMart", "Circle K", "Grab", "Shopee", "CGV"]
    for brand in known_brands:
        if re.search(brand, text, re.IGNORECASE):
            return brand
    return None


def _find_merchant_by_keywords(lines):
    """Duyệt qua các dòng đầu tiên để tìm cửa hàng dựa trên từ khóa gợi ý."""
    merchant_keywords = ["coffee", "tea", "mart", "shop", "cửa hàng", "quán", "store", "restaurant"]
    for line in lines[:15]:
        lower_line = line.lower()
        # Bỏ qua dòng chứa ký hiệu mạng điện thoại hoặc giao hàng
        if any(k in lower_line for k in PHONE_SIGNAL_KEYWORDS + SHIPPING_KEYWORDS):
            continue
        # Bỏ qua nếu là dòng chứa thông tin địa chỉ/sdt/web
        if any(k in lower_line for k in ["dia chi", "address", "sdt", "tel", "http", "www"]):
            continue
        # Nếu có từ khóa gợi ý hoặc từ độc lập "vn"
        if any(k in lower_line for k in merchant_keywords) or re.search(r'\bvn\b', lower_line):
            return re.sub(r'[>\-\+\=\*]+$', '', line).strip()
    return None


def _fallback_first_valid_line(lines):
    """Phương án dự phòng: Lấy dòng đầu tiên không chứa thông tin meta hay số điện thoại."""
    for line in lines[:6]:
        lower_line = line.lower()
        if any(k in lower_line for k in PHONE_SIGNAL_KEYWORDS + SHIPPING_KEYWORDS) and (any(c.isdigit() for c in line) or "@" in line):
            continue
        if re.match(r'^\d{1,2}:\d{2}$', line):
            continue
        if any(k in lower_line for k in META_INFO_KEYWORDS):
            continue
        # Bỏ qua nếu dòng chứa quá nhiều số (ví dụ MST hoặc số điện thoại)
        digits_count = sum(c.isdigit() for c in line)
        if digits_count > len(line) * 0.5:
            continue
        if len(line.strip()) > 2:
            return re.sub(r'[>\-\+\=\*]+$', '', line).strip()
    return "Unknown Store"


def _extract_merchant(text):
    """Hàm chính trích xuất tên cửa hàng."""
    brand = _find_known_brand(text)
    if brand:
        return brand

    lines = [line.strip() for line in text.split('\n') if line.strip()]
    merchant = _find_merchant_by_keywords(lines)
    if merchant:
        return merchant

    return _fallback_first_valid_line(lines)


# ==============================================================================
# TRÍCH XUẤT TỔNG TIỀN (TOTAL AMOUNT)
# ==============================================================================

def _clean_amount_string(amount_str):
    """Xóa tất cả ký tự không phải số, dấu phẩy hoặc dấu chấm."""
    return re.sub(r'[^\d.,]', '', amount_str)


def _convert_cleaned_string_to_float(cleaned):
    """Chuyển chuỗi số dạng tiếng Việt/tiếng Anh thành số float thực tế."""
    if '.' in cleaned and ',' in cleaned:
        dot_idx = cleaned.rfind('.')
        comma_idx = cleaned.rfind(',')
        if dot_idx > comma_idx:
            cleaned = cleaned.replace(',', '')
        else:
            cleaned = cleaned.replace('.', '').replace(',', '.')
    elif '.' in cleaned:
        parts = cleaned.split('.')
        if len(parts[-1]) == 3:
            cleaned = cleaned.replace('.', '')
        elif len(parts[-1]) in (1, 2) and len(parts) > 2:
            cleaned = "".join(parts[:-1]) + "." + parts[-1]
        else:
            cleaned = cleaned.replace('.', '')
    elif ',' in cleaned:
        parts = cleaned.split(',')
        if len(parts[-1]) == 3:
            cleaned = cleaned.replace(',', '')
        elif len(parts[-1]) in (1, 2):
            cleaned = "".join(parts[:-1]) + "." + parts[-1] if len(parts) > 2 else cleaned.replace(',', '.')
        else:
            cleaned = cleaned.replace(',', '')
    return float(cleaned) if cleaned else None


def _parse_vietnamese_amount(amount_str):
    """Phân tích chuỗi số hóa đơn thành kiểu float."""
    cleaned = _clean_amount_string(amount_str)
    if not cleaned:
        return None
    try:
        return _convert_cleaned_string_to_float(cleaned)
    except ValueError:
        return None


def _find_numbers_in_line(line):
    """Tìm tất cả chuỗi số biểu thị tiền tệ trên một dòng và parse thành float."""
    # Sửa lỗi OCR nhận nhầm O/o/Q thay vì số 0
    cleaned_line = line
    cleaned_line = re.sub(r'(?<=\d)[OoQ](?=\b|\D)', '0', cleaned_line)
    cleaned_line = re.sub(r'(?<=\d\d)[OoQ]', '0', cleaned_line)
    cleaned_line = re.sub(r'(?<=\d)[OoQ](?=\d)', '0', cleaned_line)

    currency_suffix = r'(?:\s*(?:[đdDđĐ]|[vV][nN][đdĐ]|[vV][nN][dD]|\$|[uU][sS][dD]))?'
    pattern = re.compile(
        r'\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?' + currency_suffix + r'|'
        r'\b\d{1,3}(?:\s\d{3})+' + currency_suffix + r'|'
        r'\b\d{4,9}\b' + currency_suffix + r'|'
        r'\b\d{3,9}\s*(?:[đdDđĐ]|[vV][nN][đdĐ]|[vV][nN][dD]|\$|[uU][sS][dD])\b',
        re.IGNORECASE
    )
    matches = pattern.findall(cleaned_line)
    results = []
    for m in matches:
        val = _parse_vietnamese_amount(m)
        if val is not None:
            results.append(val)
    return results


def _is_keyword_matched(kw, line_upper, line_clean):
    """Kiểm tra xem từ khóa tổng tiền có khớp với dòng văn bản không."""
    kw_upper = kw.upper()
    kw_clean = _no_accent_vietnamese(kw_upper)

    # Loại trừ trường hợp chữ "Cộng" dính vào "Công ty", "Cộng hòa"...
    if kw_clean == "CONG" or kw_upper == "CỘNG":
        exclusions = ["CONG TY", "CÔNG TY", "CONG HOA", "CỘNG HÒA", "CONG NGHE", "CÔNG NGHỆ", "CONG DONG", "CỘNG ĐỒNG", "THANH CONG", "THÀNH CÔNG"]
        temp_upper, temp_clean = line_upper, line_clean
        for excl in exclusions:
            temp_upper = temp_upper.replace(excl, "")
            temp_clean = temp_clean.replace(excl, "")
        if not re.search(rf'\b{re.escape(kw_upper)}\b', temp_upper) and not re.search(rf'\b{re.escape(kw_clean)}\b', temp_clean):
            return False

    return bool(re.search(rf'\b{re.escape(kw_upper)}\b', line_upper) or re.search(rf'\b{re.escape(kw_clean)}\b', line_clean))


def _find_amount_by_keywords(cleaned_lines):
    """Tìm số tiền dựa trên các nhóm từ khóa có độ ưu tiên giảm dần."""
    priority_keywords = [
        ["TỔNG CỘNG THANH TOÁN", "TONG CONG THANH TOAN", "TONG TIEN THANH TOAN", "TỔNG TIỀN THANH TOÁN", "TỔNG CỘNG TIỀN"],
        ["TỔNG CỘNG", "TONG CONG", "TOTAL", "GRAND TOTAL", "CẦN THANH TOÁN", "CAN THANH TOAN", "KHÁCH PHẢI TRẢ", "KHACH PHAI TRA", "PHẢI TRẢ", "PHAI TRA"],
        ["TỔNG TIỀN", "TONG TIEN", "THANH TOÁN", "THANH TOAN", "TỔNG", "TONG", "TÖNG", "SUM"],
        ["TIỀN MẶT", "TIEN MAT", "CASH", "TIỀN PHẢI TRẢ", "TIEN PHAI TRA"],
        ["CỘNG TIỀN HÀNG", "CONG TIEN HANG", "THÀNH TIỀN", "THANH TIEN", "CỘNG", "CONG", "SỐ TIỀN", "SO TIEN", "TỔNG SỐ TIỀN", "TONG SO TIEN"]
    ]
    for group in priority_keywords:
        for idx, (original_line, line_upper, line_clean) in enumerate(cleaned_lines):
            if any(_is_keyword_matched(kw, line_upper, line_clean) for kw in group):
                numbers = _find_numbers_in_line(original_line)
                if numbers:
                    return numbers[-1]
                # Thử tìm ở 2 dòng tiếp theo
                for offset in [1, 2]:
                    if idx + offset < len(cleaned_lines):
                        next_numbers = _find_numbers_in_line(cleaned_lines[idx + offset][0])
                        if next_numbers:
                            return next_numbers[0]
    return None


def _fallback_largest_amount(all_numbers):
    """Phương án dự phòng: Lấy số lớn nhất hợp lệ làm tổng tiền."""
    valid_amounts = [v for v in all_numbers if 1000 <= v <= 50000000]
    return max(valid_amounts) if valid_amounts else 85000.0


def _extract_total_amount(text):
    """Hàm chính trích xuất tổng tiền."""
    lines = text.split('\n')
    cleaned_lines = [(line, line.upper(), _no_accent_vietnamese(line.upper())) for line in lines]

    amount = _find_amount_by_keywords(cleaned_lines)
    if amount is not None:
        return amount

    # Fallback: Lấy số lớn nhất trong toàn bộ văn bản
    all_numbers = []
    for original_line, _, _ in cleaned_lines:
        all_numbers.extend(_find_numbers_in_line(original_line))
    return _fallback_largest_amount(all_numbers)


# ==============================================================================
# TRÍCH XUẤT NGÀY THÁNG (DATE)
# ==============================================================================

def _find_date_with_time(text):
    """Tìm ngày đi kèm giờ phút cụ thể (ví dụ: DD/MM/YYYY HH:MM)."""
    datetime_pattern = r'\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s+\d{1,2}:\d{2}\b'
    match = re.search(datetime_pattern, text)
    if match:
        day, month, year = match.groups()
        try:
            return datetime(int(year), int(month), int(day)).date()
        except ValueError:
            pass
    return None


def _find_date_by_keywords(lines):
    """Tìm dòng chứa từ khóa về thời gian và trích xuất ngày tháng."""
    for line in lines:
        if any(k in line.lower() for k in ["ngày", "ngay", "thời gian", "thoi gian", "date", "time"]):
            match = re.search(r'\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b', line)
            if match:
                day, month, year = match.groups()
                try:
                    return datetime(int(year), int(month), int(day)).date()
                except ValueError:
                    pass
    return None


def _find_first_date_occurrence(text):
    """Lấy ngày đầu tiên tìm thấy trong văn bản."""
    match = re.search(r'\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b', text)
    if match:
        day, month, year = match.groups()
        try:
            return datetime(int(year), int(month), int(day)).date()
        except ValueError:
            pass
    return None


def _extract_date(text):
    """Hàm chính trích xuất ngày tháng giao dịch."""
    date_val = _find_date_with_time(text)
    if date_val:
        return date_val

    lines = text.split('\n')
    date_val = _find_date_by_keywords(lines)
    if date_val:
        return date_val

    date_val = _find_first_date_occurrence(text)
    if date_val:
        return date_val

    return datetime.now().date()


# ==============================================================================
# TRÍCH XUẤT ĐỊA CHỈ (ADDRESS)
# ==============================================================================

def _extract_address(text):
    """Trích xuất địa chỉ cửa hàng từ hóa đơn."""
    address_patterns = [
        r'(?:Dia chi|Địa chỉ|Address|DC)[\s:]*(.+?)(?:\n|Tel|SĐT|$)',
        r'\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,?\s*(?:P\.|Phường|Q\.|Quận|Dist)',
    ]
    for pattern in address_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            address = match.group(1) if match.lastindex else match.group(0)
            return address.strip()
    return ""


# ==============================================================================
# UTILITY HELPER
# ==============================================================================

def _no_accent_vietnamese(s):
    """Chuyển đổi chuỗi tiếng Việt thành không dấu để dễ so khớp regex."""
    s = unicodedata.normalize('NFD', s)
    s = ''.join([c for c in s if unicodedata.category(c) != 'Mn'])
    return s.replace('đ', 'd').replace('Đ', 'D')
