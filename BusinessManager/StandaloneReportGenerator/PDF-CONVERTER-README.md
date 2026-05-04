# PDF Converter Suite - Quick Start Guide

**Version:** 1.0  
**Date:** April 2026  
**Status:** ✅ Production Ready

---

## 🎯 What is This?

A comprehensive suite of JavaScript tools to convert HTML reports to professional PDF files. Easily integrate PDF export functionality into your reporting system.

### Features

✅ **Basic HTML to PDF** - Single file conversion  
✅ **Batch Processing** - Convert multiple files at once  
✅ **Data Integration** - Embed Excel data into PDFs  
✅ **Professional Output** - Headers, footers, page numbers  
✅ **Detailed Reporting** - Track conversion metrics  
✅ **Cross-Platform** - Works on Windows, macOS, Linux  

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Check Prerequisites

```bash
# Must have Node.js installed
node --version
npm --version
```

Don't have Node.js? Download from: https://nodejs.org/ (LTS version)

### Step 2: Install Dependencies

**Option A: Automatic Installer (Windows)**
```batch
REM Double-click this file
RUN-PDF-CONVERTER.bat
REM Then select option "1 - Install Dependencies"
```

**Option B: PowerShell (Cross-Platform)**
```powershell
.\RUN-PDF-CONVERTER.ps1 -Mode install
```

**Option C: Manual Install**
```bash
npm install puppeteer
npm install xlsx  # Optional, for advanced converter
```

### Step 3: Run Converter

**Option A: Windows Batch**
```batch
RUN-PDF-CONVERTER.bat
REM Select option "2 - Run Basic PDF Converter"
```

**Option B: PowerShell**
```powershell
.\RUN-PDF-CONVERTER.ps1 -Mode basic
```

**Option C: Direct Node Command**
```bash
node create-pdf-report.js
```

### Step 4: Get Your PDF

Look for: **report-output.pdf** in the same directory

✅ Done! You now have a PDF export!

---

## 📚 Available Tools

### 1. Basic Converter
**File:** `create-pdf-report.js`
```bash
node create-pdf-report.js
```
**Output:** `report-output.pdf`  
**Use Case:** Quick one-time PDF export

### 2. Batch Converter
**File:** `convert-all-to-pdf.js`
```bash
node convert-all-to-pdf.js
```
**Output:** Multiple PDFs (production-report.pdf, professional-report.pdf, etc.)  
**Use Case:** Convert multiple reports at once

### 3. Advanced Converter
**File:** `create-advanced-pdf.js`
```bash
node create-advanced-pdf.js
```
**Output:** PDFs with embedded data  
**Use Case:** Reports with live data integration

---

## 🚀 Launcher Scripts

### Windows Users

**Batch Script** (Traditional CMD)
```batch
RUN-PDF-CONVERTER.bat
```
Features:
- Interactive menu
- Dependency checker
- Report viewer
- Error handling

### Cross-Platform Users

**PowerShell Script**
```powershell
# Interactive menu
.\RUN-PDF-CONVERTER.ps1

# Or specific mode
.\RUN-PDF-CONVERTER.ps1 -Mode install
.\RUN-PDF-CONVERTER.ps1 -Mode basic
.\RUN-PDF-CONVERTER.ps1 -Mode batch
.\RUN-PDF-CONVERTER.ps1 -Mode advanced
```

---

## 📖 Complete Documentation

For detailed information, see: **[PDF-CONVERTER-GUIDE.md](PDF-CONVERTER-GUIDE.md)**

Topics covered:
- Detailed usage guide for each converter
- Configuration options
- Troubleshooting
- Integration examples
- Performance optimization
- Security best practices

---

## 🎯 Common Use Cases

### Use Case 1: One-Time PDF Export
```bash
node create-pdf-report.js
```
→ Creates `report-output.pdf`

### Use Case 2: Automated Scheduled PDFs
```batch
REM Windows Task Scheduler
REM Schedule to run: node convert-all-to-pdf.js
```

### Use Case 3: Web Application Export
```javascript
// In your web app backend
const { exec } = require('child_process');
exec('node create-pdf-report.js', (error) => {
    if (error) console.error('Failed');
    else console.log('PDF created');
});
```

### Use Case 4: Email Reports
```bash
# Run converter and email the PDF
node create-advanced-pdf.js
# Send production-advanced.pdf via email
```

---

## 📊 File Structure

```
StandaloneReportGenerator/
├── create-pdf-report.js              ← Basic converter
├── convert-all-to-pdf.js             ← Batch converter
├── create-advanced-pdf.js            ← Advanced converter
├── RUN-PDF-CONVERTER.bat             ← Windows launcher
├── RUN-PDF-CONVERTER.ps1             ← PowerShell launcher
├── PDF-CONVERTER-GUIDE.md            ← Detailed guide
├── PDF-CONVERTER-README.md           ← This file
│
├── production.html                   ← Report template
├── professional.html                 ← Professional template
├── index.html                        ← Dashboard template
│
├── sample-report-data.xlsx           ← Sample data
│
└── [Generated PDFs will appear here]
    ├── report-output.pdf
    ├── production-report.pdf
    ├── professional-report.pdf
    └── pdf-*-report.json            ← Conversion reports
```

---

## ✅ Troubleshooting

### Problem: "Node.js not found"
```
❌ Install Node.js from: https://nodejs.org/
✅ Restart your terminal/command prompt
✅ Try again
```

