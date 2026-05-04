// To use this file with Node.js:
// 1. Install dependency: npm install xlsx
// 2. Run: node create-sample-excel.js
// 3. File will be created in same directory

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create sample workbook with multiple sheets
const workbook = XLSX.utils.book_new();

// Sheet 1: KPIs
const kpiData = [
    { KPI: 'Network Availability', Value: 99.5, Target: 99.9, Status: 'On Track' },
    { KPI: 'Cost Per Incident', Value: 2500, Target: 2000, Status: 'Review' },
    { KPI: 'Mean Time To Recover (Min)', Value: 15, Target: 20, Status: 'Good' },
    { KPI: 'Incidents Per Month', Value: 8, Target: 5, Status: 'Monitor' },
    { KPI: 'Customer Satisfaction %', Value: 92, Target: 95, Status: 'On Track' }
];

const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');

// Sheet 2: Performance Metrics
const perfData = [
    { Metric: 'Uptime', Q1: 99.5, Q2: 99.8, Q3: 99.2, Q4: 99.9 },
    { Metric: 'Response Time (ms)', Q1: 245, Q2: 198, Q3: 212, Q4: 165 },
    { Metric: 'Error Rate %', Q1: 0.5, Q2: 0.3, Q3: 0.4, Q4: 0.2 },
    { Metric: 'Throughput (GB/s)', Q1: 850, Q2: 920, Q3: 950, Q4: 1020 },
    { Metric: 'Active Users', Q1: 5200, Q2: 6100, Q3: 7300, Q4: 8500 }
];

const perfSheet = XLSX.utils.json_to_sheet(perfData);
XLSX.utils.book_append_sheet(workbook, perfSheet, 'Performance');

// Sheet 3: Vendors
const vendorData = [
    { Vendor: 'Cisco', Market_Share: 35, Status: 'Active', Score: 92, Contract_Years: 3 },
    { Vendor: 'Juniper', Market_Share: 28, Status: 'Active', Score: 85, Contract_Years: 2 },
    { Vendor: 'Arista', Market_Share: 22, Status: 'Active', Score: 88, Contract_Years: 2 },
    { Vendor: 'Nokia', Market_Share: 10, Status: 'Support', Score: 75, Contract_Years: 1 },
    { Vendor: 'Others', Market_Share: 5, Status: 'Legacy', Score: 60, Contract_Years: 1 }
];

const vendorSheet = XLSX.utils.json_to_sheet(vendorData);
XLSX.utils.book_append_sheet(workbook, vendorSheet, 'Vendors');

// Sheet 4: Regional Performance
const regionData = [
    { Region: 'North America', Revenue: 2500000, Incidents: 8, Satisfaction: 94, Growth: 12 },
    { Region: 'Europe', Revenue: 1800000, Incidents: 6, Satisfaction: 91, Growth: 8 },
    { Region: 'Asia Pacific', Revenue: 1200000, Incidents: 5, Satisfaction: 88, Growth: 18 },
    { Region: 'Middle East', Revenue: 450000, Incidents: 4, Satisfaction: 85, Growth: 15 },
    { Region: 'Africa', Revenue: 350000, Incidents: 3, Satisfaction: 80, Growth: 22 }
];

const regionSheet = XLSX.utils.json_to_sheet(regionData);
XLSX.utils.book_append_sheet(workbook, regionSheet, 'Regions');

// Write file
const outputPath = path.join(__dirname, 'sample-report-data.xlsx');
XLSX.writeFile(workbook, outputPath);
console.log('✅ Sample Excel file created: ' + outputPath);
