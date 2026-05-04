import * as XLSX from 'xlsx'
import { ExcelData } from '@types/index'

export const parseExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Parse as JSON to get headers and rows
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        if (jsonData.length === 0) {
          throw new Error('Excel file is empty or unreadable')
        }

        const headers = Object.keys(jsonData[0])
        
        resolve({
          headers,
          rows: jsonData as Record<string, unknown>[],
          sheetName,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const validateExcelData = (data: ExcelData): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data.headers || data.headers.length === 0) {
    errors.push('No headers found in Excel file')
  }

  if (!data.rows || data.rows.length === 0) {
    errors.push('No data rows found in Excel file')
  }

  data.rows.forEach((row, index) => {
    data.headers.forEach((header) => {
      if (!(header in row)) {
        errors.push(`Row ${index + 1} missing column: ${header}`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const transformExcelToReportData = (excelData: ExcelData) => {
  return {
    headers: excelData.headers,
    data: excelData.rows,
    source: 'excel',
    importedAt: new Date(),
  }
}
