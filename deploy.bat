@echo off
SET VPS_IP=160.250.181.63
SET VPS_USER=root
SET DEST_DIR=/var/www/personal-finance

echo =======================================================
echo          BAT TRIEN KHAI DU AN LEN VPS
echo =======================================================
echo.
echo [1/4] Dang dong goi nguon (loai bo node_modules, .next, venv, .git)...
tar --exclude="node_modules" --exclude=".next" --exclude="venv" --exclude=".git" --exclude="local_database.db" --exclude="project.tar.gz" --exclude="*.bat" -czf project.tar.gz backend frontend docker-compose.yml

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Khong the dong goi ma nguon bang lenh tar.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/4] Dang tao thu muc va tai file project.tar.gz len VPS...
ssh %VPS_USER%@%VPS_IP% "mkdir -p %DEST_DIR%"
scp project.tar.gz %VPS_USER%@%VPS_IP%:%DEST_DIR%/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Tai file len VPS that bai. Kiem tra ket noi SSH.
    del project.tar.gz
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/4] Dang giai nen va khoi chay Docker Compose tren VPS...
ssh %VPS_USER%@%VPS_IP% "cd %DEST_DIR% && tar -xzf project.tar.gz && rm project.tar.gz && docker compose up -d --build"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Loi] Chay docker-compose tren VPS that bai.
    del project.tar.gz
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/4] Don dep file tam tren may cuc bo...
del project.tar.gz

echo.
echo =======================================================
echo  TRIEN KHAI HOAN TAT!
echo  - Frontend cua ban: http://%VPS_IP%:3001
echo  - Backend API:      http://%VPS_IP%:8001
echo =======================================================
pause
