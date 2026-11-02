$frontendDir = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendDir
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Khoi chay Frontend Web tai http://localhost:3000..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Start-Process "http://localhost:3000"
python -m http.server 3000
