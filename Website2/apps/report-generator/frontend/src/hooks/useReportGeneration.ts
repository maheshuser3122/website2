import { useState, useCallback } from 'react'
import { ReportData, ReportSection } from '@types/index'
import { generatePowerPointReport, downloadPowerPoint } from '@utils/powerPointGenerator'

interface UseReportGenerationReturn {
  isGenerating: boolean
  error: string | null
  generateReport: (data: Record<string, unknown>[], title: string) => Promise<ReportData>
  exportToPowerPoint: (report: ReportData, filename: string) => void
  clearError: () => void
}

export const useReportGeneration = (): UseReportGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = useCallback(
    async (data: Record<string, unknown>[], title: string): Promise<ReportData> => {
      setIsGenerating(true)
      setError(null)

      try {
        const sections: ReportSection[] = []

        // Create sections from data
        if (data.length > 0) {
          // Summary section
          sections.push({
            id: 'summary',
            type: 'text',
            title: 'Executive Summary',
            content: `This report contains ${data.length} records with the following structure:\n\nColumns: ${Object.keys(data[0]).join(', ')}`,
            order: 1,
          })

          // Data table section
          sections.push({
            id: 'data-table',
            type: 'table',
            title: 'Data Overview',
            content: data,
            order: 2,
          })

          // Statistics section
          const stats = generateStatistics(data)
          sections.push({
            id: 'statistics',
            type: 'text',
            title: 'Key Statistics',
            content: stats,
            order: 3,
          })
        }

        const report: ReportData = {
          title,
          sections,
          metadata: {
            author: 'Report Generator',
            createdAt: new Date(),
            lastModified: new Date(),
            version: '1.0.0',
            tags: ['auto-generated', title.toLowerCase().replace(/\s+/g, '-')],
          },
        }

        return report
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
        setError(errorMessage)
        throw err
      } finally {
        setIsGenerating(false)
      }
    },
    []
  )

  const exportToPowerPoint = useCallback((report: ReportData, filename: string) => {
    try {
      const pres = generatePowerPointReport(report, {
        filename,
        includeTableOfContents: true,
        pageNumbers: true,
        theme: 'professional',
      })
      downloadPowerPoint(pres, `${filename}.pptx`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to PowerPoint'
      setError(errorMessage)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { isGenerating, error, generateReport, exportToPowerPoint, clearError }
}

function generateStatistics(data: Record<string, unknown>[]): string {
  const stats: string[] = ['Data Statistics:', '']
  stats.push(`Total Records: ${data.length}`)

  if (data.length > 0) {
    const keys = Object.keys(data[0])
    stats.push(`Total Columns: ${keys.length}`)
    stats.push('')
    stats.push('Column Names:')
    keys.forEach((key) => {
      stats.push(`  • ${key}`)
    })
  }

  return stats.join('\n')
}
