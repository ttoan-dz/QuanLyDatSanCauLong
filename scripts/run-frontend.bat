@echo off
title QuanLyDatSan - Frontend Web
chcp 65001 >nul

cd /d "%~dp0..\frontend"
echo ========================================================
echo   Dang khoi chay Frontend Web tai: http://localhost:3000
echo ========================================================

start http://localhost:3000

:: Kiem tra jwebserver tu JDK 21
if exist "C:\Program Files\Java\latest\jdk-21\bin\jwebserver.exe" (
    echo [INFO] Su dung jwebserver tu JDK 21 tren cong 3000...
    "C:\Program Files\Java\latest\jdk-21\bin\jwebserver.exe" -p 3000 -d "%~dp0..\frontend"
    goto :end
)
if exist "D:\jdk21\bin\jwebserver.exe" (
    echo [INFO] Su dung jwebserver tu JDK 21 tren cong 3000...
    "D:\jdk21\bin\jwebserver.exe" -p 3000 -d "%~dp0..\frontend"
    goto :end
)

:: Kiem tra lenh jwebserver trong PATH
where jwebserver >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Su dung jwebserver tren cong 3000...
    jwebserver -p 3000 -d "%~dp0..\frontend"
    goto :end
)

:: Kiem tra Python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Su dung Python http.server tren cong 3000...
    python -m http.server 3000
    goto :end
)

:: Kiem tra npx serve
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Su dung npx serve tren cong 3000...
    npx serve -l 3000 .
    goto :end
)

echo [CANH BAO] Khong tim thay jwebserver hoac python de tao local server.
echo Dang mo truc tiep file index.html bang trinh duyet...
start index.html

:end
pause
