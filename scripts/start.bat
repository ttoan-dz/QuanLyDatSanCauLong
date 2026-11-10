@echo off
title QuanLyDatSan - Khoi Chay Toan Bo He Thong
chcp 65001 >nul

echo ========================================================
echo   HE THONG QUAN LY DAT SAN CAU LONG
echo ========================================================
echo.
echo [1/2] Dang mo Backend Spring Boot API (Port 8080)...
start "QuanLyDatSan - Backend" cmd /k "%~dp0run-backend.bat"

echo [2/2] Dang mo Frontend Web UI (Port 3000)...
start "QuanLyDatSan - Frontend" cmd /k "%~dp0run-frontend.bat"

echo.
echo ========================================================
echo  He thong da duoc kich hoat!
echo  - Backend API: http://localhost:8080/api/public/courts
echo  - Frontend:    http://localhost:3000
echo ========================================================
timeout /t 5
