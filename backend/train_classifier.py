import os
import sys

# Add current directory to Python Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_classify import CategoryClassifier

def main():
    print("==================================================")
    print("🚀 BAT DAU HUAN LUYEN MO HINH PHAN LOAI GIAO DICH...")
    csv_path = "vietnamese_transactions_dataset.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ Khong tim thay file du lieu: {csv_path}")
        return
        
    success = CategoryClassifier.train_model(csv_path)
    if success:
        print("✅ Huan luyen mo hinh thanh cong!")
        print("\nTest thu nghiem phan loai:")
        test_samples = [
            "Highlands Coffee Nguyen Hue",
            "GrabBike chuyen di",
            "Sieu thi WinMart Thao Dien",
            "Ve xem phim CGV Landmark 81",
            "Thanh toan tien dien EVN",
            "Tiem tap hoa co Hoa",
            "An lau nuong Kichi Kichi"
        ]
        for sample in test_samples:
            category = CategoryClassifier.classify(sample)
            print(f" - '{sample}' => [{category}]")
    else:
        print("❌ Huan luyen mo hinh that bai.")
    print("==================================================")

if __name__ == "__main__":
    main()
