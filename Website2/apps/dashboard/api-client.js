/**
 * Frontend API Client
 * Centralized API communication for all frontend apps
 */

class APIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  /**
   * Generic request method
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload(endpoint, file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Don't set Content-Type for FormData
    });
  }
}

// Export for use in all frontend apps
window.APIClient = APIClient;
