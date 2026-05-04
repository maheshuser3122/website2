# 🚀 Quick Start Guide - Standalone Report Generator

## Step 1: Open the Application

### Easy Method (No Server Needed)
1. Go to: `StandaloneReportGenerator` folder
2. Double-click **`index.html`**
3. Application opens in your browser ✅

### Advanced Method (Recommended for Large Files)
```powershell
# Open PowerShell in the StandaloneReportGenerator folder
# Then run one of these:

# Python (if installed)
python -m http.server 8000

# Or use a quick server command
$PSVersionTable.PSVersion  # Check if PowerShell 5+

# Then visit: http://localhost:8000
```

---

## Step 2: Upload Data

### Option A: Use Sample Data (Fastest)
1. Click **📋 Load Sample Data** button
2. Report generates instantly ⚡
3. See KPIs, charts, and tables

### Option B: Upload Your Excel File
1. Click **📂 Browse Files** or drag & drop
2. Select your `.xlsx` or `.xls` file
3. Report generates in seconds ⚡

### Option C: Create Sample Excel
```powershell
# In StandaloneReportGenerator folder
npm install xlsx  # Install once
node create-sample-excel.js
# Creates: sample-report-data.xlsx
```

---

## Step 3: Review Report

The report shows:
- 📊 **KPI Cards** - Key metrics at a glance
- 📈 **Charts** - Pie, Line, and Bar charts
- 📋 **Data Tables** - All detailed data
- ✅ **Status Indicators** - Performance status

---

## Step 4: Export Report

### Download as PowerPoint (.pptx)
```
Click: 📥 Download as PowerPoint (.pptx)
↓
File saves to Downloads folder
↓
Open in Microsoft PowerPoint, Google Slides, or LibreOffice
```

**What's Included:**
- Title slide
- KPI summary slide
- Data detail slides
- Professional formatting

### Download as HTML
```
Click: 💾 Download as HTML
↓
File saves as HTML
↓
Open in any browser or import to Word/Office
```

---

## 📋 Excel File Format Guide

Your Excel file should have columns with proper headers.

### Recommended Structure:

**Sheet 1: KPIs**
```
| KPI | Value | Target | Status |
|-----|-------|--------|--------|
| Metric Name | 123 | 150 | Good |
```

**Sheet 2: Performance**
```
| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| Uptime | 99.5 | 99.8 | 99.2 | 99.9 |
```

**Sheet 3: Vendors**
```
| Vendor | Market_Share | Status | Score |
|--------|--------------|--------|-------|
| Company | 35 | Active | 92 |
```

---

## 🎯 Common Tasks

### Change Report Title
Edit line in HTML:
```javascript
slide.addText('Your New Title', {
```

### Add New Data Sheet
Upload Excel with more sheets - they'll appear automatically!

### Customize Colors
Edit the gradient in the CSS section:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## ⚠️ Troubleshooting

### "XLSX is not defined"
- ✅ Wait 2 seconds after opening (CDN loading)
- ✅ Refresh page (F5)
- ✅ Try different browser

### Charts not showing
- ✅ Check Excel has required column names
- ✅ Make sure data is numeric where expected
- ✅ Refresh the page

### PowerPoint won't download
- ✅ Disable popup blocker
- ✅ Wait 5 seconds for generation
- ✅ Check Downloads folder

### "No data to export"
- ✅ Upload Excel file or load sample data first
- ✅ Ensure Excel sheet has proper headers

---

## 💡 Tips & Tricks

✨ **Load Sample → Download PPT** - See example PPT format  
✨ **Multi-Sheet Upload** - Upload Excel with 5+ sheets  
✨ **Real-Time Charts** - Charts update instantly with data  
✨ **Offline** - Works without internet after first load  
✨ **Print Preview** - Ctrl+P to see print preview before export  

---

## 🎓 What Works

✅ Upload Excel files (.xlsx, .xls)  
✅ Multi-sheet Excel workbooks  
✅ Pie charts from Market Share data  
✅ Line charts from trend data  
✅ Bar charts for comparisons  
✅ KPI cards and data tables  
✅ Download as .pptx (PowerPoint)  
✅ Download as .html (Web page)  
✅ Sample data for testing  
✅ All modern browsers (Chrome, Firefox, Safari, Edge)  

---

## 📞 Need Help?

1. **Check README.md** - Full documentation
2. **Try Sample Data** - Button: "📋 Load Sample Data"
3. **View Browser Console** - Press F12 for errors
4. **Verify Excel Format** - Use sample file as template

---

## ✨ Next Steps

1. ✅ Open `index.html`
2. ✅ Click "Load Sample Data"
3. ✅ Review the report
4. ✅ Download as PowerPoint
5. ✅ Customize with your data!

**Happy Reporting! 📊**
