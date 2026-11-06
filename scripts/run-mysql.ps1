# Chay MySQL Local cho project
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   KHOI DONG MYSQL LOCAL CHO PROJECT" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

# 1. Kiem tra Docker
$dockerRunning = $false
try {
    $res = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if ($dockerRunning) {
    Write-Host "[Docker] Phat hien Docker Desktop dang chay!" -ForegroundColor Green
    Write-Host "Dang khoi dong container MySQL 8.0 qua docker-compose..." -ForegroundColor Gray
    docker compose up -d mysql
    Write-Host "[OK] MySQL container da chay san sang tren Docker!" -ForegroundColor Green
    Write-Host "- Host: localhost" -ForegroundColor Gray
    Write-Host "- Port: 3307 (hoac 3306 theo docker-compose.yml)" -ForegroundColor Gray
    Write-Host "- User: root / Pass: root" -ForegroundColor Gray
    Write-Host "- Database: QuanLyDatSan (Tu dong nap san QLSanCauLong.sql)" -ForegroundColor Gray
    return
}

# 2. Thu bat Service tren Windows
Write-Host "[Windows Service] Thu khoi dong dich vu MySQL tren Windows..." -ForegroundColor Gray
$services = @("MySQL", "MySQL80", "MySQL26")
$started = $false

foreach ($s in $services) {
    $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
    if ($svc) {
        if ($svc.Status -ne "Running") {
            try {
                Start-Service -Name $s -ErrorAction Stop
                Write-Host "[OK] Da khoi dong thanh cong service: $s" -ForegroundColor Green
            } catch {
                Write-Host "[!] Can chay PowerShell voi quyen Administrator de start service $s" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[OK] Service $s dang chay san sang!" -ForegroundColor Green
        }
        $started = $true
        break
    }
}

if (-not $started) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Yellow
    Write-Host "HUONG DAN KHOI DONG MYSQL LOCAL NHANH NHAT:" -ForegroundColor Yellow
    Write-Host "1. Cach 1 (Tien nhat): Mo ung dung Docker Desktop, sau do go:" -ForegroundColor White
    Write-Host "   docker compose up -d mysql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Cach 2: Mo Services (services.msc) tren Windows, tim dich vu MySQL va an Start." -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Yellow
}

