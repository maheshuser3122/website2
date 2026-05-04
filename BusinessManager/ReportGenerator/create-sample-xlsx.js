import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sample data
const sampleData = [
  {
    'Employee ID': 'EMP001',
    'Name': 'John Smith',
    'Department': 'Engineering',
    'Position': 'Senior Developer',
    'Salary': 95000,
    'Hire Date': '2020-01-15',
    'Performance Rating': 4.5
  },
  {
    'Employee ID': 'EMP002',
    'Name': 'Sarah Johnson',
    'Department': 'Marketing',
    'Position': 'Marketing Manager',
    'Salary': 75000,
    'Hire Date': '2019-06-20',
    'Performance Rating': 4.2
  },
  {
    'Employee ID': 'EMP003',
    'Name': 'Michael Chen',
    'Department': 'Engineering',
    'Position': 'Junior Developer',
    'Salary': 65000,
    'Hire Date': '2021-03-10',
    'Performance Rating': 4.0
  },
  {
    'Employee ID': 'EMP004',
    'Name': 'Emma Davis',
    'Department': 'Sales',
    'Position': 'Sales Representative',
    'Salary': 55000,
    'Hire Date': '2022-01-05',
    'Performance Rating': 3.8
  },
  {
    'Employee ID': 'EMP005',
    'Name': 'Robert Wilson',
    'Department': 'Finance',
    'Position': 'Finance Analyst',
    'Salary': 70000,
    'Hire Date': '2020-07-12',
    'Performance Rating': 4.3
  },
  {
    'Employee ID': 'EMP006',
    'Name': 'Lisa Anderson',
    'Department': 'Engineering',
    'Position': 'Tech Lead',
    'Salary': 105000,
    'Hire Date': '2018-09-01',
    'Performance Rating': 4.7
  },
  {
    'Employee ID': 'EMP007',
    'Name': 'James Taylor',
    'Department': 'Operations',
    'Position': 'Operations Manager',
    'Salary': 80000,
    'Hire Date': '2019-02-14',
    'Performance Rating': 4.1
  },
  {
    'Employee ID': 'EMP008',
    'Name': 'Jessica Martinez',
    'Department': 'Marketing',
    'Position': 'Content Specialist',
    'Salary': 60000,
    'Hire Date': '2021-08-23',
    'Performance Rating': 3.9
  }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Employees');

// Set column widths
ws['!cols'] = [
  { wch: 12 },
  { wch: 18 },
  { wch: 15 },
  { wch: 20 },
  { wch: 12 },
  { wch: 15 },
  { wch: 18 }
];

// Write file to public folder
const filePath = path.join(__dirname, 'public', 'sample-data.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`✅ Sample Excel file created at: ${filePath}`);
