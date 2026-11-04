@echo off
chcp 65001 >nul
echo ========================================================
echo    KHOI DONG MYSQL LOCAL CHO PROJECT
echo ========================================================
echo.

:: 1. Kiem tra xem Docker co dang chay khong
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [Docker] Phat hien Docker Desktop dang hoat dong!
    echo Dang khoi dong container MySQL 8.0 tu docker-compose.yml...
    cd /d "%~dp0\.."
    docker compose up -d mysql
    echo.
    echo [OK] MySQL container da duoc khoi dong thanh cong!
    echo - Host: localhost
    echo - Port: 3307 hoac 3306 (xem trong docker-compose.yml)
    echo - User: root
    echo - Pass: root
    echo - Database: QuanLyDatSan
    goto end
)

:: 2. Neu khong co Docker, thu bat dich vu Windows Service
echo [Windows Service] Thu khoi dong dich vu MySQL tren Windows...
net start MySQL >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Da bat dich vu MySQL thanh cong tren port 3306!
    goto import_sql
)

net start MySQL80 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Da bat dich vu MySQL80 thanh cong tren port 3306!
    goto import_sql
)

echo [!] Khong tim thay Docker hoac Service MySQL tu dong.
echo Huong dan:
echo   1. Neu dung Docker: Vui long mo Docker Desktop roi chay lai file nay.
echo   2. Neu dung MySQL cai tren may: Vui long mo MySQL Installer/Workbench hoac Services (services.msc) de Start MySQL.
goto end

:import_sql
echo.
echo Ban co muon nap file database/QLSanCauLong.sql vao MySQL local ngay khong? (Y/N)
set /p choice="Lua chon: "
if /i "%choice%"=="Y" (
    cd /d "%~dp0\.."
    set "SQL_FILE=%~dp0..\database\QLSanCauLong.sql"
    set "SQL_FILE=%SQL_FILE:\=/%"
    if exist "C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" (
        "C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 -e "source %SQL_FILE%"
    ) else (
        mysql -u root -p --default-character-set=utf8mb4 -e "source %SQL_FILE%"
    )
    echo [OK] Nap co so du lieu hoan tat!
)

:end
echo.
pause
