'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { decodeJwt } from 'jose'

interface AuthContextType {
  token: string | null
  username: string | null
  login: (token: string, username: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to decode and validate JWT token
function isTokenValid(token: string): boolean {
  try {
    const decoded = decodeJwt(token)
    console.log('decoded', decoded)
    
    // Check if token has expiration claim
    if (!decoded.exp) {
      return false
    }
    
    // Convert exp (in seconds) to milliseconds and compare with current time
    const expirationTime = decoded.exp * 1000
    const currentTime = Date.now()
    console.log('expirationTime', expirationTime)
    console.log('currentTime', currentTime)
    
    return expirationTime > currentTime
  } catch (error) {
    // If token is malformed or can't be decoded, treat as invalid
    console.error('Error decoding token:', error)
    return false
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Load token from localStorage on mount and validate expiration
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUsername = localStorage.getItem('auth_username')
    
    if (storedToken && storedUsername) {
      // Check if token is valid and not expired
      if (isTokenValid(storedToken)) {
        setToken(storedToken)
        setUsername(storedUsername)
      } else {
        // Token is expired, clear storage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_username')
        
        // Redirect to login if not already there
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    }
    setIsLoaded(true)
  }, [router, pathname])

  // Save token to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      if (token && username) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_username', username)
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_username')
      }
    }
  }, [token, username, isLoaded])

  const login = (newToken: string, newUsername: string) => {
    setToken(newToken)
    setUsername(newUsername)
  }

  const logout = () => {
    setToken(null)
    setUsername(null)
  }

  const value = {
    token,
    username,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

