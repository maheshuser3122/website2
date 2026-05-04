import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiResponse, SharePointListItem } from '@types/index'

class SharePointService {
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

    // Error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error)
        throw this.handleError(error)
      }
    )
  }

  /**
   * Fetch items from SharePoint list
   */
  async getListItems(listId: string): Promise<SharePointListItem[]> {
    try {
      const response = await this.client.get<ApiResponse<SharePointListItem[]>>(
        `/api/sharepoint/lists/${listId}/items`
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch items')
      }

      return response.data.data || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get available SharePoint lists
   */
  async getLists(): Promise<{ id: string; name: string }[]> {
    try {
      const response = await this.client.get<
        ApiResponse<{ id: string; name: string }[]>
      >('/api/sharepoint/lists')

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch lists')
      }

      return response.data.data || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Authenticate with SharePoint
   */
  async authenticate(credentials: {
    siteUrl: string
    username: string
    password: string
  }): Promise<{ token: string; expiresIn: number }> {
    try {
      const response = await this.client.post<
        ApiResponse<{ token: string; expiresIn: number }>
      >('/api/sharepoint/authenticate', credentials)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Authentication failed')
      }

      return response.data.data!
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Search items in SharePoint
   */
  async searchItems(query: string, listId?: string): Promise<SharePointListItem[]> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      if (listId) params.append('listId', listId)

      const response = await this.client.get<ApiResponse<SharePointListItem[]>>(
        '/api/sharepoint/search',
        { params }
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Search failed')
      }

      return response.data.data || []
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get SharePoint site information
   */
  async getSiteInfo(): Promise<{ displayName: string; webUrl: string }> {
    try {
      const response = await this.client.get<
        ApiResponse<{ displayName: string; webUrl: string }>
      >('/api/sharepoint/site')

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch site info')
      }

      return response.data.data!
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || error.message
      return new Error(`SharePoint API Error: ${message}`)
    }
    return error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

export const sharePointService = new SharePointService()
