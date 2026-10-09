@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js не найден. Установите его с https://nodejs.org/
  echo После установки закройте и снова откройте этот файл.
  pause
  exit /b 1
)
node server.js
pause
