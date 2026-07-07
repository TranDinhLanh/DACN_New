"""
train_classifier.py
Script chạy training CategoryClassifier từ file CSV.

Cách dùng:
    cd backend
    python train_classifier.py
    python train_classifier.py --csv data/my_data.csv --out app/services/models
"""

import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main() -> None:
    parser = argparse.ArgumentParser(description="Train CategoryClassifier")
    parser.add_argument(
        "--csv",
        default="vietnamese_transactions_dataset.csv",
        help="Đường dẫn file CSV training data",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Thư mục lưu model (mặc định: app/services/models/)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.csv):
        print(f"❌ Không tìm thấy file: {args.csv}")
        sys.exit(1)

    from app.services.ai_classify import CategoryClassifier

    classifier = CategoryClassifier()
    success = classifier.train(args.csv, save_dir=args.out)

    if success:
        print("\n✅ Training hoàn tất! Kiểm tra phân loại thử:")
        samples = [
            ("Highlands Coffee", "ca phe sua da"),
            ("GrabCar",          "di lam vincom"),
            ("WinMart",          "mua thuc pham"),
            ("CGV",              "ve xem phim avengers"),
            ("EVN",              "hoa don tien dien"),
            ("Tap Hoa",          ""),
        ]
        print(f"\n  {'Merchant':<20} {'Description':<25} → Category")
        print(f"  {'─'*20} {'─'*25}   {'─'*20}")
        for merchant, desc in samples:
            cat = classifier.predict(merchant, desc)
            print(f"  {merchant:<20} {desc:<25} → {cat}")
    else:
        print("\n❌ Training thất bại.")
        sys.exit(1)


if __name__ == "__main__":
    main()