### Problem: "Puppeteer installation fails"
```bash
# First approach - Install with npm directly
npm install puppeteer

# If still fails - Use system Chromium (Linux only)
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
npm install puppeteer
```

### Problem: "PDF is blank"
```javascript
// Increase wait time in converter script
await page.waitForTimeout(5000);  // Increase from 3000
```

### Problem: "Cannot find file"
```bash
# Make sure you're in the correct directory
cd "E:\Mcharv Techlabs\Webwork\McharvTechlabs\StandaloneReportGenerator"

# Then run converter
node create-pdf-report.js
```

---

## 📈 Performance

### Typical Conversion Times
- Basic conversion: 5-8 seconds
- Batch (3 files): 15-25 seconds
- Advanced (with data): 10-15 seconds

### File Sizes
- Basic PDF: 500 KB - 2 MB (depending on content)
- With charts: 1 MB - 3 MB
- With data tables: 2 MB - 5 MB

---

## 🔒 Security Notes

1. **Private Key Storage**
   - Never commit PDF converters to public repos
   - Store sensitive data separately

2. **File Permissions**
   - Ensure PDFs are created in secure location
   - Restrict PDF access if containing sensitive data

3. **Resource Limits**
   - PDF generation uses significant memory
   - Monitor for large batch operations

---

## 🆘 Getting Help

### Check Documentation
1. **Basic Questions:**  
   This file (PDF-CONVERTER-README.md)

2. **Detailed Usage:**  
   [PDF-CONVERTER-GUIDE.md](PDF-CONVERTER-GUIDE.md)

3. **External Resources:**
   - Puppeteer Docs: https://pptr.dev/
   - Node.js Docs: https://nodejs.org/docs/

### Common Commands Reference

```bash
# Install dependencies
npm install puppeteer xlsx

# Basic conversion
node create-pdf-report.js

# Batch conversion
node convert-all-to-pdf.js

# Advanced conversion
node create-advanced-pdf.js

# With increased memory (for large files)
node --max-old-space-size=4096 create-advanced-pdf.js

# With custom output directory
set PDF_OUTPUT_DIR=./outputs && node create-pdf-report.js
```

---

## 📝 Next Steps

1. ✅ **Install Dependencies**
   ```bash
   npm install puppeteer
   ```

2. ✅ **Run Basic Converter**
   ```bash
   node create-pdf-report.js
   ```

3. ✅ **Verify Output**
   Check for `report-output.pdf`

4. ✅ **Explore Other Converters**
   Try batch or advanced converters

5. ✅ **Read Full Guide**
   See [PDF-CONVERTER-GUIDE.md](PDF-CONVERTER-GUIDE.md) for advanced topics

---

## 📞 Support Channels

| Question | Resource |
|----------|----------|
| How do I...? | [PDF-CONVERTER-GUIDE.md](PDF-CONVERTER-GUIDE.md) |
| Getting error... | Troubleshooting section above |
| Integration help | See "Common Use Cases" section |
| Advanced config | Full guide section on "Advanced Configuration" |

---

## 🎓 Learning Paths

### Beginner
1. Read this README
2. Run `node create-pdf-report.js`
3. Check generated PDF

### Intermediate
1. Read full guide
2. Try batch converter
3. Customize HTML templates
4. Modify PDF options

### Advanced
1. Study `create-advanced-pdf.js` source
2. Integrate data from Excel
3. Create custom automation
4. Deploy to production

---

## 📋 Checklist

- [ ] Node.js installed (`node --version`)
- [ ] In correct directory (StandaloneReportGenerator)
- [ ] Dependencies installed (`npm install puppeteer`)
- [ ] Converter script exists (`create-pdf-report.js`)
- [ ] First conversion successful
- [ ] PDF file created and viewable
- [ ] Read full guide for advanced usage

---

## 🔄 Workflow Examples

### Daily Automated Reports
```batch
# Schedule in Windows Task Scheduler to run daily at 9 AM
RUN-PDF-CONVERTER.bat (option 3)
# PDFs generated automatically every morning
```

### On-Demand Web Export
```javascript
// User clicks "Export to PDF" button
// Backend runs: node create-pdf-report.js
// Returns PDF to user for download
```

### Scheduled Email Reports
```batch
# Every Monday at 8 AM:
node convert-all-to-pdf.js
# Then email all PDFs to stakeholders
```

---

## 📞 Support Contacts

- **Documentation:** [PDF-CONVERTER-GUIDE.md](PDF-CONVERTER-GUIDE.md)
- **Issues:** Check troubleshooting section
- **Node.js Help:** https://nodejs.org/
- **Puppeteer Help:** https://pptr.dev/

---

## 📊 Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | Apr 2026 | Initial release |

---

## ✨ Quick Reference Card

```
INSTALLATION:
  npm install puppeteer
  npm install xlsx

BASIC USAGE:
  node create-pdf-report.js       → report-output.pdf
  node convert-all-to-pdf.js      → multiple PDFs
  node create-advanced-pdf.js     → with data

LAUNCHERS:
  .\RUN-PDF-CONVERTER.bat         (Windows)
  .\RUN-PDF-CONVERTER.ps1         (Cross-platform)

DOCUMENTATION:
  PDF-CONVERTER-GUIDE.md          (Full guide)
  This file                        (Quick start)
```

---

**Ready to convert?** Run: `node create-pdf-report.js`

Happy PDF generating! 🚀

---

**Status:** ✅ Production Ready  
**Last Updated:** April 2026  
**Compatibility:** Node.js 14+, Windows/macOS/Linux
