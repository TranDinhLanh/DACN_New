"""
ai_classify.py
==============
Module chính - Phân loại danh mục giao dịch tài chính.

Đây là "cửa ngõ" duy nhất mà phần còn lại của ứng dụng (API endpoint)
sẽ gọi vào. Module này phối hợp tất cả các module con:

    text_preprocessor.py → Chuẩn hóa văn bản đầu vào
    dataset_loader.py    → Đọc dữ liệu training từ CSV
    model_trainer.py     → Huấn luyện và lưu mô hình ML

Hai chế độ hoạt động:
1. ML Model Mode (Ưu tiên):
   Nếu đã có file classifier.pkl + vectorizer.pkl →
   Dùng Logistic Regression + TF-IDF để dự đoán (chính xác hơn)

2. Rule-Based Mode (Dự phòng):
   Nếu CHƯA có file pkl (chưa train) →
   Dùng danh sách từ khóa + regex để phân loại (đơn giản hơn)

Các danh mục có thể phân loại:
    - Food & Beverage  (Ăn uống)
    - Transportation   (Di chuyển)
    - Shopping         (Mua sắm)
    - Entertainment    (Giải trí)
    - Bills & Utilities (Hóa đơn, tiện ích)
    - Other            (Khác)

Cách dùng từ API endpoint:
    from app.services.ai_classify import classify_transaction

    category = classify_transaction(
        merchant_name="Starbucks",
        description="Coffee Latte"
    )
    # Kết quả: "Food & Beverage"
"""

import re
import logging

from app.services.text_preprocessor import combine_transaction_info
from app.services.dataset_loader import load_training_data
from app.services.model_trainer import (
    train_and_evaluate,
    save_trained_model,
    load_saved_model,
)

logger = logging.getLogger(__name__)


# ==============================================================================
# DANH MỤC PHÂN LOẠI
# ==============================================================================

# Danh sách 6 danh mục hệ thống hỗ trợ phân loại
ALL_CATEGORIES = [
    "Food & Beverage",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Other",
]


# ==============================================================================
# TỪ KHÓA RULE-BASED (dự phòng khi chưa có model)
# ==============================================================================

# Từ khóa cho từng danh mục - dùng khi chưa huấn luyện mô hình ML
# Đây là các chuỗi đơn giản, sẽ được so khớp bằng regex
CATEGORY_KEYWORDS = {
    "Food & Beverage": [
        "coffee", "cafe", "ca phe", "tra sua", "tea", "sua",
        "gongcha", "phuc long", "starbucks", "highlands",
        "bun", "pho", "com", "banh", "kem", "pizza", "burger",
        "ga", "thit", "lau", "nuong", "hai san", "mi", "chao",
        "an sang", "an trua", "an toi",
    ],
    "Transportation": [
        "grab", "taxi", "gojek", "be car", "be bike", "bus",
        "xang", "dau", "xe om", "may bay", "tau hoa", "xe khach",
        "vietjet", "vietnam airlines", "phuong trang",
    ],
    "Shopping": [
        "shopee", "lazada", "tiki", "winmart", "coopmart", "lotte",
        "bach hoa", "circle k", "ministop", "7-eleven", "gs25",
        "zara", "uniqlo", "adidas", "nike", "aeon", "emart",
        "my pham", "tap hoa", "guardian", "watsons",
    ],
    "Entertainment": [
        "cgv", "lotte cinema", "galaxy", "rap chieu phim",
        "netflix", "spotify", "steam", "garena", "playstation",
        "bar", "pub", "karaoke", "ca nhac", "trien lam",
        "dam sen", "vinwonders",
    ],
    "Bills & Utilities": [
        "evn", "dien luc", "cap nuoc", "viettel", "mobifone",
        "vinaphone", "fpt", "vnpt", "thue nha", "phi quan ly",
        "cap quang", "internet", "wifi", "hoc phi", "bao hiem",
    ],
}


# ==============================================================================
# BIẾN TOÀN CỤC - LƯU MODEL ĐÃ TẢI (giống Singleton trong Java)
# ==============================================================================

# Hai biến này lưu trữ mô hình ML đã tải vào bộ nhớ.
# Được tải MỘT LẦN khi server khởi động, dùng lại cho mọi request sau đó.
_loaded_classifier = None   # Mô hình Logistic Regression
_loaded_vectorizer = None   # TF-IDF Vectorizer đã học từ vựng


# ==============================================================================
# CÁC HÀM CHÍNH
# ==============================================================================

