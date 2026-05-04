import XLSX from 'xlsx';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wb = XLSX.utils.book_new();

// 1. Test Partners Distribution Data
const srDistributionData = [
  { Period: 'Oct 25 to Dec 25', Capgemini: 63, NOKIA: 8, Cisco: 2, Ericsson: 4, VF: 8, NCC: 15 },
  { Period: 'Sep 25 to Nov 25', Capgemini: 62, NOKIA: 7, Cisco: 2, Ericsson: 5, VF: 14, NCC: 13 },
];
const srWs = XLSX.utils.json_to_sheet(srDistributionData);
XLSX.utils.book_append_sheet(wb, srWs, 'SR Distribution');

// 2. KPI Summary Data
const kpiData = [
  { KPI: 'KPI1: Number of failed SR', GEO: 'IT', Jan: 31, Feb: 40, Mar: 42, Apr: 44, May: 48, Jun: 39, Jul: 31, Aug: 77, Sep: 35, Oct: 100, Nov: 100, Dec: 95 },
  { KPI: 'KPI2: Number of failed SR', GEO: 'UK', Jan: 11, Feb: 40, Mar: 67, Apr: 85, May: 81, Jun: 77, Jul: 78, Aug: 83, Sep: 85, Oct: 100, Nov: 100, Dec: 95 },
  { KPI: 'KPI2 (excl. EDD): Number of failed SR', GEO: 'IT', Jan: 11, Feb: 40, Mar: 67, Apr: 65, May: 84, Jun: 77, Jul: 78, Aug: 83, Sep: 85, Oct: 100, Nov: 100, Dec: 95 },
  { KPI: 'KPI3: Number of failed SR', GEO: 'UK', Jan: 11, Feb: 40, Mar: 67, Apr: 85, May: 84, Jun: 77, Jul: 78, Aug: 83, Sep: 85, Oct: 100, Nov: 100, Dec: 95 },
];
const kpiWs = XLSX.utils.json_to_sheet(kpiData);
XLSX.utils.book_append_sheet(wb, kpiWs, 'KPI Summary');

// 3. SR Analysis by Year
const srAnalysisData = [
  { Month: 'Jul', 'VF-IT SY4': 64, 'VF-IT SY5': 52, 'VF-IT SY6': 46, 'VF-IT SY7': 51, 'VF-IT SY8': 39 },
  { Month: 'Aug', 'VF-IT SY4': 30, 'VF-IT SY5': 50, 'VF-IT SY6': 39, 'VF-IT SY7': 45, 'VF-IT SY8': 38 },
  { Month: 'Sep', 'VF-IT SY4': 45, 'VF-IT SY5': 38, 'VF-IT SY6': 52, 'VF-IT SY7': 51, 'VF-IT SY8': 42 },
  { Month: 'Oct', 'VF-IT SY4': 72, 'VF-IT SY5': 45, 'VF-IT SY6': 38, 'VF-IT SY7': 40, 'VF-IT SY8': 51 },
  { Month: 'Nov', 'VF-IT SY4': 54, 'VF-IT SY5': 41, 'VF-IT SY6': 47, 'VF-IT SY7': 40, 'VF-IT SY8': 47 },
  { Month: 'Dec', 'VF-IT SY4': 67, 'VF-IT SY5': 34, 'VF-IT SY6': 22, 'VF-IT SY7': 36, 'VF-IT SY8': 27 },
  { Month: 'Jan', 'VF-IT SY4': 58, 'VF-IT SY5': 49, 'VF-IT SY6': 40, 'VF-IT SY7': 34, 'VF-IT SY8': 40 },
  { Month: 'Feb', 'VF-IT SY4': 67, 'VF-IT SY5': 52, 'VF-IT SY6': 51, 'VF-IT SY7': 49, 'VF-IT SY8': 58 },
  { Month: 'Mar', 'VF-IT SY4': 65, 'VF-IT SY5': 58, 'VF-IT SY6': 40, 'VF-IT SY7': 38, 'VF-IT SY8': 51 },
  { Month: 'Apr', 'VF-IT SY4': 56, 'VF-IT SY5': 51, 'VF-IT SY6': 47, 'VF-IT SY7': 40, 'VF-IT SY8': 51 },
  { Month: 'May', 'VF-IT SY4': 56, 'VF-IT SY5': 51, 'VF-IT SY6': 42, 'VF-IT SY7': 48, 'VF-IT SY8': 47 },
  { Month: 'Jun', 'VF-IT SY4': 48, 'VF-IT SY5': 47, 'VF-IT SY6': 37, 'VF-IT SY7': 27, 'VF-IT SY8': 37 },
];
const srAnalysisWs = XLSX.utils.json_to_sheet(srAnalysisData);
XLSX.utils.book_append_sheet(wb, srAnalysisWs, 'SR Analysis');

// 4. Incident Analysis by Market
const incidentAnalysisData = [
  { Period: '2025/01', 'VF-IT': 37, 'VF-UK': 31 },
  { Period: '2025/02', 'VF-IT': 39, 'VF-UK': 25 },
  { Period: '2025/03', 'VF-IT': 32, 'VF-UK': 29 },
  { Period: '2025/04', 'VF-IT': 29, 'VF-UK': 15 },
  { Period: '2025/05', 'VF-IT': 34, 'VF-UK': 9 },
  { Period: '2025/06', 'VF-IT': 32, 'VF-UK': 21 },
  { Period: '2025/07', 'VF-IT': 32, 'VF-UK': 25 },
  { Period: '2025/08', 'VF-IT': 25, 'VF-UK': 12 },
  { Period: '2025/09', 'VF-IT': 31, 'VF-UK': 27 },
  { Period: '2025/10', 'VF-IT': 31, 'VF-UK': 26 },
  { Period: '2025/11', 'VF-IT': 30, 'VF-UK': 22 },
  { Period: '2025/12', 'VF-IT': 22, 'VF-UK': 21 },
];
const incidentWs = XLSX.utils.json_to_sheet(incidentAnalysisData);
XLSX.utils.book_append_sheet(wb, incidentWs, 'Incident Analysis');

