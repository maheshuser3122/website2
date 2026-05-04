import create from 'zustand'
import { ReportData, ExcelData } from '@types/index'

interface ReportStore {
  // State
  currentReport: ReportData | null
  excelData: ExcelData | null
  isLoading: boolean
  error: string | null

  // Actions
  setCurrentReport: (report: ReportData) => void
  setExcelData: (data: ExcelData) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearReport: () => void
  clearError: () => void
}

export const useReportStore = create<ReportStore>((set) => ({
  currentReport: null,
  excelData: null,
  isLoading: false,
  error: null,

  setCurrentReport: (report) => set({ currentReport: report }),
  setExcelData: (data) => set({ excelData: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearReport: () => set({ currentReport: null }),
  clearError: () => set({ error: null }),
}))
