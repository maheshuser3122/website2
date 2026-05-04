# Sample Files & Demo

This folder contains sample files for testing the Report Generator application.

## Files

### `sample-data.xlsx`
A sample Excel file containing employee data with the following columns:
- Employee ID
- Name
- Department
- Position
- Salary
- Hire Date
- Performance Rating

**Usage:** Download this file and upload it to the Report Generator to preview how Excel data is processed.

### `index.html`
A standalone HTML demo that showcases how to:
1. Upload Excel files via drag-and-drop or file selection
2. Preview Excel data in an interactive table
3. View multiple sheets with tabs
4. Export data as HTML reports

**How to use:**
1. Open `index.html` in your web browser
2. Drag and drop an Excel file or click to browse
3. Preview the data in an interactive table
4. Click "Export as HTML" to generate an HTML report

## Quick Start

### Option 1: Use the React Application
```bash
cd ../
npm run dev
# Open http://localhost:3001 (or 3002)
```

### Option 2: Use the Standalone Demo
1. Open `index.html` directly in your browser
2. Upload `sample-data.xlsx` to test

## Sample Data Structure

```
Employee ID  | Name              | Department    | Position              | Salary | Hire Date  | Performance Rating
EMP001       | John Smith        | Engineering   | Senior Developer      | 95000  | 2020-01-15 | 4.5
EMP002       | Sarah Johnson     | Marketing     | Marketing Manager     | 75000  | 2019-06-20 | 4.2
...
```

## Creating Custom Excel Files

You can create your own Excel files with any data and upload them to test. The supported formats are:
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

**Requirements:**
- Maximum file size: 10MB
- First row should contain headers
- All rows should have the same columns

## Features Demonstrated

✅ Excel file upload (drag-and-drop & file selection)
✅ Multi-sheet support
✅ Data preview in interactive tables
✅ Statistics (sheet count, row count, column count)
✅ HTML export functionality
✅ Responsive design
✅ Error handling

## Notes

- Data is processed **locally** in the browser (not stored)
- The HTML demo uses [XLSX.js](https://github.com/SheetJS/sheetjs) for parsing
- For production use, integrate with the React Report Generator
- PowerPoint export available in the React application
