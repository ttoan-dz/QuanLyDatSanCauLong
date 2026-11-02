@echo off
title QuanLyDatSan - Backend API
chcp 65001 >nul

cd /d "%~dp0backend"
echo ========================================================
echo   Khoi dong Backend Spring Boot API (Port 8080)...
echo ========================================================
call .\mvnw.cmd spring-boot:run
pause
