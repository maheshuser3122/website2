# PDF Converter Suite - PowerShell Launcher
# Cross-platform script for managing PDF conversions
# Usage: .\RUN-PDF-CONVERTER.ps1

param(
    [ValidateSet('install', 'basic', 'batch', 'advanced', 'report', 'check', 'help')]
    [string]$Mode = 'menu'
)

# Color codes
$Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
    Default = 'White'
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  $(('{0,-56}' -f $Title))║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Menu {
    Write-Header "PDF CONVERTER SUITE - MAIN MENU"
    Write-Host "1 - Install Dependencies (Puppeteer + XLSX)"
    Write-Host "2 - Run Basic PDF Converter"
    Write-Host "3 - Run Batch PDF Converter (All Files)"
    Write-Host "4 - Run Advanced PDF Converter (With Data)"
    Write-Host "5 - View Conversion Reports"
    Write-Host "6 - Check Installed Packages"
    Write-Host "0 - Exit"
    Write-Host ""
}

function Install-Dependencies {
    Write-Header "Installing PDF Converter Dependencies"
    
    # Check if npm is available
    try {
        $npmVersion = npm --version
        Write-Host "✓ npm found: $npmVersion" -ForegroundColor $Colors.Success
    } catch {
        Write-Host "❌ npm is not installed" -ForegroundColor $Colors.Error
        return
    }

    Write-Host ""
    Write-Host "Installing Puppeteer (HTML to PDF)..." -ForegroundColor $Colors.Info
    npm install puppeteer
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Puppeteer installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "❌ Puppeteer installation failed" -ForegroundColor $Colors.Error
        return
    }

    Write-Host ""
    Write-Host "Installing XLSX (Excel support)..." -ForegroundColor $Colors.Info
    npm install xlsx
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ XLSX installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "❌ XLSX installation failed" -ForegroundColor $Colors.Error
        return
    }

    Write-Host ""
    Write-Host "✅ All dependencies installed successfully!" -ForegroundColor $Colors.Success
}

function Run-BasicConverter {
    Write-Header "Running Basic PDF Converter"
    
    Write-Host "Converting: production.html → report-output.pdf" -ForegroundColor $Colors.Info
    Write-Host ""
    
    & node create-pdf-report.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Conversion completed successfully!" -ForegroundColor $Colors.Success
        
        if (Test-Path "report-output.pdf") {
            $fileSize = (Get-Item "report-output.pdf").Length
            Write-Host "📁 PDF created: report-output.pdf ($fileSize bytes)" -ForegroundColor $Colors.Success
        }
    } else {
        Write-Host ""
        Write-Host "❌ Conversion failed!" -ForegroundColor $Colors.Error
    }
}

function Run-BatchConverter {
    Write-Header "Running Batch PDF Converter"
    
    Write-Host "Converting all HTML files to PDF:" -ForegroundColor $Colors.Info
    Write-Host "  • production.html"
    Write-Host "  • professional.html"
    Write-Host "  • index.html"
    Write-Host ""
    
    & node convert-all-to-pdf.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Batch conversion completed!" -ForegroundColor $Colors.Success
        
        if (Test-Path "pdf-batch-conversion-report.json") {
            Write-Host "📋 Report: pdf-batch-conversion-report.json" -ForegroundColor $Colors.Success
        }
    } else {
        Write-Host ""
        Write-Host "❌ Batch conversion failed!" -ForegroundColor $Colors.Error
    }
}

function Run-AdvancedConverter {
    Write-Header "Running Advanced PDF Converter"
    
    Write-Host "Converting with Excel data integration:" -ForegroundColor $Colors.Info
    Write-Host "  • Loads: sample-report-data.xlsx"
    Write-Host "  • Generates: production-advanced.pdf"
    Write-Host "  • Generates: professional-advanced.pdf"
    Write-Host ""
    
    & node create-advanced-pdf.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Advanced conversion completed!" -ForegroundColor $Colors.Success
        
        if (Test-Path "pdf-advanced-conversion-report.json") {
            Write-Host "📋 Report: pdf-advanced-conversion-report.json" -ForegroundColor $Colors.Success
        }
    } else {
        Write-Host ""
        Write-Host "❌ Advanced conversion failed!" -ForegroundColor $Colors.Error
    }
}

