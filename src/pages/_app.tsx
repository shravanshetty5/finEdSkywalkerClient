import React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AuthProvider } from '@/contexts/AuthContext'
import '@/app/globals.css'

// Create a custom MUI theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
    },
    secondary: {
      main: '#8b5cf6', // Purple
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>finEdSkywalker - Stock Analysis Platform</title>
        <meta name="description" content="Comprehensive stock analysis and financial education platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </ThemeProvider>
    </>
  )
}
