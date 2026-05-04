@echo off
REM This script starts a simple HTTP server in the current directory
REM Perfect for testing the Report Generator locally

echo.
echo ========================================
echo   Standalone Report Generator Server
echo ========================================
echo.

REM Try Python first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting server with Python...
    echo.
    echo Opening: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000
    python -m http.server 8000
    goto end
)

REM Try Node.js next
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting server with Node.js...
    echo.
    echo Opening: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000
    npx http-server -p 8000
    goto end
)

REM Fallback message
echo.
echo ERROR: No server found!
echo.
echo Please install one of:
echo   1. Python (https://www.python.org)
echo   2. Node.js (https://nodejs.org)
echo.
echo Or open index.html directly in your browser
echo.
pause

:end
