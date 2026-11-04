# ========================================================
# Script Mở Khóa Tài Khoản Admin & Khách Hàng Bị Khóa Nhầm
# ========================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   MỞ KHÓA TÀI KHOẢN ADMIN & NGƯỜI DÙNG VỀ 'HoatDong'" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$unlocked = $false
$sqlQuery = "USE QuanLyDatSan; UPDATE TaiKhoan SET TrangThai = 'HoatDong' WHERE TenDangNhap IN ('admin', 'cuong.le'); SELECT MaTK, TenDangNhap, TrangThai FROM TaiKhoan WHERE TenDangNhap IN ('admin', 'cuong.le');"

# 1. Thử qua Docker container quanlydatsan-mysql
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    if ($containers -match "quanlydatsan-mysql") {
        Write-Host "[Docker] Đang kết nối container quanlydatsan-mysql..." -ForegroundColor Cyan
        docker exec quanlydatsan-mysql mysql -uroot -proot -e "$sqlQuery"
        if ($LASTEXITCODE -eq 0) {
            $unlocked = $true
        }
    }
} catch {}

# 2. Thử qua MySQL Client (cổng 3307 hoặc 3306)
if (-not $unlocked) {
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd) {
        Write-Host "[MySQL Client] Đang kết nối MySQL port 3307/3306..." -ForegroundColor Cyan
        & mysql -h 127.0.0.1 -P 3307 -u root -proot -e "$sqlQuery" 2>$null
        if ($LASTEXITCODE -ne 0) {
            & mysql -h 127.0.0.1 -P 3306 -u root -proot -e "$sqlQuery"
        }
        if ($LASTEXITCODE -eq 0) {
            $unlocked = $true
        }
    }
}

if ($unlocked) {
    Write-Host ""
    Write-Host " [THÀNH CÔNG] Đã khôi phục tài khoản 'admin' và 'cuong.le' về trạng thái 'HoatDong'!" -ForegroundColor Green
    Write-Host " Bạn có thể đăng nhập lại ngay với tài khoản: admin / 123456" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host " [LỆNH SQL THỦ CÔNG] Bạn có thể chạy câu lệnh sau trong công cụ MySQL:" -ForegroundColor Yellow
    Write-Host " UPDATE TaiKhoan SET TrangThai = 'HoatDong' WHERE TenDangNhap IN ('admin', 'cuong.le');" -ForegroundColor White
}

