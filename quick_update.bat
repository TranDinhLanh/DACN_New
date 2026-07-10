@echo off
SET VPS_IP=160.250.181.63
SET VPS_USER=root
SET DEST_DIR=/var/www/personal-finance

echo =======================================================
echo     BAT CAP NHAT NHANH MA NGUON LEN VPS (QUICK UPDATE)
echo =======================================================
echo.
echo [1/3] Dang nen cac file code vua chinh sua...
tar -czf update.tar.gz backend/app/main.py frontend/src/lib/api.ts frontend/src/app/dashboard/components/Ocr.tsx frontend/next.config.ts

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Khong the nen file.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Dang day file cap nhat update.tar.gz len VPS...
scp update.tar.gz %VPS_USER%@%VPS_IP%:%DEST_DIR%/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Upload file len VPS that bai.
    del update.tar.gz
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Dang giai nen de de len code cu va build lai container...
ssh %VPS_USER%@%VPS_IP% "cd %DEST_DIR% && tar -xzf update.tar.gz && rm update.tar.gz && docker compose build frontend backend && docker compose up -d"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Build va restart container that bai.
    del update.tar.gz
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [Hoan tat] Xoa file tam...
del update.tar.gz

echo.
echo =======================================================
echo  CAP NHAT MA NGUON THANH CONG!
echo =======================================================
pause
