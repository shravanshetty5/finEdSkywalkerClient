'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      router.push('/login')
    }
  }, [mounted, router])

  if (!mounted) {
    return null
  }

  return <div>Redirecting to login...</div>
}

