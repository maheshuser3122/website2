import React, { useState } from 'react'
import { FiDownload, FiRotateCw, FiSettings } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { ReportData } from '@types/index'
import { useReportGeneration } from '@hooks/useReportGeneration'

interface ReportPreviewProps {
  report: ReportData
  onExport: (report: ReportData) => void
}

function ReportPreview({ report, onExport }: ReportPreviewProps) {
  const { exportToPowerPoint } = useReportGeneration()
  const [exporting, setExporting] = useState(false)
  const [exportSettings, setExportSettings] = useState({
    includeTableOfContents: true,
    pageNumbers: true,
    theme: 'professional' as const,
  })

  const handleExportPowerPoint = async () => {
    setExporting(true)
    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${report.title.replace(/\s+/g, '_')}_${timestamp}`
      exportToPowerPoint(report, filename)
      toast.success('PowerPoint report exported successfully!')
      onExport(report)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{report.title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Created: {report.metadata.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={exporting}
            className="btn-secondary flex items-center gap-2"
          >
            <FiSettings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleExportPowerPoint}
            disabled={exporting}
            className="btn-primary flex items-center gap-2"
          >
            {exporting ? (
              <>
                <FiRotateCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                Export to PowerPoint
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportSettings.includeTableOfContents}
              onChange={(e) =>
                setExportSettings((prev) => ({
                  ...prev,
                  includeTableOfContents: e.target.checked,
                }))
              }
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Include Table of Contents</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportSettings.pageNumbers}
              onChange={(e) =>
                setExportSettings((prev) => ({
                  ...prev,
                  pageNumbers: e.target.checked,
                }))
              }
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Add Page Numbers</span>
          </label>
          <div>
            <select
              value={exportSettings.theme}
              onChange={(e) =>
                setExportSettings((prev) => ({
                  ...prev,
                  theme: e.target.value as 'professional' | 'modern' | 'default',
                }))
              }
              className="input-primary w-full"
            >
              <option value="default">Theme: Default</option>
              <option value="professional">Theme: Professional</option>
              <option value="modern">Theme: Modern</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Sections Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Report Sections</h3>
        {report.sections.map((section) => (
          <div key={section.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">{section.title}</h4>
                  <span className="badge badge-info text-xs">{section.type}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {section.type === 'table' && Array.isArray(section.content)
                    ? `${section.content.length} rows of data`
                    : section.type === 'text'
                      ? `${String(section.content).split('\n').length} lines`
                      : 'Content'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="card bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Author</p>
            <p className="font-medium text-gray-900">{report.metadata.author}</p>
          </div>
          <div>
            <p className="text-gray-600">Version</p>
            <p className="font-medium text-gray-900">{report.metadata.version}</p>
          </div>
          <div>
            <p className="text-gray-600">Sections</p>
            <p className="font-medium text-gray-900">{report.sections.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Tags</p>
            <p className="font-medium text-gray-900">{report.metadata.tags.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportPreview
