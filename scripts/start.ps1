$backendScript = Join-Path $PSScriptRoot "run-backend.ps1"
$frontendScript = Join-Path $PSScriptRoot "run-frontend.ps1"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   HE THONG QUAN LY DAT SAN CAU LONG" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[1/2] Dang mo Backend Spring Boot API..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$backendScript`""

Write-Host "[2/2] Dang mo Frontend Web UI..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$frontendScript`""

Write-Host "He thong da duoc kich hoat thanh cong!" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:8080/api/public/courts" -ForegroundColor Gray
Write-Host "- Frontend:    http://localhost:3000" -ForegroundColor Gray
Start-Sleep -Seconds 3
