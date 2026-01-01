import { useAuth } from "@/contexts/AuthContext";
import { ApiClient } from "@/lib/apiClient";
import { createSearchService } from "@/services/searchService";
import { SearchResult } from "@/types/search";
import { debounce } from "@/utils/debounce";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Autocomplete,
  Box,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const { token } = useAuth();
  const router = useRouter();

  // Client-side only mounting check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create API client and search service
  const searchService = useMemo(() => {
    if (!mounted) return null;
    const apiClient = new ApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
      token: token || undefined,
      onUnauthorized: () => {
        router.push("/login");
      },
    });
    return createSearchService(apiClient);
  }, [token, router, mounted]);

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchService || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const searchResults = await searchService.searchTickers(
          searchQuery,
          10,
          abortController.signal
        );

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setResults(searchResults);
        }
      } catch (err) {
        // Ignore abort errors (they're expected when cancelling)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        // Only show error if this request wasn't aborted
        if (!abortController.signal.aborted) {
          const errorMsg =
            err instanceof Error ? err.message : "Failed to search";
          setErrorMessage(errorMsg);
          setResults([]);
        }
      } finally {
        // Only update loading state and clear ref if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
          // Clear the ref since this request completed
          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null;
          }
        }
      }
    },
    [searchService]
  );

  // Create debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        performSearch(searchQuery);
      }, 300),
    [performSearch]
  );

  // Handle input change
  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setQuery(value);

    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setErrorMessage(null);
    }
  };

  // Handle selection
  const handleChange = (
    _event: React.SyntheticEvent,
    value: string | SearchResult | null
  ) => {
    // Only handle SearchResult objects (not free text strings)
    if (value && typeof value !== "string") {
      // Navigate to the ticker detail page
      router.push(`/ticker/${value.ticker}`);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", color: "text.primary" }}
        >
          Stock Search
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Search for stocks by ticker symbol or company name
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Autocomplete
          freeSolo
          options={results}
          getOptionLabel={(option) => {
            // Handle both string (when typing) and SearchResult object (from options)
            if (typeof option === "string") return option;
            return `${option.ticker} - ${option.company_name}`;
          }}
          inputValue={query}
          onInputChange={handleInputChange}
          onChange={handleChange}
          loading={isLoading}
          noOptionsText={
            query.length < 2
              ? "Type at least 2 characters to search"
              : "No results found"
          }
          loadingText="Searching..."
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.ticker}>
              <Box>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {option.ticker}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.company_name}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Enter ticker or company name (min 2 characters)..."
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon color="action" sx={{ ml: 1, mr: -0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "background.paper",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey.400",
                    },
                  },
                  "&.Mui-focused": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />
          )}
          sx={{
            "& .MuiAutocomplete-listbox": {
              maxHeight: "400px",
            },
          }}
        />
      </Box>

      {/* Error message */}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Help text */}
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Tip:</strong> Start typing at least 2 characters to see search
          results. Click on a result to view ticker details.
        </Typography>
      </Alert>
    </Container>
  );
}