function Show-Reports {
    Write-Header "Conversion Reports"
    
    Write-Host "📊 Recent Reports:" -ForegroundColor $Colors.Info
    
    $reports = @(
        "pdf-conversion-report.json",
        "pdf-batch-conversion-report.json",
        "pdf-advanced-conversion-report.json"
    )
    
    foreach ($report in $reports) {
        if (Test-Path $report) {
            Write-Host "  ✓ $report" -ForegroundColor $Colors.Success
        } else {
            Write-Host "  ✗ $report (not found)" -ForegroundColor $Colors.Warning
        }
    }

    Write-Host ""
    Write-Host "📁 Generated PDFs:" -ForegroundColor $Colors.Info
    
    $pdfs = @(
        "report-output.pdf",
        "production-report.pdf",
        "professional-report.pdf",
        "production-advanced.pdf",
        "professional-advanced.pdf"
    )
    
    foreach ($pdf in $pdfs) {
        if (Test-Path $pdf) {
            $fileSize = (Get-Item $pdf).Length / 1KB
            Write-Host "  ✓ $pdf ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor $Colors.Success
        } else {
            Write-Host "  ✗ $pdf (not found)" -ForegroundColor $Colors.Warning
        }
    }
}

function Check-Packages {
    Write-Header "Installed Packages"
    
    $puppeteerPath = "node_modules\puppeteer"
    $xlsxPath = "node_modules\xlsx"
    
    if (Test-Path $puppeteerPath) {
        Write-Host "✅ Puppeteer: Installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "❌ Puppeteer: Not installed" -ForegroundColor $Colors.Error
    }
    
    if (Test-Path $xlsxPath) {
        Write-Host "✅ XLSX: Installed" -ForegroundColor $Colors.Success
    } else {
        Write-Host "❌ XLSX: Not installed" -ForegroundColor $Colors.Error
    }
    
    Write-Host ""
    Write-Host "Node.js version: $(node --version)" -ForegroundColor $Colors.Info
    Write-Host "npm version: $(npm --version)" -ForegroundColor $Colors.Info
}

function Show-Help {
    Write-Header "PDF Converter Suite - Help"
    
    Write-Host "Usage: .\RUN-PDF-CONVERTER.ps1 [-Mode <mode>]" -ForegroundColor $Colors.Info
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor $Colors.Info
    Write-Host "  install    - Install dependencies"
    Write-Host "  basic      - Run basic converter"
    Write-Host "  batch      - Run batch converter"
    Write-Host "  advanced   - Run advanced converter"
    Write-Host "  report     - View conversion reports"
    Write-Host "  check      - Check installed packages"
    Write-Host "  menu       - Show interactive menu (default)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.Info
    Write-Host "  .\RUN-PDF-CONVERTER.ps1 install"
    Write-Host "  .\RUN-PDF-CONVERTER.ps1 basic"
    Write-Host "  .\RUN-PDF-CONVERTER.ps1 batch"
}

# Verify we're in the correct directory
$currentPath = Get-Location
$requiredFiles = @("create-pdf-report.js", "convert-all-to-pdf.js", "create-advanced-pdf.js")
$allFilesExist = $True

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $allFilesExist = $False
        break
    }
}

if (-not $allFilesExist) {
    Write-Host "❌ Error: This script must be run from the StandaloneReportGenerator directory" -ForegroundColor $Colors.Error
    Write-Host "Current directory: $currentPath" -ForegroundColor $Colors.Error
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor $Colors.Success
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor $Colors.Error
    exit 1
}

# Process mode
switch ($Mode) {
    'install'  { Install-Dependencies }
    'basic'    { Run-BasicConverter }
    'batch'    { Run-BatchConverter }
    'advanced' { Run-AdvancedConverter }
    'report'   { Show-Reports }
    'check'    { Check-Packages }
    'help'     { Show-Help }
    'menu'     {
        while ($true) {
            Show-Menu
            $choice = Read-Host "Enter your choice (0-6)"
            
            switch ($choice) {
                '1' { Install-Dependencies }
                '2' { Run-BasicConverter }
                '3' { Run-BatchConverter }
                '4' { Run-AdvancedConverter }
                '5' { Show-Reports }
                '6' { Check-Packages }
                '0' { 
                    Write-Host "Goodbye!" -ForegroundColor $Colors.Info
                    exit 0
                }
                default { Write-Host "Invalid choice! Please try again." -ForegroundColor $Colors.Error }
            }
            
            Write-Host ""
            Read-Host "Press Enter to continue"
            Clear-Host
        }
    }
    default {
        Write-Host "Unknown mode: $Mode" -ForegroundColor $Colors.Error
        Show-Help
        exit 1
    }
}

Write-Host ""
