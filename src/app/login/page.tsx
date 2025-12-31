'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface LoginResponse {
  token: string
  username: string
  message: string
}

interface ErrorResponse {
  error: string
  message: string
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiUrl) {
        throw new Error('API URL is not configured')
      }

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorData = data as ErrorResponse
        throw new Error(errorData.message || 'Login failed')
      }

      const loginData = data as LoginResponse
      
      // Store token in auth context
      login(loginData.token, loginData.username)

      // Redirect to search page
      router.push('/search')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col justify-center items-center min-h-screen p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700">
      <div className="w-full max-w-md">
        <div className="bg-white/95 rounded-xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Sign in to finEdSkywalker
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 text-sm">
            Stock Analysis Platform
          </p>
        </div>
      </div>
    </main>
  )
}

