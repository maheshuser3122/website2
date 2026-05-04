# PDF Converter Suite - Complete Guide

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Production Ready

---

## 📋 Overview

The PDF Converter Suite provides three JavaScript-based tools to convert HTML reports to PDF format. These scripts work alongside existing report generators to create publication-ready PDF files.

### Available Converters

| Script | Purpose | Features |
|--------|---------|----------|
| `create-pdf-report.js` | Single file converter | Basic HTML to PDF conversion |
| `convert-all-to-pdf.js` | Batch multi-file converter | Convert multiple HTML files in one command |
| `create-advanced-pdf.js` | Advanced converter with data | Integrates Excel data into PDF reports |

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
# Install Puppeteer (required for all converters)
npm install puppeteer

# For advanced converter, also install XLSX
npm install puppeteer xlsx
```

### Step 2: Run Converter

#### Basic Single File Conversion
```bash
node create-pdf-report.js
```

#### Batch Conversion (All Files)
```bash
node convert-all-to-pdf.js
```

#### Advanced Conversion with Data
```bash
node create-advanced-pdf.js
```

### Step 3: Retrieve PDF

PDFs are created in the same directory with these names:
- `report-output.pdf` - from basic converter
- `production-report.pdf` - from batch converter
- `professional-report.pdf` - from batch converter
- `production-advanced.pdf` - from advanced converter

---

## 🔧 Detailed Usage Guide

### 1. Basic Single File Converter

**File:** `create-pdf-report.js`

**What it does:**
- Converts `production.html` to `report-output.pdf`
- Adds headers and footers with page numbers
- Optimizes for A4 paper size
- Creates a conversion report JSON file

**Command:**
```bash
node create-pdf-report.js
```

**Output:**
- `report-output.pdf` - The generated PDF file
- `pdf-conversion-report.json` - Conversion metadata

**Example JSON Report:**
```json
{
  "created": "2026-04-10T10:30:45.123Z",
  "source": "e:\\...\\production.html",
  "output": "e:\\...\\report-output.pdf",
  "fileSize": 2048576,
  "format": "A4",
  "printBackground": true,
  "status": "success"
}
```

---

### 2. Batch Multi-File Converter

**File:** `convert-all-to-pdf.js`

**What it does:**
- Converts multiple HTML files in one command
- Processes: `production.html`, `professional.html`, `index.html`
- Creates individual PDF files for each
- Generates comprehensive batch report
- Handles failed conversions gracefully

**Command:**
```bash
node convert-all-to-pdf.js
```

**Configuration:**
Edit the `HTML_FILES_TO_CONVERT` array to customize:

```javascript
const HTML_FILES_TO_CONVERT = [
    {
        name: 'production.html',
        pdfName: 'production-report.pdf',
        waitTime: 3000,      // milliseconds to wait for rendering
        scale: 1.0           // scale factor (0.5 to 2.0)
    },
    // Add more files...
];
```

**Output:**
- `production-report.pdf`
- `professional-report.pdf`
- `index-report.pdf`
- `pdf-batch-conversion-report.json` - Summary of all conversions

**Example Batch Report:**
```json
{
  "successful": [
    {
      "source": "production.html",
      "output": "production-report.pdf",
      "size": 2048576,
      "sizeKB": "2001.13",
      "timestamp": "2026-04-10T10:35:22.456Z"
    }
  ],
  "failed": [],
  "startTime": "2026-04-10T10:35:00.123Z",
  "endTime": "2026-04-10T10:36:15.789Z"
}
```

---

### 3. Advanced Converter with Data Integration

**File:** `create-advanced-pdf.js`

**What it does:**
- Converts HTML with embedded Excel data
- Loads data from `sample-report-data.xlsx`
- Injects data into PDF for reference
- Advanced error handling and logging
- Tracks conversion metrics

**Command:**
```bash
node create-advanced-pdf.js
```

**How Data Integration Works:**

1. **Loads Excel Data:**
   ```javascript
   // Reads sheets from sample-report-data.xlsx
   - KPIs
   - Performance
   - Vendors
   - Regions
   ```

2. **Injects into HTML:**
   - Creates hidden JSON script tag
   - Data accessible via JavaScript in report
   - Can be used for dynamic charts or tables

3. **Generates PDF:**
   - Includes all rendered content
   - Data persists in PDF

**Output:**
- `production-advanced.pdf` - With data integration
- `professional-advanced.pdf`
- `pdf-advanced-conversion-report.json` - Detailed metrics

**Example Advanced Report:**
```json
{
  "timestamp": "2026-04-10T10:40:15.456Z",
  "source": "production.html",
  "output": "production-advanced.pdf",
  "fileSize": 3145728,
  "fileSizeKB": "3073.56",
  "fileSizeMB": "3.0011",
  "durationMs": 8234,
  "dataSourcesUsed": ["sample-report-data.xlsx"],
  "sheets": ["KPIs", "Performance", "Vendors", "Regions"],
  "status": "success"
}
```

---

## 🎯 Use Cases

### Use Case 1: Weekly Report Generation
```bash
# Scheduled task to run every Monday at 9 AM
node convert-all-to-pdf.js
# Then email the generated PDFs
```

### Use Case 2: One-Time PDF Export
```bash
# User requests export from web interface
node create-pdf-report.js
# Return PDF download link
```

### Use Case 3: Data-Integrated Reports
```bash
# Create reports with live data from Excel
node create-advanced-pdf.js
# Embeds latest metrics in PDF
```

### Use Case 4: Automation Pipeline
```csharp
// In C# or Node.js backend
const { exec } = require('child_process');

