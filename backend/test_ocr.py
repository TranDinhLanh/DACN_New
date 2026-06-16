"""
Test script để kiểm tra OCR service
"""
import sys
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_paddleocr_import():
    """Test 1: Kiểm tra PaddleOCR có import được không"""
    print("\n" + "="*60)
    print("TEST 1: Import PaddleOCR")
    print("="*60)
    
    try:
        from paddleocr import PaddleOCR
        print("✅ PaddleOCR import thành công!")
        return True
    except Exception as e:
        print(f"❌ Lỗi import PaddleOCR: {e}")
        return False

def test_ocr_service():
    """Test 2: Kiểm tra OCRService class"""
    print("\n" + "="*60)
    print("TEST 2: OCRService Class")
    print("="*60)
    
    try:
        from app.services.ai_ocr import OCRService
        print("✅ OCRService import thành công!")
        return True
    except Exception as e:
        print(f"❌ Lỗi import OCRService: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_regex_extraction():
    """Test 3: Kiểm tra regex extraction"""
    print("\n" + "="*60)
    print("TEST 3: Regex Extraction")
    print("="*60)
    
    try:
        from app.services.ai_ocr import OCRService
        
        # Mock text từ hóa đơn
        mock_text = """
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
        
        result = OCRService._extract_with_regex(mock_text)
        
        print(f"Merchant: {result['merchant']}")
        print(f"Amount: {result['amount']}")
        print(f"Category: {result['category']}")
        print(f"Date: {result['transaction_date']}")
        
        assert result['merchant'] == "Highlands Coffee", "Merchant không đúng"
        assert result['amount'] == 85000.0, "Amount không đúng"
        assert result['category'] == "Food & Beverage", "Category không đúng"
        
        print("✅ Regex extraction hoạt động tốt!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test regex: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mock_mode():
    """Test 4: Kiểm tra mock mode (không có PaddleOCR)"""
    print("\n" + "="*60)
    print("TEST 4: Mock Mode (Fallback)")
    print("="*60)
    
    try:
        from app.services.ai_ocr import OCRService
        
        # Test với tên file giả
        result = OCRService.process_receipt_image(
            "fake_path.jpg", 
            "highlands_receipt.jpg"
        )
        
        print(f"Merchant: {result['merchant']}")
        print(f"Amount: {result['amount']}")
        print(f"Category: {result['category']}")
        print(f"Is Mock: {result['is_mock']}")
        
        print("✅ Mock mode hoạt động tốt!")
        return True
        
    except Exception as e:
        print(f"❌ Lỗi test mock mode: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Chạy tất cả tests"""
    print("\n" + "🚀 " + "="*58)
    print("🚀 BẮT ĐẦU KIỂM TRA OCR SERVICE")
    print("🚀 " + "="*58)
    
    results = []
    
    # Test 1: Import PaddleOCR
    results.append(("Import PaddleOCR", test_paddleocr_import()))
    
    # Test 2: OCRService class
    results.append(("OCRService Class", test_ocr_service()))
    
    # Test 3: Regex extraction
    results.append(("Regex Extraction", test_regex_extraction()))
    
    # Test 4: Mock mode
    results.append(("Mock Mode", test_mock_mode()))
    
    # Summary
    print("\n" + "📊 " + "="*58)
    print("📊 KẾT QUẢ KIỂM TRA")
    print("📊 " + "="*58)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print("\n" + "="*60)
    print(f"Tổng kết: {total_passed}/{total_tests} tests passed")
    print("="*60)
    
    if total_passed == total_tests:
        print("\n🎉 TẤT CẢ TESTS ĐỀU PASS! Hệ thống OCR hoạt động tốt!")
        return 0
    else:
        print("\n⚠️ MỘT SỐ TESTS BỊ FAIL. Vui lòng kiểm tra lại.")
        return 1

if __name__ == "__main__":
    exit(main())