def initialize_model():
    """
    Tải mô hình ML từ file .pkl khi server khởi động.

    Hàm này được gọi một lần duy nhất lúc import module.
    Nếu file pkl chưa tồn tại → báo log và dùng rule-based.
    Nếu file pkl tồn tại → tải vào RAM để dùng cho predict.

    Không có tham số đầu vào.
    Không có kết quả trả về (cập nhật biến toàn cục).
    """
    global _loaded_classifier, _loaded_vectorizer

    # Gọi hàm load từ module model_trainer
    classifier, vectorizer = load_saved_model()

    if classifier is not None and vectorizer is not None:
        # Lưu vào biến toàn cục để dùng lại
        _loaded_classifier = classifier
        _loaded_vectorizer = vectorizer
        logger.info("✅ AI Classifier đã sẵn sàng (ML Model mode)")
    else:
        logger.info("ℹ️  AI Classifier dùng Rule-Based mode (chưa có model pkl)")


def classify_transaction(merchant_name, description):
    """
    Phân loại một giao dịch tài chính vào đúng danh mục.

    Đây là hàm chính được gọi từ API endpoint.

    Quy trình:
    1. Ghép merchant_name + description thành văn bản đã chuẩn hóa
    2. Nếu đã có model ML → dùng ML để dự đoán (chính xác hơn)
    3. Nếu chưa có model   → dùng rule-based để dự đoán (dự phòng)

    Tham số đầu vào:
        merchant_name (str): Tên cửa hàng / thương hiệu (có thể rỗng)
        description   (str): Mô tả giao dịch (có thể rỗng)

    Kết quả trả về:
        str: Tên danh mục, ví dụ "Food & Beverage", "Transportation", ...
    """
    global _loaded_classifier, _loaded_vectorizer

    # Bước 1: Chuẩn hóa và ghép văn bản đầu vào
    transaction_text = combine_transaction_info(merchant_name, description)

    # Bước 2: Kiểm tra có model ML không
    model_is_ready = (_loaded_classifier is not None and _loaded_vectorizer is not None)

    if model_is_ready:
        # Dùng ML Model để dự đoán
        predicted_category = predict_with_ml_model(transaction_text)
        return predicted_category
    else:
        # Dùng Rule-Based để dự đoán
        predicted_category = predict_with_rules(transaction_text)
        return predicted_category


def predict_with_ml_model(transaction_text):
    """
    Dự đoán danh mục bằng mô hình Logistic Regression + TF-IDF.

    Quy trình:
    1. Chuyển văn bản thành vector TF-IDF (dùng vectorizer đã fit)
    2. Đưa vector vào Logistic Regression để nhận nhãn
    3. Trả về nhãn dự đoán

    Tham số đầu vào:
        transaction_text (str): Văn bản giao dịch đã chuẩn hóa

    Kết quả trả về:
        str: Tên danh mục được dự đoán
    """
    global _loaded_classifier, _loaded_vectorizer

    try:
        # Bước 1: Chuyển văn bản thành vector TF-IDF
        # transform([text]) → cần truyền vào dạng list, trả về ma trận sparse
        text_as_vector = _loaded_vectorizer.transform([transaction_text])

        # Bước 2: Model dự đoán danh mục từ vector
        # predict() trả về array, lấy phần tử đầu tiên [0]
        prediction_array = _loaded_classifier.predict(text_as_vector)
        predicted_category = str(prediction_array[0])

        logger.debug("ML predict: '" + transaction_text[:50] + "' → " + predicted_category)
        return predicted_category

    except Exception as error:
        # Nếu ML lỗi → fallback sang rule-based
        logger.warning("ML predict lỗi: " + str(error) + " → fallback rule-based")
        return predict_with_rules(transaction_text)


def predict_with_rules(transaction_text):
    """
    Dự đoán danh mục bằng cách so khớp từ khóa (Rule-Based).

    Đây là phương pháp dự phòng khi chưa có model ML.
    Cách hoạt động:
    - Duyệt qua từng danh mục trong CATEGORY_KEYWORDS
    - Với mỗi danh mục, kiểm tra xem văn bản có chứa từ khóa nào không
    - Nếu tìm thấy từ khóa khớp → trả về danh mục đó
    - Nếu không tìm thấy → trả về "Other"

    Tham số đầu vào:
        transaction_text (str): Văn bản giao dịch đã chuẩn hóa

    Kết quả trả về:
        str: Tên danh mục phù hợp, hoặc "Other" nếu không khớp
    """
    # Duyệt qua từng danh mục và danh sách từ khóa của nó
    for category_name, keyword_list in CATEGORY_KEYWORDS.items():
        for keyword in keyword_list:
            # Dùng regex để tìm từ khóa trong văn bản
            if re.search(keyword, transaction_text):
                logger.debug("Rule match: '" + transaction_text[:40] + "' → " + category_name)
                return category_name

    # Không tìm thấy từ khóa nào khớp → "Khác"
    return "Other"


