import { useState, useCallback } from 'react'
import { ExcelData } from '@types/index'
import { parseExcelFile, validateExcelData } from '@utils/excelParser'

interface UseExcelUploadReturn {
  data: ExcelData | null
  isLoading: boolean
  error: string | null
  uploadFile: (file: File) => Promise<void>
  clearData: () => void
}

export const useExcelUpload = (): UseExcelUploadReturn => {
  const [data, setData] = useState<ExcelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ]

      if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid Excel file (.xlsx or .xls)')
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      const excelData = await parseExcelFile(file)

      const validation = validateExcelData(excelData)
      if (!validation.valid) {
        throw new Error(`Invalid data: ${validation.errors.join(', ')}`)
      }

      setData(excelData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearData = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, isLoading, error, uploadFile, clearData }
}
