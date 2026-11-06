@echo off
title QuanLyDatSan - Reset Database
chcp 65001 >nul

echo ========================================================
echo   RESET CƠ SỞ DỮ LIỆU QUẢN LÝ ĐẶT SÂN VỀ DỮ LIỆU GỐC
echo ========================================================
echo.
echo CẢNH BÁO: Thao tác này sẽ xóa toàn bộ các đơn đặt sân,
echo hóa đơn, lịch sử thanh toán thử nghiệm và đưa hệ thống
echo về trạng thái dữ liệu mẫu ban đầu!
echo.
set /p confirm="Bạn có chắc chắn muốn reset không? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Đã hủy thao tác reset.
    pause
    exit /b
)

echo.
echo Đang tiến hành nạp file database/reset_database.sql...

:: 1. Kiểm tra Docker container quanlydatsan-mysql
docker ps 2>nul | findstr /i "quanlydatsan-mysql" >nul 2>&1
if %errorlevel% equ 0 (
    echo [Docker] Đang sao chép file UTF-8 vào container quanlydatsan-mysql...
    docker cp "%~dp0..\database\reset_database.sql" quanlydatsan-mysql:/tmp/reset_database.sql
    echo [Docker] Đang thực thi reset database với bảng mã UTF-8 (utf8mb4)...
    docker exec quanlydatsan-mysql mysql -uroot -proot --default-character-set=utf8mb4 -e "source /tmp/reset_database.sql"
    if %errorlevel% equ 0 (
        echo.
        echo ========================================================
        echo  [THÀNH CÔNG] Cơ sở dữ liệu đã được reset về dữ liệu gốc chuẩn UTF-8!
        echo ========================================================
        echo Kiểm tra dữ liệu tiếng Việt vừa nạp:
        docker exec quanlydatsan-mysql mysql -uroot -proot --default-character-set=utf8mb4 -e "USE QuanLyDatSan; SELECT MaDiaDiem, TenDiaDiem FROM DiaDiem;"
    ) else (
        echo [LỖI] Không thể reset qua Docker container.
    )
    goto end
)

:: 2. Nếu không dùng Docker, thử với mysql client local
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo [MySQL Client] Đang nạp qua mysql client trên cổng 3307/3306 với bảng mã utf8mb4...
    set "SQL_PATH=%~dp0..\database\reset_database.sql"
    set "SQL_PATH=%SQL_PATH:\=/%"
    mysql -h 127.0.0.1 -P 3307 -u root -proot --default-character-set=utf8mb4 -e "source %SQL_PATH%" 2>nul
    if %errorlevel% neq 0 (
        mysql -h 127.0.0.1 -P 3306 -u root -proot --default-character-set=utf8mb4 -e "source %SQL_PATH%"
    )
    if %errorlevel% equ 0 (
        echo.
        echo ========================================================
        echo  [THÀNH CÔNG] Cơ sở dữ liệu đã được reset về dữ liệu gốc chuẩn UTF-8!
        echo ========================================================
        mysql -h 127.0.0.1 -P 3307 -u root -proot --default-character-set=utf8mb4 -e "USE QuanLyDatSan; SELECT MaDiaDiem, TenDiaDiem FROM DiaDiem;" 2>nul
    ) else (
        echo [LỖI] Không thể kết nối tới MySQL local trên cổng 3307 hoặc 3306.
    )
    goto end
)

echo [LỖI] Không tìm thấy container Docker 'quanlydatsan-mysql' hoặc lệnh mysql.
echo Vui lòng đảm bảo Docker Desktop đang chạy và container quanlydatsan-mysql đang Up.

:end
echo.
pause