def train_new_model(csv_file_path):
    """
    Huấn luyện lại mô hình từ file CSV mới.

    Dùng khi: Có dữ liệu mới muốn cải thiện độ chính xác của model.

    Quy trình:
    1. Đọc dữ liệu từ file CSV
    2. Kiểm tra có đủ dữ liệu không (tối thiểu 10 mẫu)
    3. Huấn luyện Logistic Regression + TF-IDF
    4. Lưu model mới vào file pkl
    5. Tải model mới vào bộ nhớ để dùng ngay

    Tham số đầu vào:
        csv_file_path (str): Đường dẫn đến file CSV training data

    Kết quả trả về:
        bool: True nếu train thành công, False nếu có lỗi
    """
    global _loaded_classifier, _loaded_vectorizer

    print("\n" + "=" * 60)
    print("  BẮT ĐẦU HUẤN LUYỆN MÔ HÌNH AI PHÂN LOẠI GIAO DỊCH")
    print("=" * 60)

    # Bước 1: Đọc dữ liệu CSV
    print("\n  [Bước 1] Đọc dữ liệu training từ CSV...")
    try:
        transaction_texts, category_labels = load_training_data(csv_file_path)
    except Exception as error:
        logger.error("Lỗi đọc CSV: " + str(error))
        print("  ❌ Lỗi đọc file CSV: " + str(error))
        return False

    # Bước 2: Kiểm tra số lượng mẫu
    total_samples = len(transaction_texts)
    if total_samples < 10:
        print("  ❌ Dataset quá nhỏ: " + str(total_samples) + " mẫu. Cần ít nhất 10 mẫu.")
        return False

    # In thông tin phân phối danh mục
    print("\n  Phân phối danh mục trong dataset:")
    print_category_distribution(category_labels)

    # Bước 3: Huấn luyện mô hình
    print("\n  [Bước 2] Huấn luyện mô hình...")
    trained_classifier, fitted_vectorizer, test_f1 = train_and_evaluate(
        transaction_texts, category_labels
    )

    if trained_classifier is None:
        print("  ❌ Huấn luyện thất bại!")
        return False

    # Bước 4: Lưu model vào file pkl
    print("\n  [Bước 3] Lưu mô hình vào file...")
    save_success = save_trained_model(trained_classifier, fitted_vectorizer)

    if not save_success:
        return False

    # Bước 5: Tải model mới vào bộ nhớ để dùng ngay
    _loaded_classifier = trained_classifier
    _loaded_vectorizer = fitted_vectorizer

    print("\n" + "=" * 60)
    print("  ✅ HUẤN LUYỆN HOÀN TẤT!")
    print("  F1-score trên tập test: " + "{:.2%}".format(test_f1))
    print("  Mô hình đã sẵn sàng phân loại giao dịch mới.")
    print("=" * 60)

    return True


def print_category_distribution(category_labels):
    """
    In ra phân phối số lượng mẫu theo từng danh mục.

    Tham số đầu vào:
        category_labels (list): Danh sách nhãn danh mục
    """
    # Đếm số lượng từng danh mục
    category_counts = {}
    for label in category_labels:
        if label in category_counts:
            category_counts[label] = category_counts[label] + 1
        else:
            category_counts[label] = 1

    total = len(category_labels)

    # In ra theo từng danh mục (sắp xếp theo tên)
    sorted_categories = sorted(category_counts.keys())
    for category_name in sorted_categories:
        count = category_counts[category_name]
        percentage = count / total
        # Tạo thanh hiển thị trực quan (mỗi █ = ~3.3%)
        bar_length = int(count / total * 30)
        bar = "█" * bar_length
        print("    " + category_name.ljust(25) + str(count).rjust(4) + "  " + bar)


# ==============================================================================
# KHỞI TẠO KHI IMPORT MODULE
# ==============================================================================
# Tự động tải model khi module được import lần đầu.
# Điều này xảy ra một lần duy nhất khi server FastAPI khởi động.
initialize_model()
