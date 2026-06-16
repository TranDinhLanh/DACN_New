@echo off
echo ========================================
echo SETUP VA CHAY BACKEND
echo ========================================

echo.
echo [1/5] Fix OneDNN cho Windows...
set FLAGS_use_mkldnn=0
echo Disabled OneDNN (FLAGS_use_mkldnn=0)

echo.
echo [2/5] Kich hoat virtual environment...
call venv\Scripts\activate.bat

echo.
echo [3/5] Cap nhat pip...
python -m pip install --upgrade pip --quiet

echo.
echo [4/5] Cai dat dependencies...
pip install -r requirements.txt --quiet

echo.
echo [5/5] Chay FastAPI server...
echo Server se chay tai: http://localhost:8000
echo Docs API: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
