import axios, { AxiosInstance } from 'axios'
import { ReportData, ReportTemplate } from '@types/index'

class ReportService {
  private client: AxiosInstance

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Save generated report
   */
  async saveReport(report: ReportData): Promise<{ id: string }> {
    try {
      const response = await this.client.post<{ id: string }>('/api/reports', report)
      return response.data
    } catch (error) {
      throw new Error(`Failed to save report: ${error}`)
    }
  }

  /**
   * Load previously saved report
   */
  async loadReport(reportId: string): Promise<ReportData> {
    try {
      const response = await this.client.get<ReportData>(`/api/reports/${reportId}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to load report: ${error}`)
    }
  }

  /**
   * Get all saved reports
   */
  async listReports(): Promise<ReportData[]> {
    try {
      const response = await this.client.get<ReportData[]>('/api/reports')
      return response.data
    } catch (error) {
      throw new Error(`Failed to list reports: ${error}`)
    }
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      await this.client.delete(`/api/reports/${reportId}`)
    } catch (error) {
      throw new Error(`Failed to delete report: ${error}`)
    }
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<ReportTemplate[]> {
    try {
      const response = await this.client.get<ReportTemplate[]>('/api/templates')
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch templates: ${error}`)
    }
  }

  /**
   * Get single template
   */
  async getTemplate(templateId: string): Promise<ReportTemplate> {
    try {
      const response = await this.client.get<ReportTemplate>(
        `/api/templates/${templateId}`
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch template: ${error}`)
    }
  }

  /**
   * Generate report from template
   */
  async generateFromTemplate(
    templateId: string,
    data: Record<string, unknown>
  ): Promise<ReportData> {
    try {
      const response = await this.client.post<ReportData>(
        `/api/templates/${templateId}/generate`,
        data
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to generate report: ${error}`)
    }
  }
}

export const reportService = new ReportService()
