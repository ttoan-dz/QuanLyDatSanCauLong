@echo off
title QuanLyDatSan - Frontend Web
chcp 65001 >nul

cd /d "%~dp0frontend"
echo ========================================================
echo   Dang khoi chay Frontend Web tai: http://localhost:3000
echo ========================================================
start http://localhost:3000
python -m http.server 3000
pause
