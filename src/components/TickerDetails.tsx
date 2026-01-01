import React from 'react'
import { useRouter } from 'next/router'
import { Container, Typography, Box, Paper, CircularProgress } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

export default function TickerDetails() {
  const router = useRouter()
  const { ticker } = router.query

  // Show loading state while router is ready
  if (!router.isReady || !ticker) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  // Convert ticker to uppercase string
  const tickerSymbol = typeof ticker === 'string' ? ticker.toUpperCase() : ticker[0].toUpperCase()

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TrendingUpIcon sx={{ fontSize: 48, color: 'white' }} />
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
              {tickerSymbol}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Stock Analysis & Details
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Placeholder Content */}
      <Paper elevation={1} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This page will contain comprehensive analysis for <strong>{tickerSymbol}</strong>, including:
        </Typography>
        <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
          <li>
            <Typography variant="body1" paragraph>
              Real-time stock price and charts
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Financial metrics and ratios
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Company information and profile
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              News and sentiment analysis
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Historical performance data
            </Typography>
          </li>
        </Box>
      </Paper>
    </Container>
  )
}

