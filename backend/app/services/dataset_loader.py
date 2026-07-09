"""
dataset_loader.py
=================
Module này có nhiệm vụ: Đọc file CSV chứa dữ liệu training.

File CSV có dạng:
    merchant_name, description,    category
    Starbucks,     Coffee Latte,   Food & Beverage
    Grab,          Di xe may,      Transportation
    Shopee,        Mua ao thun,    Shopping

Kết quả đầu ra: 2 danh sách song song:
    - transaction_texts:  ["starbucks coffee latte", "grab di xe may", ...]
    - category_labels:    ["Food & Beverage", "Transportation", ...]

Dùng hai danh sách này để đưa vào TF-IDF và Logistic Regression.
"""

import os
import csv
import logging

from app.services.text_preprocessor import combine_transaction_info

# Ghi log để theo dõi quá trình tải dữ liệu
logger = logging.getLogger(__name__)


def load_training_data(csv_file_path):
    """
    Đọc file CSV và trả về 2 danh sách: văn bản và nhãn phân loại.

    Quy trình:
    1. Kiểm tra file có tồn tại không
    2. Mở file CSV và đọc từng hàng
    3. Lấy merchant_name, description, category từ mỗi hàng
    4. Ghép merchant và description thành văn bản đã chuẩn hóa
    5. Bỏ qua hàng nếu thiếu category hoặc văn bản rỗng
    6. Lọc bỏ các hàng bị trùng (cùng văn bản + cùng category)
    7. Trả về hai danh sách: transaction_texts và category_labels

    Tham số đầu vào:
        csv_file_path (str): Đường dẫn đến file CSV

    Kết quả trả về:
        tuple: (transaction_texts, category_labels)
               transaction_texts: danh sách chuỗi văn bản đã chuẩn hóa
               category_labels:   danh sách nhãn phân loại tương ứng
    """
    # Bước 1: Kiểm tra file có tồn tại không
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError("Không tìm thấy file CSV: " + csv_file_path)

    # Khởi tạo danh sách kết quả rỗng
    transaction_texts = []
    category_labels = []

    # Tập hợp để kiểm tra trùng lặp
    seen_records = set()

    # Bước 2: Mở file CSV và đọc từng hàng
    with open(csv_file_path, encoding="utf-8-sig") as csv_file:
        csv_reader = csv.DictReader(csv_file)

        for row in csv_reader:
            # Bước 3: Chuẩn hóa tên cột (bỏ khoảng trắng, chuyển thường)
            cleaned_row = {}
            for key, value in row.items():
                if key is not None:
                    cleaned_key = key.strip().lower()
                    cleaned_row[cleaned_key] = str(value).strip()

            # Lấy các trường cần thiết từ hàng CSV
            merchant_name = cleaned_row.get("merchant_name", "")
            description = cleaned_row.get("description", "")
            category = cleaned_row.get("category", "")

            # Bước 5: Bỏ qua hàng nếu không có category
            if not category:
                continue

            # Bước 4: Ghép và chuẩn hóa văn bản
            transaction_text = combine_transaction_info(merchant_name, description)

            # Bước 5: Bỏ qua nếu văn bản rỗng sau chuẩn hóa
            if not transaction_text:
                continue

            # Bước 6: Kiểm tra trùng lặp - tạo khóa từ (văn bản, nhãn)
            duplicate_key = (transaction_text, category)
            if duplicate_key in seen_records:
                continue

            # Thêm vào tập đã thấy và vào danh sách kết quả
            seen_records.add(duplicate_key)
            transaction_texts.append(transaction_text)
            category_labels.append(category)

    # Ghi log tổng số mẫu đọc được
    total_samples = len(transaction_texts)
    logger.info("Đọc được " + str(total_samples) + " mẫu từ file " + csv_file_path)
    print("  [Dataset] Đọc được " + str(total_samples) + " mẫu hợp lệ từ CSV.")

    return transaction_texts, category_labels
