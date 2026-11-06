param(
    [ValidateSet("local", "cloud", "prod")]
    [string]$Profile
)

$projectRoot = Split-Path $PSScriptRoot -Parent
$backendDir = Join-Path $projectRoot "backend"
Set-Location $backendDir

if (-not $Profile) {
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "   HE THONG QUAN LY DAT SAN CAU LONG - BACKEND API" -ForegroundColor Yellow
    Write-Host "========================================================" -ForegroundColor Cyan
    Write-Host "   Chon moi truong Database:" -ForegroundColor White
    Write-Host "   [1] Local MySQL (localhost:3307 / 3306 - Docker / Windows)" -ForegroundColor Gray
    Write-Host "   [2] Cloud Aiven (mysql-...aivencloud.com:23691 - Online)" -ForegroundColor Gray
    Write-Host "========================================================" -ForegroundColor Cyan
    $choice = Read-Host "Nhap lua chon [1 hoac 2, Enter mac dinh la 1]"
    if ($choice -eq "2") {
        $Profile = "cloud"
    } else {
        $Profile = "local"
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Khoi dong Backend Spring Boot (Port 8080)..." -ForegroundColor Green
Write-Host "   Profile kich hoat: $Profile" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
& .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=$Profile
