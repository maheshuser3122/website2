import React, { useState } from 'react'
import { FiUploadCloud, FiCheck, FiAlert } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useExcelUpload } from '@hooks/useExcelUpload'

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>
  acceptedFormats?: string
}

function FileUpload({
  onFileUpload,
  acceptedFormats = '.xlsx,.xls',
}: FileUploadProps) {
  const { isLoading, error } = useExcelUpload()
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      await handleFile(files[0])
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      await handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    try {
      await onFileUpload(file)
      toast.success(`Successfully uploaded ${file.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400'
      }`}
    >
      <input
        type="file"
        accept={acceptedFormats}
        onChange={handleChange}
        disabled={isLoading}
        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <div className="flex flex-col items-center justify-center gap-4">
        {isLoading ? (
          <>
            <div className="animate-spin">
              <FiUploadCloud className="w-12 h-12 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-blue-600">Uploading file...</p>
          </>
        ) : error ? (
          <>
            <FiAlert className="w-12 h-12 text-red-500" />
            <div>
              <p className="font-medium text-red-900">Upload failed</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </>
        ) : (
          <>
            <FiUploadCloud className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-base font-medium text-gray-900">
                Drag and drop your Excel file here
              </p>
              <p className="text-sm text-gray-500">or click to browse</p>
              <p className="text-xs text-gray-400 mt-2">
                Supports: {acceptedFormats.replace(/\./g, '')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FileUpload
