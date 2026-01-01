/**
 * Represents a single search result for a stock ticker
 */
export interface SearchResult {
  ticker: string
  company_name: string
}

/**
 * API response structure for ticker search endpoint
 */
export interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
}

