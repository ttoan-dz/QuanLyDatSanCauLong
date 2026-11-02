$backendDir = Join-Path $PSScriptRoot "backend"
Set-Location $backendDir
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Khoi dong Backend Spring Boot API (Port 8080)..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
& .\mvnw.ps1 spring-boot:run