exec('node create-pdf-report.js', (error, stdout, stderr) => {
    if (error) console.error('PDF creation failed:', error);
    else console.log('PDF created successfully');
});
```

---

## ⚙️ Advanced Configuration

### PDF Options Customization

Edit the `pdf()` method options in any script:

```javascript
await page.pdf({
    path: pdfPath,
    format: 'A4',              // Paper size: A4, Letter, etc.
    printBackground: true,     // Include background colors
    margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
    },
    scale: 1,                  // 0.5 to 2.0
    displayHeaderFooter: true, // Show page headers/footers
    headerTemplate: '...',     // Custom header HTML
    footerTemplate: '...',     // Custom footer HTML
    landscape: false,          // true for landscape
    pageRanges: '1-3'          // Specific page ranges
});
```

### Customizing Headers and Footers

```javascript
headerTemplate: `
    <div style="font-size: 12px; width: 100%; text-align: center; padding: 10px;">
        My Company Report - <span class="date"></span>
    </div>
`,
footerTemplate: `
    <div style="font-size: 12px; width: 100%; text-align: center; padding: 10px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
`
```

### Environment Variables

Create `.env` file to customize behavior:

```bash
# .env file
PDF_OUTPUT_DIR=./output
PDF_WAIT_TIME=5000
PDF_SCALE=1.0
PUPPETEER_HEADLESS=true
```

---

## 🐛 Troubleshooting

### Issue 1: Puppeteer Installation Fails

**Error:** `Error: Failed to download Chromium`

**Solution:**
```bash
# Download Chromium separately
npm install puppeteer --save-dev

# Or use system Chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### Issue 2: PDF is Blank

**Error:** Generated PDF has no content

**Solutions:**
- Increase wait time: `await page.waitForTimeout(5000)`
- Check if HTML file exists and has content
- Verify JavaScript is enabled in Puppeteer
- Check for CORS issues if loading external resources

### Issue 3: Charts Not Rendering

**Error:** Charts appear as empty spaces in PDF

**Solutions:**
```javascript
// Wait longer for Chart.js to render
await page.waitForTimeout(5000);

// Or wait for specific element
await page.waitForSelector('#chart-container');
```

### Issue 4: Memory Issues with Large Files

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Increase Node.js memory
node --max-old-space-size=4096 create-pdf-report.js
```

### Issue 5: Path Issues on Windows

**Error:** `ENOENT: no such file or directory`

**Solution:**
```javascript
// Use path.join instead of string concatenation
const filePath = path.join(__dirname, 'report.pdf');

