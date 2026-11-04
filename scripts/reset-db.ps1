# ========================================================
# Script Reset CSDL Quản Lý Đặt Sân Cầu Lông về Dữ Liệu Gốc
# Đảm bảo mã hóa UTF-8 (utf8mb4) không bị lỗi font tiếng Việt
# ========================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   RESET CƠ SỞ DỮ LIỆU QUẢN LÝ ĐẶT SÂN VỀ DỮ LIỆU GỐC" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "CẢNH BÁO: Thao tác này sẽ xóa toàn bộ các đơn đặt sân," -ForegroundColor Red
Write-Host "hóa đơn, lịch sử thanh toán thử nghiệm và đưa hệ thống" -ForegroundColor Red
Write-Host "về trạng thái dữ liệu mẫu ban đầu (chuẩn tiếng Việt)." -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Bạn có chắc chắn muốn reset không? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Đã hủy thao tác reset." -ForegroundColor Yellow
    return
}

$projectRoot = Split-Path $PSScriptRoot -Parent
$sqlFile = Join-Path $projectRoot "database\reset_database.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "[LỖI] Không tìm thấy file: $sqlFile" -ForegroundColor Red
    return
}

# 1. Thử qua Docker container quanlydatsan-mysql
$dockerUp = $false
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    if ($containers -match "quanlydatsan-mysql") {
        $dockerUp = $true
    }
} catch {
    $dockerUp = $false
}

if ($dockerUp) {
    Write-Host "[Docker] Đang sao chép file UTF-8 vào container quanlydatsan-mysql..." -ForegroundColor Cyan
    docker cp "$sqlFile" quanlydatsan-mysql:/tmp/reset_database.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[Docker] Đang nạp cơ sở dữ liệu với bảng mã utf8mb4..." -ForegroundColor Cyan
        docker exec quanlydatsan-mysql mysql -uroot -proot --default-character-set=utf8mb4 -e "source /tmp/reset_database.sql"
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================================" -ForegroundColor Green
            Write-Host " [THÀNH CÔNG] Reset CSDL thành công về dữ liệu gốc chuẩn UTF-8!" -ForegroundColor Green
            Write-Host "========================================================" -ForegroundColor Green
            Write-Host "Kiểm tra dữ liệu mẫu vừa nạp:" -ForegroundColor Gray
            docker exec quanlydatsan-mysql mysql -uroot -proot --default-character-set=utf8mb4 -e "USE QuanLyDatSan; SELECT MaDiaDiem, TenDiaDiem FROM DiaDiem;"
            return
        }
    }
}

# 2. Thử qua MySQL Client nếu có trên máy
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCmd) {
    Write-Host "[MySQL Client] Nạp qua mysql client trên cổng 3307/3306..." -ForegroundColor Cyan
    $forwardSlashPath = $sqlFile -replace '\\', '/'
    & mysql -h 127.0.0.1 -P 3307 -u root -proot --default-character-set=utf8mb4 -e "source $forwardSlashPath" 2>$null
    if ($LASTEXITCODE -ne 0) {
        & mysql -h 127.0.0.1 -P 3306 -u root -proot --default-character-set=utf8mb4 -e "source $forwardSlashPath"
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================================" -ForegroundColor Green
        Write-Host " [THÀNH CÔNG] Reset CSDL thành công về dữ liệu gốc chuẩn UTF-8!" -ForegroundColor Green
        Write-Host "========================================================" -ForegroundColor Green
        return
    }
}

Write-Host "[LỖI] Không tìm thấy Docker container quanlydatsan-mysql đang chạy hoặc lệnh mysql." -ForegroundColor Red
Write-Host "Vui lòng bật Docker Desktop và kiểm tra container quanlydatsan-mysql." -ForegroundColor Yellow

