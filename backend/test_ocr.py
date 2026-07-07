"""
Test script ─æß╗â kiß╗âm tra OCR service
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
    """Test 1: Kiß╗âm tra PaddleOCR c├│ import ─æ╞░ß╗úc kh├┤ng"""
    print("\n" + "="*60)
    print("TEST 1: Import PaddleOCR")
    print("="*60)
    
    try:
        from paddleocr import PaddleOCR
        print("Γ£à PaddleOCR import th├ánh c├┤ng!")
        return True
    except Exception as e:
        print(f"Γ¥î Lß╗ùi import PaddleOCR: {e}")
        return False

def test_ocr_service():
    """Test 2: Kiß╗âm tra OCRService class"""
    print("\n" + "="*60)
    print("TEST 2: OCRService Class")
    print("="*60)
    
    try:
        from app.services.ai_ocr import OCRService
        print("Γ£à OCRService import th├ánh c├┤ng!")
        return True
    except Exception as e:
        print(f"Γ¥î Lß╗ùi import OCRService: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_regex_extraction():
    """Test 3: Kiß╗âm tra regex extraction"""
    print("\n" + "="*60)
    print("TEST 3: Regex Extraction")
    print("="*60)
    
    try:
        from app.services.ai_ocr import OCRService
        
        # Mock text tß╗½ h├│a ─æ╞ín
        mock_text = """
        HIGHLANDS COFFEE
        Dia chi: 135 Nguyen Hue, Q.1, TPHCM
        Ngay: 27/05/2026 19:45:00
        HD: 9283749
        -----------------------------
        1. Ca phe sua da (Size L)   45,000 ─æ
        2. Tra sen vang (Size M)     40,000 ─æ
        -----------------------------
        TONG TIEN:                  85,000 VND
        Cam on Quy khach!
        """
        
        result = OCRService._extract_with_regex(mock_text)
        
        print(f"Merchant: {result['merchant']}")
        print(f"Amount: {result['amount']}")
        print(f"Category: {result['category']}")
        print(f"Date: {result['transaction_date']}")
        
        assert result['merchant'] == "Highlands Coffee", "Merchant kh├┤ng ─æ├║ng"
        assert result['amount'] == 85000.0, "Amount kh├┤ng ─æ├║ng"
        assert result['category'] == "Food & Beverage", "Category kh├┤ng ─æ├║ng"
        
        print("Γ£à Regex extraction hoß║ít ─æß╗Öng tß╗æt!")
        return True
        
    except Exception as e:
        print(f"Γ¥î Lß╗ùi test regex: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mock_mode():
    """Test 4: Kiß╗âm tra mock mode (kh├┤ng c├│ PaddleOCR)"""
    print("\n" + "="*60)
    print("TEST 4: Mock Mode (Fallback)")
    print("="*60)
    
    try:
        from app.services.ai_ocr import OCRService
        
        # Test vß╗¢i t├¬n file giß║ú
        result = OCRService.process_receipt_image(
            "fake_path.jpg", 
            "highlands_receipt.jpg"
        )
        
        print(f"Merchant: {result['merchant']}")
        print(f"Amount: {result['amount']}")
        print(f"Category: {result['category']}")
        print(f"Is Mock: {result['is_mock']}")
        
        print("Γ£à Mock mode hoß║ít ─æß╗Öng tß╗æt!")
        return True
        
    except Exception as e:
        print(f"Γ¥î Lß╗ùi test mock mode: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Chß║íy tß║Ñt cß║ú tests"""
    print("\n" + "≡ƒÜÇ " + "="*58)
    print("≡ƒÜÇ Bß║«T ─Éß║ªU KIß╗éM TRA OCR SERVICE")
    print("≡ƒÜÇ " + "="*58)
    
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
    print("\n" + "≡ƒôè " + "="*58)
    print("≡ƒôè Kß║╛T QUß║ó KIß╗éM TRA")
    print("≡ƒôè " + "="*58)
    
    for test_name, passed in results:
        status = "Γ£à PASS" if passed else "Γ¥î FAIL"
        print(f"{status}: {test_name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print("\n" + "="*60)
    print(f"Tß╗òng kß║┐t: {total_passed}/{total_tests} tests passed")
    print("="*60)
    
    if total_passed == total_tests:
        print("\n≡ƒÄë Tß║ñT Cß║ó TESTS ─Éß╗ÇU PASS! Hß╗ç thß╗æng OCR hoß║ít ─æß╗Öng tß╗æt!")
        return 0
    else:
        print("\nΓÜá∩╕Å Mß╗ÿT Sß╗É TESTS Bß╗è FAIL. Vui l├▓ng kiß╗âm tra lß║íi.")
        return 1

if __name__ == "__main__":
    exit(main())
