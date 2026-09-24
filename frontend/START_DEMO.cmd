@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.12 or newer, then run this file again.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4173 in your browser after the server starts.
node tools/serve.mjs
pause
