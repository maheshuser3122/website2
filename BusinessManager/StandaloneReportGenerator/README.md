# Standalone Report Generator

A **single HTML file** report generator that works without any build tools or server setup.

## ✨ Features

✅ **Upload Excel Files** - Drag & drop or click to select  
✅ **Interactive Charts** - Pie, Line, and Bar charts with Chart.js  
✅ **Live Preview** - See your report instantly  
✅ **Download as PowerPoint** - Export to .pptx format  
✅ **Download as HTML** - Export formatted HTML report  
✅ **Sample Data** - Pre-loaded demo data for testing  
✅ **Multi-Sheet Support** - Works with multiple Excel sheets  
✅ **KPI Cards** - Display key metrics prominently  

## 🚀 How to Use

### Option 1: Open in Browser
1. Navigate to the `StandaloneReportGenerator` folder
2. Double-click `index.html` to open in your default browser
3. Or open any browser and type: `file:///E:/Mcharv%20Techlabs/Webwork/McharvTechlabs/StandaloneReportGenerator/index.html`

### Option 2: Use a Local Server (Recommended)
```powershell
# Using Python
python -m http.server 8000

# Using Node.js (if installed)
npx http-server

# Using PHP
php -S localhost:8000
```
Then open: `http://localhost:8000`

## 📊 Supported Data Structure

### Excel Format
Your Excel file should have sheets with data. Example:

**KPIs Sheet:**
| KPI | Value | Target | Status |
|-----|-------|--------|--------|
| Network Availability | 99.5 | 99.9 | On Track |
| Cost Per Incident | 2500 | 2000 | Review |

**Performance Sheet:**
| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| Uptime | 99.5 | 99.8 | 99.2 | 99.9 |
| Response Time | 245 | 198 | 212 | 165 |

**Vendors Sheet:**
| Vendor | Market_Share | Status | Score |
|--------|--------------|--------|-------|
| Cisco | 35 | Active | 92 |
| Juniper | 28 | Active | 85 |

## 📥 How to Export

### Export to PowerPoint
1. Load your data (upload or use sample)
2. Review the report preview
3. Click **📥 Download as PowerPoint (.pptx)**
4. Your `.pptx` file will download automatically

### Export to HTML
1. Load your data
2. Click **💾 Download as HTML**
3. Open the HTML file in any browser

## 🎯 Sample Data
- Click **📋 Load Sample Data** to see example report
- Perfect for testing all features

## 🔧 Technical Details

**CDN Libraries:**
- Chart.js - Interactive charts
- XLSX - Excel parsing
- pptxgen-js - PowerPoint generation

**No Installation Required:**
- Single HTML file
- Works offline (after first load)
- No server needed
- Works in any modern browser (Chrome, Edge, Firefox, Safari)

## 📝 Notes

- File size limit: Up to 10MB Excel files
- Supports: .xlsx, .xls formats
- Charts render in real-time
- Export quality maintains all data and styling

## 💡 Tips

1. **For Best Results:** Use clear column headers in Excel
2. **Sample Data:** Click the sample button to see expected format
3. **Multi-Sheet:** Upload Excel files with multiple sheets
4. **Export:** Both PPT and HTML exports include all data tables

## ✅ Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Explorer 11: ❌ Not supported

---

**Ready to use!** Just open `index.html` and start generating reports. 🎉
