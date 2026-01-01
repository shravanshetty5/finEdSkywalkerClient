import { useAuth } from "@/contexts/AuthContext";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// API Response Types
interface MetricItem {
  current: number;
  rating: string;
  message: string;
  available: boolean;
}

interface FundamentalScorecard {
  pe_ratio: MetricItem;
  forward_pe: MetricItem;
  debt_to_equity: MetricItem;
  fcf_yield: MetricItem;
  peg_ratio: MetricItem;
  roe: MetricItem;
  overall_score: string;
  summary: string;
}

interface ValuationAssumptions {
  revenue_growth_rate: number;
  profit_margin: number;
  fcf_margin: number;
  discount_rate: number;
  terminal_growth_rate: number;
  projection_years: number;
  source: string;
}

interface Projection {
  year: number;
  revenue: number;
  net_income: number;
  free_cash_flow: number;
  discount_factor: number;
  present_value: number;
}

interface Valuation {
  fair_value_per_share: number;
  current_price: number;
  upside_percent: number;
  model: string;
  assumptions: ValuationAssumptions;
  projections: Projection[];
  terminal_value: number;
  enterprise_value: number;
  shares_outstanding: number;
}

interface DataFreshness {
  fundamentals: string;
  price: string;
}

interface StockMetricsAPIResponse {
  ticker: string;
  company_name: string;
  current_price: number;
  last_updated: string;
  fundamental_scorecard: FundamentalScorecard;
  valuation: Valuation;
  data_freshness: DataFreshness;
}

// UI State Type
interface StockMetricsUIState {
  ticker: string;
  companyName: string;
  currentPrice: number;
  lastUpdated: string;
  // Fundamental Scorecard
  peRatio: number | null;
  peRating: string;
  peMessage: string;
  debtToEquity: number | null;
  debtRating: string;
  debtMessage: string;
  fcfYield: number | null;
  fcfRating: string;
  fcfMessage: string;
  pegRatio: number | null;
  pegRating: string;
  pegMessage: string;
  roe: number | null;
  roeRating: string;
  roeMessage: string;
  overallScore: string;
  summary: string;
  // Valuation
  fairValuePerShare: number;
  valuationUpside: number;
  valuationModel: string;
  // Data Freshness
  fundamentalsDate: string;
  priceStatus: string;
}

/**
 * Marshalling function to map API response to UI state
 */
function mapAPIResponseToUIState(
  apiResponse: StockMetricsAPIResponse
): StockMetricsUIState {
  const { fundamental_scorecard, valuation, data_freshness } = apiResponse;

  return {
    ticker: apiResponse.ticker,
    companyName: apiResponse.company_name,
    currentPrice: apiResponse.current_price,
    lastUpdated: apiResponse.last_updated,
    // Fundamental Scorecard
    peRatio: fundamental_scorecard.pe_ratio.available
      ? fundamental_scorecard.pe_ratio.current
      : null,
    peRating: fundamental_scorecard.pe_ratio.rating,
    peMessage: fundamental_scorecard.pe_ratio.message,
    debtToEquity: fundamental_scorecard.debt_to_equity.available
      ? fundamental_scorecard.debt_to_equity.current
      : null,
    debtRating: fundamental_scorecard.debt_to_equity.rating,
    debtMessage: fundamental_scorecard.debt_to_equity.message,
    fcfYield: fundamental_scorecard.fcf_yield.available
      ? fundamental_scorecard.fcf_yield.current
      : null,
    fcfRating: fundamental_scorecard.fcf_yield.rating,
    fcfMessage: fundamental_scorecard.fcf_yield.message,
    pegRatio: fundamental_scorecard.peg_ratio.available
      ? fundamental_scorecard.peg_ratio.current
      : null,
    pegRating: fundamental_scorecard.peg_ratio.rating,
    pegMessage: fundamental_scorecard.peg_ratio.message,
    roe: fundamental_scorecard.roe.available
      ? fundamental_scorecard.roe.current
      : null,
    roeRating: fundamental_scorecard.roe.rating,
    roeMessage: fundamental_scorecard.roe.message,
    overallScore: fundamental_scorecard.overall_score,
    summary: fundamental_scorecard.summary,
    // Valuation
    fairValuePerShare: valuation.fair_value_per_share,
    valuationUpside: valuation.upside_percent,
    valuationModel: valuation.model,
    // Data Freshness
    fundamentalsDate: data_freshness.fundamentals,
    priceStatus: data_freshness.price,
  };
}

