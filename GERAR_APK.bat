@echo off
cd /d "%~dp0"
title Goku Run - Gerar APK de teste
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run android:apk
pause
