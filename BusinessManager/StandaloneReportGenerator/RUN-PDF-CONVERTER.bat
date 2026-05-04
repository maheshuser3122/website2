@echo off
REM PDF Converter Suite - Setup and Run Script
REM This script installs dependencies and runs PDF converters
REM Supports: Windows CMD/PowerShell

setlocal enabledelayedexpansion
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║       PDF CONVERTER SUITE - SETUP AND LAUNCHER             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then restart this script.
    pause
    exit /b 1
)

echo ✓ Node.js found: 
node --version

REM Check current directory
cd /d "%~dp0"
echo ✓ Working directory: %cd%
echo.

REM Menu
:MENU
cls
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                    MAIN MENU                              ║
echo ╠═══════════════════════════════════════════════════════════╣
echo ║  1 - Install Dependencies (Puppeteer + XLSX)              ║
echo ║  2 - Run Basic PDF Converter                              ║
echo ║  3 - Run Batch PDF Converter (All Files)                  ║
echo ║  4 - Run Advanced PDF Converter (With Data)               ║
echo ║  5 - View Conversion Reports                              ║
echo ║  6 - Check Installed Packages                             ║
echo ║  0 - Exit                                                 ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set /p CHOICE="Enter your choice (0-6): "

if "%CHOICE%"=="1" goto INSTALL_DEPS
if "%CHOICE%"=="2" goto RUN_BASIC
if "%CHOICE%"=="3" goto RUN_BATCH
if "%CHOICE%"=="4" goto RUN_ADVANCED
if "%CHOICE%"=="5" goto VIEW_REPORTS
if "%CHOICE%"=="6" goto CHECK_PACKAGES
if "%CHOICE%"=="0" goto END
goto INVALID_CHOICE

REM ==========================================
REM Option 1: Install Dependencies
REM ==========================================
:INSTALL_DEPS
cls
echo.
echo 📦 Installing PDF Converter Dependencies...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm is not installed
    pause
    goto MENU
)

echo Installing Puppeteer (HTML to PDF - ~200MB)...
call npm install puppeteer
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Puppeteer installation failed
    pause
    goto MENU
)
echo ✅ Puppeteer installed

echo.
echo Installing XLSX (Excel support)...
call npm install xlsx
if %ERRORLEVEL% NEQ 0 (
    echo ❌ XLSX installation failed
    pause
    goto MENU
)
echo ✅ XLSX installed

echo.
echo ✅ All dependencies installed successfully!
echo.
pause
goto MENU

REM ==========================================
REM Option 2: Run Basic PDF Converter
REM ==========================================
:RUN_BASIC
cls
echo.
echo 📄 Running Basic PDF Converter
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Converting: production.html ^→ report-output.pdf
echo.

node create-pdf-report.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Conversion completed successfully!
    if exist "report-output.pdf" (
        echo 📁 PDF created: report-output.pdf
        echo 📊 Size: 
        for %%F in (report-output.pdf) do echo    %%~zF bytes
    )
) else (
    echo.
    echo ❌ Conversion failed!
)
echo.
pause
goto MENU

REM ==========================================
REM Option 3: Run Batch PDF Converter
REM ==========================================
:RUN_BATCH
cls
echo.
echo 📚 Running Batch PDF Converter
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Converting all HTML files to PDF...
echo   • production.html
echo   • professional.html
echo   • index.html
echo.

node convert-all-to-pdf.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Batch conversion completed!
    if exist "pdf-batch-conversion-report.json" (
        echo 📋 Report: pdf-batch-conversion-report.json
    )
) else (
    echo.
    echo ❌ Batch conversion failed!
)
echo.
pause
goto MENU

REM ==========================================
REM Option 4: Run Advanced PDF Converter
REM ==========================================
:RUN_ADVANCED
cls
echo.
echo 🚀 Running Advanced PDF Converter
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Converting with Excel data integration...
echo   • Loads: sample-report-data.xlsx
echo   • Generates: production-advanced.pdf
echo   • Generates: professional-advanced.pdf
echo.

node create-advanced-pdf.js
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Advanced conversion completed!
    if exist "pdf-advanced-conversion-report.json" (
        echo 📋 Report: pdf-advanced-conversion-report.json
    )
) else (
    echo.
    echo ❌ Advanced conversion failed!
)
echo.
pause
goto MENU

REM ==========================================
REM Option 5: View Conversion Reports
REM ==========================================
:VIEW_REPORTS
cls
echo.
echo 📋 Conversion Reports
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

setlocal enabledelayedexpansion

if exist "pdf-conversion-report.json" (
    echo ✓ Basic Converter Report:
    echo   📄 pdf-conversion-report.json
) else (
    echo ✗ Basic Converter Report: Not found
)

if exist "pdf-batch-conversion-report.json" (
    echo ✓ Batch Converter Report:
    echo   📄 pdf-batch-conversion-report.json
) else (
    echo ✗ Batch Converter Report: Not found
)

if exist "pdf-advanced-conversion-report.json" (
    echo ✓ Advanced Converter Report:
    echo   📄 pdf-advanced-conversion-report.json
) else (
    echo ✗ Advanced Converter Report: Not found
)

echo.
echo 📊 Generated PDFs:
if exist "report-output.pdf" (
    for %%F in (report-output.pdf) do echo   ✓ %%F (%%~zF bytes^)
) else (
    echo   ✗ report-output.pdf: Not found
)

if exist "production-report.pdf" (
    for %%F in (production-report.pdf) do echo   ✓ %%F (%%~zF bytes^)
) else (
    echo   ✗ production-report.pdf: Not found
)

if exist "professional-report.pdf" (
    for %%F in (professional-report.pdf) do echo   ✓ %%F (%%~zF bytes^)
) else (
    echo   ✗ professional-report.pdf: Not found
)

if exist "production-advanced.pdf" (
    for %%F in (production-advanced.pdf) do echo   ✓ %%F (%%~zF bytes^)
) else (
    echo   ✗ production-advanced.pdf: Not found
)

echo.
pause
goto MENU

REM ==========================================
REM Option 6: Check Installed Packages
REM ==========================================
:CHECK_PACKAGES
cls
echo.
echo 📦 Installed Packages
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if exist "node_modules\puppeteer" (
    echo ✅ Puppeteer: Installed
) else (
    echo ❌ Puppeteer: Not installed
)

if exist "node_modules\xlsx" (
    echo ✅ XLSX: Installed
) else (
    echo ❌ XLSX: Not installed
)

echo.
echo Node.js version:
node --version

echo.
echo npm version:
npm --version

echo.
echo.
pause
goto MENU

REM ==========================================
REM Invalid Choice
REM ==========================================
:INVALID_CHOICE
echo.
echo ❌ Invalid choice! Please try again.
echo.
pause
goto MENU

REM ==========================================
REM Exit
REM ==========================================
:END
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         PDF CONVERTER SUITE - GOODBYE                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo For more information, see: PDF-CONVERTER-GUIDE.md
echo.
exit /b 0