export default function TickerDetails() {
  const router = useRouter();
  const { ticker } = router.query;
  const { token } = useAuth();

  const [metrics, setMetrics] = useState<StockMetricsUIState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert ticker to uppercase string
  const tickerSymbol =
    typeof ticker === "string"
      ? ticker.toUpperCase()
      : ticker?.[0]?.toUpperCase();

  // Fetch stock metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!tickerSymbol || !token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("API URL is not configured");
        }

        const response = await fetch(
          `${apiUrl}/api/stocks/${tickerSymbol}/metrics`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to fetch metrics: ${response.statusText}`
          );
        }

        const apiData: StockMetricsAPIResponse = await response.json();
        const uiState = mapAPIResponseToUIState(apiData);
        setMetrics(uiState);
      } catch (err) {
        console.error("Error fetching stock metrics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load stock data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (router.isReady && tickerSymbol) {
      fetchMetrics();
    }
  }, [tickerSymbol, token, router]);

  // Show loading state while router is ready or data is loading
  if (!router.isReady || isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Format numbers
  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatCurrency = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null) return "N/A";
    return `$${formatNumber(num, decimals)}`;
  };

  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "N/A";
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${formatNumber(num, 0)}`;
  };

  const formatPercent = (num: number | undefined | null, decimals = 2) => {
    if (num === undefined || num === null) return "N/A";
    return `${num >= 0 ? "+" : ""}${num.toFixed(decimals)}%`;
  };

  // Get rating color
  const getRatingColor = (rating: string) => {
    switch (rating.toUpperCase()) {
      case "GREEN":
        return "success.main";
      case "YELLOW":
        return "warning.main";
      case "RED":
        return "error.main";
      default:
        return "text.secondary";
    }
  };

  const isValuationPositive =
    metrics?.valuationUpside && metrics.valuationUpside >= 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <AssessmentIcon sx={{ fontSize: 48, color: "white" }} />
          <Box flex={1}>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontWeight: "bold", color: "white", mb: 1 }}
            >
              {tickerSymbol}
            </Typography>
            <Typography variant="h6" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
              {metrics?.companyName || "Loading..."}
            </Typography>
          </Box>
          {metrics && (
            <Box textAlign="right">
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "white" }}
              >
                {formatCurrency(metrics.currentPrice)}
              </Typography>
              <Chip
                label={metrics.priceStatus}
                sx={{
                  mt: 1,
                  backgroundColor: "rgba(76, 175, 80, 0.9)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stock Metrics */}
      {metrics && (
        <>
          {/* Overall Summary */}
          <Alert
            severity={
              metrics.summary.includes("Concerning")
                ? "error"
                : metrics.summary.includes("Caution")
                ? "warning"
                : "success"
            }
            sx={{ mb: 3 }}
          >
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              {metrics.overallScore}
            </Typography>
            <Typography variant="body2">{metrics.summary}</Typography>
          </Alert>

          {/* Valuation Section */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Valuation ({metrics.valuationModel} Model)
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 3,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Price
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {formatCurrency(metrics.currentPrice)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Fair Value
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={isValuationPositive ? "success.main" : "error.main"}
                >
                  {formatCurrency(metrics.fairValuePerShare)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upside/Downside
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={isValuationPositive ? "success.main" : "error.main"}
                >
                  {formatPercent(metrics.valuationUpside)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Fundamental Scorecard */}
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 3 }}
            >
              Fundamental Scorecard
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* P/E Ratio */}
              <Box
                sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body1" fontWeight="bold">
                    P/E Ratio
                  </Typography>
                  <Chip
                    label={metrics.peRating}
                    size="small"
                    sx={{
                      bgcolor: getRatingColor(metrics.peRating),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" mb={0.5}>
                  {metrics.peRatio !== null
                    ? formatNumber(metrics.peRatio)
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.peMessage}
                </Typography>
              </Box>

              {/* ROE */}
              <Box
                sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body1" fontWeight="bold">
                    Return on Equity (ROE)
                  </Typography>
                  <Chip
                    label={metrics.roeRating}
                    size="small"
                    sx={{
                      bgcolor: getRatingColor(metrics.roeRating),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" mb={0.5}>
                  {metrics.roe !== null
                    ? `${formatNumber(metrics.roe)}%`
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.roeMessage}
                </Typography>
              </Box>

              {/* Debt to Equity */}
              <Box
                sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body1" fontWeight="bold">
                    Debt to Equity
                  </Typography>
                  <Chip
                    label={metrics.debtRating}
                    size="small"
                    sx={{
                      bgcolor: getRatingColor(metrics.debtRating),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" mb={0.5}>
                  {metrics.debtToEquity !== null
                    ? formatNumber(metrics.debtToEquity)
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.debtMessage}
                </Typography>
              </Box>

              {/* FCF Yield */}
              <Box
                sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body1" fontWeight="bold">
                    Free Cash Flow Yield
                  </Typography>
                  <Chip
                    label={metrics.fcfRating}
                    size="small"
                    sx={{
                      bgcolor: getRatingColor(metrics.fcfRating),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" mb={0.5}>
                  {metrics.fcfYield !== null
                    ? `${formatNumber(metrics.fcfYield)}%`
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.fcfMessage}
                </Typography>
              </Box>

              {/* PEG Ratio */}
              <Box
                sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body1" fontWeight="bold">
                    PEG Ratio
                  </Typography>
                  <Chip
                    label={metrics.pegRating}
                    size="small"
                    sx={{
                      bgcolor: getRatingColor(metrics.pegRating),
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" mb={0.5}>
                  {metrics.pegRatio !== null
                    ? formatNumber(metrics.pegRatio)
                    : "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.pegMessage}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Data Freshness */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Data Freshness:</strong> Fundamentals as of{" "}
              {metrics.fundamentalsDate} | Price: {metrics.priceStatus}
            </Typography>
          </Alert>
        </>
      )}

      {/* No data placeholder */}
      {!metrics && !error && !isLoading && (
        <Paper elevation={1} sx={{ p: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            No Data Available
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Unable to load stock metrics for <strong>{tickerSymbol}</strong>.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
