'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Container,
  Heading,
  Input,
  VStack,
  Text,
  Spinner,
} from '@chakra-ui/react'
import { useAuth } from '@/contexts/AuthContext'
import { ApiClient } from '@/lib/apiClient'
import { createSearchService } from '@/services/searchService'
import { SearchResult } from '@/types/search'
import { debounce } from '@/utils/debounce'
import { useRouter } from 'next/navigation'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  
  const { token } = useAuth()
  const router = useRouter()

  // Create API client and search service
  const searchService = useMemo(() => {
    const apiClient = new ApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
      token: token || undefined,
      onUnauthorized: () => {
        router.push('/login')
      },
    })
    return createSearchService(apiClient)
  }, [token, router])

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const searchResults = await searchService.searchTickers(
        searchQuery, 
        10, 
        abortController.signal
      )
      
      // Only update state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setResults(searchResults)
        setShowResults(true)
      }
    } catch (err) {
      // Ignore abort errors (they're expected when cancelling)
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      
      // Only show error if this request wasn't aborted
      if (!abortController.signal.aborted) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to search'
        setErrorMessage(errorMsg)
        setResults([])
      }
    } finally {
      // Only update loading state and clear ref if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false)
        // Clear the ref since this request completed
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null
        }
      }
    }
  }, [searchService])

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      performSearch(searchQuery)
    }, 300),
    [performSearch]
  )

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    if (value.length >= 2) {
      debouncedSearch(value)
    } else {
      setResults([])
      setShowResults(false)
      setErrorMessage(null)
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    // Navigate to the ticker detail page
    router.push(`/ticker/${result.ticker}`)
  }

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-search-container]')) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={2} color="gray.800">
            Stock Search
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Search for stocks by ticker symbol or company name
          </Text>
        </Box>

        <Box position="relative" data-search-container>
          <Box position="relative">
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              pointerEvents="none"
              zIndex={1}
            >
              <Text fontSize="xl" color="gray.400">🔍</Text>
            </Box>
            <Input
              placeholder="Enter ticker or company name (min 2 characters)..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => {
                if (results.length > 0 && !errorMessage) {
                  setShowResults(true)
                }
              }}
              autoComplete="off"
              bg="white"
              borderWidth={2}
              borderColor="gray.300"
              size="lg"
              pl={10}
              fontSize="md"
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                outline: 'none',
              }}
              _hover={{
                borderColor: 'gray.400',
              }}
            />
          </Box>

          {/* Loading indicator */}
          {isLoading && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              p={4}
              bg="white"
              borderWidth={1}
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="lg"
              zIndex={10}
            >
              <VStack gap={2}>
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm" color="gray.600">
                  Searching...
                </Text>
              </VStack>
            </Box>
          )}

          {/* Error message */}
          {errorMessage && !isLoading && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              p={4}
              bg="red.50"
              borderWidth={1}
              borderColor="red.200"
              borderRadius="md"
              boxShadow="lg"
              zIndex={10}
            >
              <Text fontSize="sm" color="red.700" textAlign="center">
                {errorMessage}
              </Text>
            </Box>
          )}

          {/* Results dropdown */}
          {showResults && !isLoading && !errorMessage && results.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              bg="white"
              borderWidth={1}
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="xl"
              maxH="400px"
              overflowY="auto"
              zIndex={10}
            >
              {results.map((result, index) => (
                <Box
                  key={`${result.ticker}-${index}`}
                  px={4}
                  py={3}
                  cursor="pointer"
                  borderBottomWidth={index < results.length - 1 ? 1 : 0}
                  borderBottomColor="gray.100"
                  _hover={{
                    bg: 'blue.50',
                  }}
                  onClick={() => handleResultClick(result)}
                  transition="background 0.15s ease"
                >
                  <Text fontWeight="bold" fontSize="md" color="blue.600">
                    {result.ticker}
                  </Text>
                  <Text fontSize="sm" color="gray.700" mt={1}>
                    {result.company_name}
                  </Text>
                </Box>
              ))}
            </Box>
          )}

          {/* No results message */}
          {showResults && !isLoading && !errorMessage && results.length === 0 && query.length >= 2 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              p={4}
              bg="white"
              borderWidth={1}
              borderColor="gray.200"
              borderRadius="md"
              boxShadow="lg"
              zIndex={10}
            >
              <Text fontSize="sm" color="gray.600" textAlign="center">
                No results found for &quot;{query}&quot;
              </Text>
            </Box>
          )}
        </Box>

        {/* Help text */}
        <Box
          p={4}
          bg="blue.50"
          borderRadius="md"
          borderLeftWidth={4}
          borderLeftColor="blue.500"
        >
          <Text fontSize="sm" color="gray.700">
            <Text as="span" fontWeight="bold">Tip:</Text> Start typing at least 2 characters to see search results.
            Click on a result to select it. Selected tickers will be logged to the console.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}
