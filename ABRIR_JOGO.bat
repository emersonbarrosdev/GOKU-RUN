@echo off
cd /d "%~dp0"
title Goku Run - PC
where node >nul 2>nul
if errorlevel 1 (
  echo Instale Node.js 22 ou superior.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run dev -- --open
pause
