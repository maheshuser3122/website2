import React, { useState } from 'react'
import { FiTable } from 'react-icons/fi'
import { ExcelData } from '@types/index'

interface DataPreviewProps {
  data: ExcelData
}

function DataPreview({ data }: DataPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const totalPages = Math.ceil(data.rows.length / rowsPerPage)

  const startIdx = (currentPage - 1) * rowsPerPage
  const endIdx = startIdx + rowsPerPage
  const currentRows = data.rows.slice(startIdx, endIdx)

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FiTable className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
          <p className="text-sm text-gray-600">
            Sheet: {data.sheetName} • Rows: {data.rows.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-12">
                  #
                </th>
                {data.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRows.map((row, idx) => (
                <tr key={`${startIdx}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600 w-12">
                    {startIdx + idx + 1}
                  </td>
                  {data.headers.map((header) => (
                    <td
                      key={`${header}-${idx}`}
                      className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate"
                    >
                      {String(row[header] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIdx + 1} to {Math.min(endIdx, data.rows.length)} of {data.rows.length}
          rows
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i
              }
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <p className="text-sm text-gray-600">Total Rows</p>
          <p className="text-2xl font-bold text-blue-600">{data.rows.length}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-gray-600">Total Columns</p>
          <p className="text-2xl font-bold text-green-600">{data.headers.length}</p>
        </div>
        <div className="card bg-purple-50">
          <p className="text-sm text-gray-600">Sheet Name</p>
          <p className="text-lg font-bold text-purple-600 truncate">{data.sheetName}</p>
        </div>
        <div className="card bg-orange-50">
          <p className="text-sm text-gray-600">Pages</p>
          <p className="text-2xl font-bold text-orange-600">{totalPages}</p>
        </div>
      </div>
    </div>
  )
}

export default DataPreview
