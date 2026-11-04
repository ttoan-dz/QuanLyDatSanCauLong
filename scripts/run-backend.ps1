$projectRoot = Split-Path $PSScriptRoot -Parent
$backendDir = Join-Path $projectRoot "backend"
Set-Location $backendDir
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Khoi dong Backend Spring Boot API (Port 8080)..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
& .\mvnw.cmd spring-boot:run
