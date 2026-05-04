export interface ExcelData {
  headers: string[]
  rows: Record<string, unknown>[]
  sheetName: string
}

export interface ReportData {
  title: string
  sections: ReportSection[]
  metadata: ReportMetadata
  templateId?: string
}

export interface ReportSection {
  id: string
  type: 'text' | 'table' | 'chart' | 'image'
  title: string
  content: unknown
  order: number
}

export interface ReportMetadata {
  author: string
  createdAt: Date
  lastModified: Date
  version: string
  tags: string[]
}

export interface SharePointListItem {
  id: string
  title: string
  content: string
  metadata: Record<string, unknown>
}

export interface PowerPointExportOptions {
  filename: string
  theme?: 'default' | 'professional' | 'modern'
  includeTableOfContents: boolean
  pageNumbers: boolean
}

export interface UploadProgress {
  percentage: number
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  message: string
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  layout: 'standard' | 'compact' | 'detailed'
  sections: TemplateSectionConfig[]
}

export interface TemplateSectionConfig {
  id: string
  type: ReportSection['type']
  title: string
  required: boolean
  order: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