// 5. Average Inc Fix Time
const fixTimeData = [
  { Month: 'Jul', 'VF-IT SY4': '3:35', 'VF-IT SY5': '2:41', 'VF-IT SY6': '2:25', 'VF-IT SY7': '2:24', 'VF-IT SY8': '2:22' },
  { Month: 'Aug', 'VF-IT SY4': '2:24', 'VF-IT SY5': '3:12', 'VF-IT SY6': '2:29', 'VF-IT SY7': '2:26', 'VF-IT SY8': '1:58' },
  { Month: 'Sep', 'VF-IT SY4': '4:48', 'VF-IT SY5': '3:31', 'VF-IT SY6': '2:52', 'VF-IT SY7': '3:06', 'VF-IT SY8': '2:44' },
  { Month: 'Oct', 'VF-IT SY4': '4:30', 'VF-IT SY5': '3:28', 'VF-IT SY6': '2:30', 'VF-IT SY7': '2:06', 'VF-IT SY8': '2:11' },
  { Month: 'Nov', 'VF-IT SY4': '4:18', 'VF-IT SY5': '3:46', 'VF-IT SY6': '3:06', 'VF-IT SY7': '2:44', 'VF-IT SY8': '2:30' },
  { Month: 'Dec', 'VF-IT SY4': '3:29', 'VF-IT SY5': '3:00', 'VF-IT SY6': '3:00', 'VF-IT SY7': '2:57', 'VF-IT SY8': '1:39' },
  { Month: 'Jan', 'VF-IT SY4': '3:31', 'VF-IT SY5': '2:51', 'VF-IT SY6': '2:30', 'VF-IT SY7': '2:29', 'VF-IT SY8': '1:12' },
  { Month: 'Feb', 'VF-IT SY4': '3:31', 'VF-IT SY5': '3:12', 'VF-IT SY6': '2:22', 'VF-IT SY7': '2:06', 'VF-IT SY8': '2:07' },
  { Month: 'Mar', 'VF-IT SY4': '3:31', 'VF-IT SY5': '2:59', 'VF-IT SY6': '2:44', 'VF-IT SY7': '2:46', 'VF-IT SY8': '2:44' },
  { Month: 'Apr', 'VF-IT SY4': '2:59', 'VF-IT SY5': '2:31', 'VF-IT SY6': '2:59', 'VF-IT SY7': '2:26', 'VF-IT SY8': '3:33' },
];
const fixTimeWs = XLSX.utils.json_to_sheet(fixTimeData);
XLSX.utils.book_append_sheet(wb, fixTimeWs, 'Fix Time');

// 6. ALM KPIs
const almData = [
  { 'Tested By': 'ENTS', 'Count Test': 3355, 'Count Defect': 75, Density: 2.1, 'Density Step': 6.7, 'Average Defect Age': 289, 'Average Defect Reset Time': 3, '% Rejected Defects': 3.84 },
  { 'Tested By': 'Unknown', 'Count Test': 5359, 'Count Defect': 87, Density: 1.6, 'Density Step': 1.4, 'Average Defect Age': 259, 'Average Defect Reset Time': 3, '% Rejected Defects': 9.03 },
  { 'Tested By': 'Vendor', 'Count Test': 104, 'Count Defect': 0, Density: 0.0, 'Density Step': 0.0, 'Average Defect Age': 0, 'Average Defect Reset Time': 0, '% Rejected Defects': 0 },
  { 'Tested By': 'Vodafone', 'Count Test': 998, 'Count Defect': 63, Density: 6.3, 'Density Step': 1.8, 'Average Defect Age': 17, 'Average Defect Reset Time': 1, '% Rejected Defects': 1.84 },
];
const almWs = XLSX.utils.json_to_sheet(almData);
XLSX.utils.book_append_sheet(wb, almWs, 'ALM KPIs');

// 7. SLA Report
const slaData = [
  { Measures: 'SLA1 - Cost_Eng_Responsiveness (Notification 10hrs)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 100, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA2 - Cost_Eng_Responsiveness (Contact 2 days)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 85, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA3 - Adherence to Start Date', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 70, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA4 - Environment Proven', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 65, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA5 - Incident Responsiveness (initial 1hr)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 50, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA6 - Incident Responsiveness (Updates 8hrs)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 50, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA7 - Incident Responsiveness (Fixed 16hrs)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 50, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA8 - Change Request Responsiveness (initial 4hrs)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 0, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA9 - Change Request Resolution (Within 8hrs)', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 80, Oct: 100, Nov: 100, Dec: 100 },
  { Measures: 'SLA10 - Case resolved by first line support', GEO: 'UK', Jan: 100, Feb: 100, Mar: 100, Apr: 100, May: 100, Jun: 100, Jul: 100, Aug: 100, Sep: 100, Oct: 100, Nov: 100, Dec: 100 },
];
const slaWs = XLSX.utils.json_to_sheet(slaData);
XLSX.utils.book_append_sheet(wb, slaWs, 'SLA Report');

// Save the workbook
const outputPath = path.join(__dirname, 'public', 'advanced-sample-data.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`✅ Advanced sample Excel file created at: ${outputPath}`);