// Not this:
// const filePath = __dirname + '\\report.pdf';
```

---

## 📊 Performance Optimization

### Optimize Conversion Speed

```javascript
// 1. Reduce wait time if content loads faster
await page.waitForTimeout(2000);  // Instead of 5000

// 2. Disable background rendering
printBackground: false,  // If not needed

// 3. Use lower scale
scale: 0.8,  // Instead of 1.0

// 4. Reduce margins
margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' }
```

### Monitor Conversion Time

```javascript
const startTime = Date.now();
// ... conversion code ...
const duration = Date.now() - startTime;
console.log(`Conversion took ${duration}ms`);
```

---

## 🔒 Security Considerations

### Best Practices

1. **Run in Isolated Environment**
   - Use Docker or VM for production
   - Restrict file system access

2. **Validate Input**
   - Only convert trusted HTML files
   - Sanitize file paths

3. **Resource Limits**
   - Set timeout limits
   - Monitor memory usage
   ```javascript
   await page.goto(fileUrl, {
       waitUntil: 'networkidle2',
       timeout: 30000  // 30 second timeout
   });
   ```

4. **Disable JavaScript Execution** (if not needed)
   ```javascript
   await page.goto(fileUrl, {
       // Content loads but scripts don't execute
       waitUntil: 'domcontentloaded'
   });
   ```

---

## 📈 Batch Processing Example

Create a batch processor for large-scale conversions:

```javascript
// batch-converter.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function processBatch() {
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
    
    for (const file of files) {
        console.log(`Converting ${file}...`);
        
        return new Promise((resolve, reject) => {
            const child = spawn('node', ['create-pdf-report.js']);
            
            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ ${file} converted`);
                    resolve();
                } else {
                    console.error(`❌ ${file} failed`);
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }
}

processBatch().catch(console.error);
```

---

## 📝 Integration with Web Application

### Express.js Integration

```javascript
app.get('/api/export-pdf', async (req, res) => {
    try {
        const pdfPath = await convertToPdf();
        res.download(pdfPath);
    } catch (error) {
        res.status(500).json({ error: 'PDF generation failed' });
    }
});
```

### Windows Task Scheduler

Create scheduled PDF generation:

```batch
REM scheduled-pdf-generation.bat
@echo off
cd /d "E:\Mcharv Techlabs\Webwork\McharvTechlabs\StandaloneReportGenerator"
node convert-all-to-pdf.js
echo PDF generation completed
pause
```

---

## 🔄 Automation Workflow

```
┌─ Schedule (Daily at 9 AM)
│
├─ Run convert-all-to-pdf.js
│
├─ Check pdf-batch-conversion-report.json
│
├─ If successful:
│  └─ Upload PDFs to cloud storage
│     └─ Email notification with links
│
└─ If failed:
   └─ Send alert to admin
```

---

## 📚 Related Files

- `create-sample-excel.js` - Generate sample data
- `production.html` - Main report template
- `professional.html` - Professional report template
- `index.html` - Dashboard template

---

## 🆘 Support

### Common Questions

**Q: How do I customize the PDF layout?**  
A: Edit the CSS in the HTML file before calling convert script.

**Q: Can I convert PDF back to HTML?**  
A: Not directly. Use separate PDF-to-HTML library if needed.

**Q: How large can HTML files be?**  
A: Depends on available memory, typically 100+ MB supported.

**Q: Can I convert to other formats (Word, Excel)?**  
A: These scripts only support PDF. Use separate libraries for other formats.

---

## 📞 Getting Help

1. **Check Troubleshooting section** above
2. **Review examples** in script comments
3. **Check Puppeteer documentation**: https://pptr.dev/
4. **Test with simple HTML** first

---

## 📋 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Apr 2026 | Initial release - 3 converters |

---

**Status:** ✅ Production Ready  
**Last Tested:** April 2026  
**Compatibility:** Node.js 14+, Windows/Linux/macOS
