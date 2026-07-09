"""
text_preprocessor.py
====================
Module này có nhiệm vụ: Chuẩn hóa văn bản đầu vào.

Tại sao cần chuẩn hóa?
- Văn bản giao dịch thực tế rất "bẩn": "Cà Phê Sữa!!!", "CA PHE SUA", "ca-phe"
- Mô hình ML chỉ học được tốt nếu cùng một từ luôn được viết giống nhau.
- Bước này đảm bảo cả lúc TRAIN và lúc DỰ ĐOÁN đều xử lý văn bản theo cách nhất quán.

Luồng xử lý:
  Văn bản gốc
    → Chuyển thành chữ thường (lowercase)
    → Bỏ dấu tiếng Việt (unicode normalization)
    → Xóa ký tự đặc biệt, chỉ giữ chữ và số
    → Chuẩn hóa khoảng trắng
    → Lọc bỏ các từ không có nghĩa (stopwords)
    → Văn bản sạch (clean text)
"""

import re
import unicodedata


# Danh sách từ dừng tiếng Việt (stopwords).
# Đây là các từ không mang ý nghĩa phân loại như: "và", "của", "để", "với"...
# Khi tính TF-IDF, những từ này sẽ bị loại bỏ để giảm nhiễu.
VIETNAMESE_STOPWORDS = {
    "va", "cua", "cho", "de", "voi", "tren", "tai", "o",
    "di", "den", "trong", "ngoai", "tu", "ve", "theo",
    "mot", "cac", "nhung", "la", "co", "da", "se", "duoc",
    "thi", "ma", "vi", "nen", "hay", "hoac",
}


def remove_vietnamese_accents(original_text):
    """
    Bỏ dấu tiếng Việt: "Cà phê" → "Ca phe", "đồng" → "dong"

    Cách hoạt động:
    1. Dùng unicode NFD để tách ký tự ra thành ký tự gốc + dấu
       Ví dụ: "ê" → "e" + dấu mũ
    2. Lọc bỏ các ký tự phụ (dấu) - category "Mn" = Mark, Nonspacing
    3. Xử lý riêng chữ "đ" vì nó không tách được theo cách trên
    """
    # Bước 1: Tách ký tự + dấu ra
    decomposed_text = unicodedata.normalize("NFD", original_text)

    # Bước 2: Lọc bỏ phần dấu, chỉ giữ ký tự gốc
    clean_chars = []
    for char in decomposed_text:
        if unicodedata.category(char) != "Mn":
            clean_chars.append(char)
    text_no_accents = "".join(clean_chars)

    # Bước 3: Xử lý riêng chữ "đ" và "Đ"
    text_no_accents = text_no_accents.replace("đ", "d")
    text_no_accents = text_no_accents.replace("Đ", "D")

    return text_no_accents


def clean_text(original_text):
    """
    Chuẩn hóa một chuỗi văn bản qua 5 bước.

    Tham số đầu vào:
        original_text (str): Chuỗi văn bản gốc cần xử lý

    Kết quả trả về:
        str: Chuỗi văn bản đã được chuẩn hóa, sẵn sàng đưa vào TF-IDF
    """
    # Kiểm tra đầu vào - nếu không phải chuỗi thì trả về rỗng
    if not isinstance(original_text, str):
        return ""

    # Bước 1: Chuyển thành chữ thường và xóa khoảng trắng hai đầu
    lowercase_text = original_text.lower().strip()

    # Bước 2: Bỏ dấu tiếng Việt
    no_accent_text = remove_vietnamese_accents(lowercase_text)

    # Bước 3: Xóa ký tự đặc biệt, chỉ giữ lại chữ (a-z), số (0-9), khoảng trắng
    # Ví dụ: "Ca-phe!!!" → "Ca phe   "
    letters_only_text = re.sub(r"[^a-z0-9\s]", " ", no_accent_text)

    # Bước 4: Chuẩn hóa khoảng trắng - nhiều khoảng trắng → một khoảng trắng
    # Ví dụ: "Ca   phe" → "Ca phe"
    normalized_text = re.sub(r"\s+", " ", letters_only_text).strip()

    # Bước 5: Tách thành danh sách từ và lọc bỏ stopwords + từ quá ngắn (1 ký tự)
    word_list = normalized_text.split()
    filtered_words = []
    for word in word_list:
        if word not in VIETNAMESE_STOPWORDS and len(word) > 1:
            filtered_words.append(word)

    # Ghép các từ còn lại thành chuỗi
    final_text = " ".join(filtered_words)
    return final_text


def combine_transaction_info(merchant_name, description):
    """
    Ghép tên cửa hàng (merchant_name) và mô tả (description) thành một văn bản.

    Tại sao ghép lại?
    - merchant_name thường chứa tên thương hiệu: "Starbucks", "Grab"
    - description thường chứa loại hàng hóa: "ca phe", "di xe"
    - Ghép 2 nguồn lại giúp mô hình có nhiều thông tin hơn khi phân loại.

    Tại sao lặp merchant 2 lần?
    - Kỹ thuật "boosting": Lặp lại một từ làm cho TF (term frequency) của nó cao hơn.
    - TF-IDF sẽ tính trọng số cao hơn cho tên thương hiệu → kết quả chính xác hơn.

    Tham số đầu vào:
        merchant_name (str): Tên cửa hàng / thương hiệu
        description   (str): Mô tả giao dịch

    Kết quả trả về:
        str: Chuỗi văn bản đã ghép và chuẩn hóa
    """
    # Chuẩn hóa từng phần
    clean_merchant = clean_text(merchant_name)
    clean_description = clean_text(description)

    # Nếu có tên thương hiệu, lặp lại 2 lần (boosting)
    if clean_merchant:
        combined = clean_merchant + " " + clean_merchant + " " + clean_description
    else:
        combined = clean_description

    return combined.strip()
