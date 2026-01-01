import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Redirect to search if logged in, otherwise to login
      if (isAuthenticated) {
        router.push('/search')
      } else {
        router.push('/login')
      }
    }
  }, [mounted, isAuthenticated, router])

  if (!mounted) {
    return null
  }

  return <div>loading...</div>
}

