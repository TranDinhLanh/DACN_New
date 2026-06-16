@echo off
echo ========================================
echo CAI DAT PADDLEOCR CHO OCR HOA DON
echo ========================================

echo.
echo [1/3] Kich hoat virtual environment...
call venv\Scripts\activate.bat

echo.
echo [2/3] Cai dat PaddleOCR va PaddlePaddle...
pip install paddlepaddle==2.6.2 paddleocr==2.7.3

echo.
echo [3/3] Kiem tra cai dat...
python -c "from paddleocr import PaddleOCR; print('PaddleOCR da duoc cai dat thanh cong!')"

echo.
echo ========================================
echo HOAN TAT! Ban co the chay server bang:
echo   setup_and_run.bat
echo ========================================
pause
