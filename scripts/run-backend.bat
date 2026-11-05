@echo off
title QuanLyDatSan - Backend API
chcp 65001 >nul

cd /d "%~dp0..\backend"

set "PROFILE=%~1"
if not "%PROFILE%"=="" goto RUN

echo ========================================================
echo   HE THONG QUAN LY DAT SAN CAU LONG - BACKEND API
echo ========================================================
echo   Chon moi truong Database:
echo   [1] Local MySQL (localhost:3307 / 3306 - Docker / Windows)
echo   [2] Cloud Aiven (mysql-...aivencloud.com:23691 - Online)
echo ========================================================
set /p CHOICE="Nhap lua chon [1 hoac 2, Enter mac dinh la 1]: "

if "%CHOICE%"=="2" (
    set "PROFILE=cloud"
) else (
    set "PROFILE=local"
)

:RUN
echo.
echo ========================================================
echo   Khoi dong Backend Spring Boot (Port 8080)
echo   Profile kich hoat: %PROFILE%
echo ========================================================
call .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=%PROFILE%
pause
