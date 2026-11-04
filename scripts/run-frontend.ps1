$projectRoot = Split-Path $PSScriptRoot -Parent
$frontendDir = Join-Path $projectRoot "frontend"
Set-Location $frontendDir
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   Khoi chay Frontend Web tai http://localhost:3000..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Start-Process "http://localhost:3000"
try {
    python -m http.server 3000
} catch {
    npx --yes serve -p 3000 .
}
