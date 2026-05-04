import React, { useState } from 'react'
import { FiDownload, FiFileText, FiChevronRight } from 'react-icons/fi'
import FileUpload from '@components/FileUpload'
import DataPreview from '@components/DataPreview'
import ReportPreview from '@components/ReportPreview'
import { useExcelUpload } from '@hooks/useExcelUpload'
import { useReportGeneration } from '@hooks/useReportGeneration'
import toast from 'react-hot-toast'

type DashboardStep = 'upload' | 'preview' | 'generate' | 'export'

function Dashboard() {
  const [currentStep, setCurrentStep] = useState<DashboardStep>('upload')
  const [reportTitle, setReportTitle] = useState('')

  const { data: excelData, uploadFile } = useExcelUpload()
  const { isGenerating, generateReport, exportToPowerPoint } = useReportGeneration()
  const [generatedReport, setGeneratedReport] = useState<any>(null)

  const handleFileUpload = async (file: File) => {
    await uploadFile(file)
    if (excelData) {
      setCurrentStep('preview')
    }
  }

  const handleGenerateReport = async () => {
    if (!excelData || !reportTitle.trim()) {
      toast.error('Please enter a report title and upload data')
      return
    }

    try {
      const report = await generateReport(excelData.rows, reportTitle)
      setGeneratedReport(report)
      setCurrentStep('export')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    }
  }

  const handleExport = (report: any) => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${report.title.replace(/\s+/g, '_')}_${timestamp}`
    exportToPowerPoint(report, filename)
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {(['upload', 'preview', 'generate', 'export'] as DashboardStep[]).map(
          (step, index) => {
            const steps = [
              { label: 'Upload Data', id: 'upload' },
              { label: 'Review Data', id: 'preview' },
              { label: 'Generate Report', id: 'generate' },
              { label: 'Export', id: 'export' },
            ]
            const stepInfo = steps[index]
            const isComplete = step === 'upload' ? !!excelData : step === 'generate' ? !!generatedReport : step === 'preview' ? !!excelData : !!generatedReport
            const isActive = currentStep === step

            return (
              <div key={step} className="flex items-center gap-4 min-w-fit">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isComplete
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isComplete && step !== currentStep ? '✓' : index + 1}
                </div>
                <div className="whitespace-nowrap">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                    {stepInfo.label}
                  </p>
                </div>
                {index < 3 && <FiChevronRight className="text-gray-400 hidden sm:block" />}
              </div>
            )
          }
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Data</h2>
              <p className="text-gray-600">
                Upload an Excel file to generate a professional report
              </p>
            </div>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {currentStep === 'preview' && excelData && (
          <div className="space-y-6">
            <DataPreview data={excelData} />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setCurrentStep('upload')}
                className="btn-secondary"
              >
                Upload Different File
              </button>
              <button
                onClick={() => setCurrentStep('generate')}
                className="btn-primary flex items-center gap-2"
              >
                Continue <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'generate' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Generate Report</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="e.g., Q4 2024 Analysis Report"
                    className="input-primary w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Summary
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                    <p>
                      <strong>Rows:</strong> {excelData?.rows.length}
                    </p>
                    <p>
                      <strong>Columns:</strong> {excelData?.headers.length}
                    </p>
                    <p>
                      <strong>Sheet:</strong> {excelData?.sheetName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setCurrentStep('preview')} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !reportTitle.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin">
                      <FiFileText className="w-4 h-4" />
                    </div>
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Report <FiChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'export' && generatedReport && (
          <div className="space-y-6">
            <ReportPreview report={generatedReport} onExport={handleExport} />
            <div className="flex gap-4 justify-end">
              <button onClick={() => setCurrentStep('upload')} className="btn-secondary">
                Start New Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Need Help?</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Supported formats: .xlsx, .xls (Excel files only)</li>
          <li>• Maximum file size: 10MB</li>
          <li>• Reports are exported in PowerPoint format (.pptx)</li>
          <li>• Your data is processed locally and not stored</li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard
