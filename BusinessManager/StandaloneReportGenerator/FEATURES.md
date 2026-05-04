# Standalone Report Generator - Features & Usage

## 📁 Folder Structure

```
StandaloneReportGenerator/
├── index.html                 # Main application (single HTML file)
├── README.md                  # Full documentation
├── QUICKSTART.md              # Quick start guide
├── START_SERVER.bat           # Easy server launcher (Windows)
└── create-sample-excel.js     # Sample data generator (Node.js)
```

## 🎯 Main Features

### 1. Upload Excel Files
- ✅ Drag & drop support
- ✅ Click to browse
- ✅ Supports .xlsx and .xls formats
- ✅ Multi-sheet workbooks

### 2. Live Report Preview
- ✅ Real-time chart rendering
- ✅ Interactive data tables
- ✅ KPI cards with metrics
- ✅ Color-coded status indicators

### 3. Chart Types Supported
- ✅ **Pie/Doughnut Charts** - Market share, distribution
- ✅ **Line Charts** - Trends over time/quarters
- ✅ **Bar Charts** - Comparisons, KPI vs Target

### 4. Export Options
- ✅ **PowerPoint (.pptx)** - Professional presentations
- ✅ **HTML (.html)** - Web-compatible reports
- ✅ One-click download

### 5. Sample Data
- ✅ Pre-built demo data
- ✅ 5 pre-defined data sheets
- ✅ Perfect for testing

## 🚀 Getting Started

### Method 1: Direct (No Setup)
```
1. Double-click: index.html
2. Click: Load Sample Data
3. Click: Download as PowerPoint
```

### Method 2: With Server (Recommended)
```
1. Double-click: START_SERVER.bat
2. Browser opens automatically
3. Click: Load Sample Data
4. Download report
```

### Method 3: Manual Server
```powershell
# Python
python -m http.server 8000
# Visit: http://localhost:8000

# Node.js
npx http-server -p 8000
# Visit: http://localhost:8000
```

## 📊 Sample Data Included

### KPIs Sheet
```
Network Availability: 99.5%
Cost Per Incident: $2,500
Mean Time To Recover: 15 min
Incidents Per Month: 8
Customer Satisfaction: 92%
```

### Performance Sheet
```
Uptime trends: Q1-Q4 data
Response time: 245ms to 165ms
Error rates: 0.5% to 0.2%
Throughput: 850GB/s to 1020GB/s
Active users: 5,200 to 8,500
```

### Vendors Sheet
```
Cisco: 35% market share, Score 92
Juniper: 28% market share, Score 85
Arista: 22% market share, Score 88
Nokia: 10% market share, Score 75
Others: 5% market share, Score 60
```

### Regions Sheet
```
North America: $2.5M revenue
Europe: $1.8M revenue
Asia Pacific: $1.2M revenue
Middle East: $450K revenue
Africa: $350K revenue
```

## 💻 Excel File Format

Your uploaded Excel should have:
- ✅ Clear column headers
- ✅ Multiple sheets (optional)
- ✅ Numeric data for charts
- ✅ Text for descriptions

### Example Structure

**Sheet: KPIs**
| KPI | Value | Target | Status |
|-----|-------|--------|--------|
| Metric Name | 100 | 120 | On Track |

**Sheet: Performance**
| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|----|----|----|----|
| Uptime | 99.5 | 99.8 | 99.2 | 99.9 |

**Sheet: Vendors**
| Vendor | Market_Share | Status | Score |
|--------|--------------|--------|-------|
| Company | 35 | Active | 92 |

## 🎨 Report Output

### PowerPoint Export Includes
- Title page
- KPI summary
- Charts and visualizations
- Data detail pages
- Professional formatting
- Corporate colors

### HTML Export Includes
- All data tables
- Formatted layout
- Print-friendly styling
- Responsive design

## 🔧 Technical Details

### Libraries Used
- **Chart.js** - Interactive charts (CDN)
- **XLSX (SheetJS)** - Excel parsing (CDN)
- **pptxgen-js** - PowerPoint generation (CDN)

### Browser Support
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ❌ Internet Explorer (Not supported)

### File Size Limits
- Max upload: 10MB
- Supports: .xlsx, .xls
- Multi-sheet: Yes

## 🎯 Use Cases

1. **IT/Telecom Reports** - KPI dashboards, vendor analysis
2. **Sales Reports** - Regional performance, quarterly trends
3. **Operations** - Incident tracking, SLA monitoring
4. **Executive Summaries** - High-level metrics presentations
5. **Data Analysis** - Quick visualization and export

## 📋 Workflow Example

```
1. Open index.html
2. Upload Excel file (or load sample)
3. Review generated report
4. Click "Download as PowerPoint"
5. Open in Microsoft Office
6. Print or share with stakeholders
```

## 💡 Pro Tips

✨ Use sample data to understand format  
✨ Multi-sheet Excel files are fully supported  
✨ Charts auto-detect data patterns  
✨ Works completely offline after first load  
✨ No admin rights needed  
✨ No installation required  

## ✅ What's Working

✅ Single HTML file deployment  
✅ Excel file upload and parsing  
✅ Multi-sheet support  
✅ Real-time chart rendering  
✅ KPI card display  
✅ Data table formatting  
✅ PowerPoint export  
✅ HTML export  
✅ Responsive design  
✅ Sample data included  

## 🎓 Testing

### Test 1: Sample Data
```
Click: Load Sample Data
Should see: 4 KPI cards, 3 charts, data tables
Result: ✅ All elements visible
```

### Test 2: PowerPoint Export
```
Click: Download as PowerPoint
Should: Generate .pptx file
Check: Slides include all data
Result: ✅ Opens in PowerPoint
```

### Test 3: Custom Excel
```
Upload: Your Excel file
Should: Parse all sheets
Verify: Charts render correctly
Result: ✅ Report displays properly
```

## 🚀 Quick Commands

### Start Server
```bash
# Windows
START_SERVER.bat

# Linux/Mac
python -m http.server 8000
```

### Open Browser
```
http://localhost:8000
```

### No Server (Direct)
```
Double-click: index.html
```

## 📞 Support

**File Issues:**
- Check: Excel file has proper column headers
- Check: Data types match (text/numbers)
- Check: No empty rows/columns

**Export Issues:**
- Try: Refresh page (F5)
- Try: Different browser
- Try: Sample data first

**Performance:**
- Tip: Large files may take 5+ seconds
- Tip: Use modern browser for best speed

## 🎉 You're Ready!

The Report Generator is ready to use:
1. ✅ No dependencies
2. ✅ No installation
3. ✅ No configuration
4. ✅ Just open and use!

---

**Start now:** Open `index.html` → Load sample data → Download report! 📊
