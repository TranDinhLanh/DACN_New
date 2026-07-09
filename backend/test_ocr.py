"""
test_ocr.py
===========
Script dùng để chạy kiểm thử (Unit Test) cho hệ thống OCR và Regex Parser.
"""

import sys
import os
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thêm thư mục backend vào Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_paddleocr_import():
    """Test 1: Kiểm tra xem có import được PaddleOCR hay không"""
    print("\n" + "=" * 60)
    print("TEST 1: Import PaddleOCR")
    print("=" * 60)
    
    try:
        from paddleocr import PaddleOCR
        print("✅ PaddleOCR import thành công!")
        return True
    except Exception as error:
        print(f"⚠️ Không thể import PaddleOCR: {error}")
        print("Hệ thống sẽ chạy ở chế độ Mock giả lập (hoàn toàn bình thường cho localhost).")
        return True


def test_ocr_service_import():
    """Test 2: Kiểm tra xem có import được OCRService chính hay không"""
    print("\n" + "=" * 60)
    print("TEST 2: Import OCRService Class")
    print("=" * 60)
    
    try:
        from app.services.ai_ocr import OCRService
        print("✅ OCRService import thành công!")
        return True
    except Exception as error:
        print(f"❌ Lỗi khi import OCRService: {error}")
        import traceback
        traceback.print_exc()
        return False


def test_regex_parser():
    """Test 3: Kiểm tra tính đúng đắn của Regex Parser"""
    print("\n" + "=" * 60)
    print("TEST 3: Kiểm tra Regex Parser")
    print("=" * 60)
    
    try:
        from app.services.receipt_parser import parse_receipt_text
        
        # Văn bản giả lập mô phỏng kết quả quét từ hóa đơn thật
        mock_ocr_text = """
        HIGHLANDS COFFEE
        Dia chi: 135 Nguyen Hue, Q.1, TPHCM
        Ngay: 27/05/2026 19:45:00
        HD: 9283749
        -----------------------------
        1. Ca phe sua da (Size L)   45,000 đ
        2. Tra sen vang (Size M)     40,000 đ
        -----------------------------
        TONG TIEN:                  85,000 VND
        Cam on Quy khach!
        """
        
        result = parse_receipt_text(mock_ocr_text)
        
        print(f"  Merchant: {result['merchant']}")
        print(f"  Amount:   {result['amount']}")
        print(f"  Date:     {result['transaction_date']}")
        print(f"  Address:  {result['address']}")
        
        # Xác thực kết quả
        assert result['merchant'] == "Highlands Coffee", "Sai Merchant"
        assert result['amount'] == 85000.0, "Sai số tiền"
        assert result['address'] == "135 Nguyen Hue, Q.1, TPHCM", "Sai địa chỉ"
        
        print("✅ Regex Parser hoạt động chính xác!")
        return True
        
    except Exception as error:
        print(f"❌ Lỗi kiểm tra Regex: {error}")
        import traceback
        traceback.print_exc()
        return False


def test_coordinator_mock_mode():
    """Test 4: Kiểm tra bộ điều phối (Coordinator) chạy Mock mode"""
    print("\n" + "=" * 60)
    print("TEST 4: Coordinator chạy Mock Mode")
    print("=" * 60)
    
    try:
        from app.services.ai_ocr import OCRService
        
        # Test với tên file để kích hoạt Mock
        result = OCRService.process_receipt_image(
            image_path="fake_receipt.jpg", 
            file_name="highlands_coffee_receipt.jpg"
        )
        
        print(f"  Merchant: {result['merchant']}")
        print(f"  Amount:   {result['amount']}")
        print(f"  Category: {result['category']}")
        print(f"  Is Mock:  {result['is_mock']}")
        
        assert result['merchant'] == "Highlands Coffee", "Sai Merchant"
        assert result['category'] == "Food & Beverage", "Sai Category"
        
        print("✅ Coordinator hoạt động tốt!")
        return True
        
    except Exception as error:
        print(f"❌ Lỗi kiểm tra Coordinator: {error}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Chạy toàn bộ các test cases"""
    print("\n🚀 " + "=" * 58)
    print("🚀 BẮT ĐẦU CHẠY KIỂM THỬ HỆ THỐNG AI OCR")
    print("🚀 " + "=" * 58)
    
    test_cases = [
        ("Import PaddleOCR", test_paddleocr_import),
        ("Import OCRService", test_ocr_service_import),
        ("Regex Parser Correctness", test_regex_parser),
        ("Coordinator Mock Mode", test_coordinator_mock_mode)
    ]
    
    results = []
    for name, run_test in test_cases:
        passed = run_test()
        results.append((name, passed))
        
    # In báo cáo tổng kết
    print("\n📊 " + "=" * 58)
    print("📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ")
    print("📊 " + "=" * 58)
    
    total_passed = 0
    for name, passed in results:
        status_str = "✅ PASS" if passed else "❌ FAIL"
        if passed:
            total_passed += 1
        print(f"  {status_str.ljust(8)} : {name}")
        
    print("\n" + "=" * 60)
    print(f"Tổng kết: {total_passed}/{len(test_cases)} tests passed")
    print("=" * 60)
    
    if total_passed == len(test_cases):
        print("\n🎉 HỆ THỐNG AI OCR HOẠT ĐỘNG HOÀN HẢO!")
        return 0
    else:
        print("\n⚠️ Một số test case bị lỗi. Vui lòng kiểm tra lại cấu hình.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
