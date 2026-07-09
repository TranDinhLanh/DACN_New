"""
train_classifier.py
===================
Script dùng để huấn luyện lại mô hình AI phân loại giao dịch.

Cách dùng:
    cd backend
    python train_classifier.py
    python train_classifier.py --csv duong/dan/file.csv

Khi nào cần chạy lại?
    - Khi bổ sung thêm dữ liệu mới vào file CSV
    - Khi muốn cải thiện độ chính xác của mô hình
    - Khi thay đổi tập danh mục phân loại
"""

import os
import sys

# Thêm thư mục backend vào đường dẫn Python để import được các module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    """
    Hàm main: Đọc tham số từ dòng lệnh và chạy quá trình huấn luyện.
    """
    import argparse

    # Thiết lập parser để đọc tham số từ dòng lệnh
    parser = argparse.ArgumentParser(description="Huấn luyện mô hình AI phân loại giao dịch")
    parser.add_argument(
        "--csv",
        default="vietnamese_transactions_dataset.csv",
        help="Đường dẫn đến file CSV chứa dữ liệu training",
    )

    args = parser.parse_args()

    # Kiểm tra file CSV có tồn tại không
    if not os.path.exists(args.csv):
        print("❌ Không tìm thấy file CSV: " + args.csv)
        sys.exit(1)

    # Import hàm train từ module chính
    from app.services.ai_classify import train_new_model

    # Chạy quá trình huấn luyện
    is_success = train_new_model(csv_file_path=args.csv)

    if is_success:
        # Kiểm tra thử kết quả sau khi train
        print("\n  Kiểm tra thử một số giao dịch mẫu:")
        from app.services.ai_classify import classify_transaction

        sample_transactions = [
            ("Highlands Coffee", "ca phe sua da"),
            ("GrabCar",          "di lam vincom"),
            ("WinMart",          "mua thuc pham"),
            ("CGV",              "ve xem phim avengers"),
            ("EVN",              "hoa don tien dien"),
            ("Tap Hoa",          "mua do dung gia dinh"),
        ]

        print("\n  Merchant               Mô tả                     → Danh mục")
        print("  " + "-" * 65)

        for merchant_name, description in sample_transactions:
            predicted_category = classify_transaction(
                merchant_name=merchant_name,
                description=description
            )
            print("  " + merchant_name.ljust(22) + description.ljust(26) + " → " + predicted_category)
    else:
        print("\n❌ Huấn luyện thất bại. Kiểm tra lại file CSV và thử lại.")
        sys.exit(1)


if __name__ == "__main__":
    main()
