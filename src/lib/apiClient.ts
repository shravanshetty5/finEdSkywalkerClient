/**
 * Configuration options for the API client
 */
export interface ApiClientConfig {
  baseUrl: string
  token?: string
  onUnauthorized?: () => void
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Request options for the fetch method
 */
export interface RequestOptions {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: any
  params?: Record<string, string | number>
  signal?: AbortSignal
}

/**
 * Centralized API client for making authenticated requests to the backend
 */
export class ApiClient {
  private baseUrl: string
  private token?: string
  private onUnauthorized?: () => void

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.token = config.token
    this.onUnauthorized = config.onUnauthorized
  }

  /**
   * Update the authentication token
   */
  setToken(token: string | undefined) {
    this.token = token
  }

  /**
   * Build query string from params object
   */
  private buildQueryString(params?: Record<string, string | number>): string {
    if (!params || Object.keys(params).length === 0) {
      return ''
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })

    return `?${searchParams.toString()}`
  }

  /**
   * Make an HTTP request to the API
   * 
   * @param path - Relative path to the resource (e.g., '/api/search/tickers')
   * @param options - Request options including method, headers, body, and query params
   * @returns Parsed JSON response
   * @throws Error if the request fails or returns non-OK status
   */
  async fetch<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      signal,
    } = options

    // Build the full URL
    const queryString = this.buildQueryString(params)
    const url = `${this.baseUrl}${path}${queryString}`

    // Build headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    }

    // Add Authorization header if token is available
    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`
    }

    // Build fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal,
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      // Handle 401 Unauthorized
      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized()
        }
        throw new Error('Unauthorized: Session expired or invalid token')
      }

      // Handle other error status codes
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      // Parse and return JSON response
      return await response.json()
    } catch (error) {
      // Handle abort errors silently
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      
      // Re-throw other errors for the caller to handle
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = any>(path: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
    return this.fetch<T>(path, { method: 'GET', params, signal })
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = any>(path: string, body?: any): Promise<T> {
    return this.fetch<T>(path, { method: 'POST', body })
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = any>(path: string, body?: any): Promise<T> {
    return this.fetch<T>(path, { method: 'PUT', body })
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = any>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: 'DELETE' })
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T = any>(path: string, body?: any): Promise<T> {
    return this.fetch<T>(path, { method: 'PATCH', body })
  }
}

