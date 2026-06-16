@echo off
echo ========================================
echo FIX PADDLEOCR ONEDNN ERROR TREN WINDOWS
echo ========================================

echo.
echo [1/3] Kich hoat virtual environment...
call venv\Scripts\activate.bat

echo.
echo [2/3] Gỡ PaddlePaddle và PaddleOCR hiện tại...
pip uninstall paddlepaddle paddleocr -y

echo.
echo [3/3] Cài phiên bản ổn định (PaddlePaddle 2.6.2)...
pip install paddlepaddle==2.6.2 paddleocr==2.7.3

echo.
echo ========================================
echo HOAN TAT! Test bang lenh:
echo   python test_paddleocr_fix.py
echo ========================================
pause
