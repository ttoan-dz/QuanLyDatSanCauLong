@echo off
title QuanLyDatSan - Backend API
chcp 65001 >nul

cd /d "%~dp0..\backend"
echo ========================================================
echo   Khoi dong Backend Spring Boot API (Port 8080)...
echo   Ket noi Database: localhost:3307 (Docker MySQL)
echo ========================================================
call .\mvnw.cmd spring-boot:run
pause
