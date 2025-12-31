import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'finEdSkywalker - Stock Analysis Platform',
  description: 'Comprehensive stock analysis and financial education platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

