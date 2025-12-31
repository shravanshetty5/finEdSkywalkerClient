import { ApiClient } from '@/lib/apiClient'
import { SearchResponse, SearchResult } from '@/types/search'

/**
 * Search service for stock ticker search functionality
 */
export class SearchService {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  /**
   * Search for stock tickers by query string
   * 
   * @param query - The search query (minimum 2 characters)
   * @param limit - Maximum number of results to return (default: 10)
   * @param signal - Optional AbortSignal to cancel the request
   * @returns Array of search results
   * @throws Error if the request fails
   */
  async searchTickers(query: string, limit: number = 10, signal?: AbortSignal): Promise<SearchResult[]> {
    if (query.length < 2) {
      return []
    }

    try {
      const response = await this.apiClient.get<SearchResponse>(
        '/api/search/tickers',
        { q: query, limit },
        signal
      )

      return response.results
    } catch (error) {
      // Don't log abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      console.error('Error searching tickers:', error)
      throw error
    }
  }
}

/**
 * Create a search service instance with the provided API client
 */
export function createSearchService(apiClient: ApiClient): SearchService {
  return new SearchService(apiClient)
}

