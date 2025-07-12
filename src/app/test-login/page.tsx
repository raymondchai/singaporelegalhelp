'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Lock, AlertCircle, CheckCircle } from 'lucide-react'

export default function TestLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPassword, setCustomPassword] = useState('')

  const adminAccounts = [
    {
      email: 'raymond.chai@8atoms.com',
      name: 'Raymond Chai',
      role: 'Super Admin'
    },
    {
      email: '8thrives@gmail.com',
      name: 'Admin User',
      role: 'Super Admin'
    }
  ]

  const loginWithCredentials = async (email: string, password: string, accountName?: string) => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('TEST LOGIN: Attempting login for:', email)

      // Clear any existing session first
      await supabase.auth.signOut()

      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))

      // Test using API endpoint first for better debugging
      console.log('TEST LOGIN: Testing via API endpoint...')
      const apiResponse = await fetch('/api/test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const apiResult = await apiResponse.json()
      console.log('TEST LOGIN: API result:', apiResult)

      if (!apiResult.success) {
        throw new Error(`API Test failed: ${apiResult.error}`)
      }

      // Now try direct client authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })

      console.log('TEST LOGIN: Direct client result:', { data, error: signInError })

      if (signInError) {
        throw new Error(`Direct login failed: ${signInError.message}`)
      }

      if (!data.user) {
        throw new Error('No user data returned from direct login')
      }

      console.log('TEST LOGIN: User authenticated:', data.user.email)

      // Verify session is established
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      console.log('TEST LOGIN: Session check:', {
        hasSession: !!sessionData.session,
        hasUser: !!sessionData.session?.user,
        error: sessionError
      })

      if (sessionError || !sessionData.session) {
        throw new Error('Session not properly established')
      }

      setMessage(`✅ Successfully logged in as ${accountName || email}`)

      // Redirect after short delay
      setTimeout(() => {
        console.log('TEST LOGIN: Redirecting to dashboard')
        router.push('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('TEST LOGIN ERROR:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const loginAsAdmin = (email: string, name: string) => {
    loginWithCredentials(email, 'Welcome@123++', name)
  }

  const loginWithCustom = () => {
    if (!customEmail || !customPassword) {
      setError('Please enter both email and password')
      return
    }
    loginWithCredentials(customEmail, customPassword)
  }

  const testAuthState = async () => {
    try {
      console.log('AUTH STATE TEST: Checking current auth state')
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      console.log('AUTH STATE TEST: Session result:', {
        hasSession: !!sessionData.session,
        hasUser: !!sessionData.session?.user,
        userEmail: sessionData.session?.user?.email,
        error: sessionError
      })

      if (sessionData.session?.user) {
        setMessage(`✅ Already logged in as: ${sessionData.session.user.email}`)
      } else {
        setMessage('❌ No active session found')
      }
    } catch (error: any) {
      console.error('AUTH STATE TEST ERROR:', error)
      setError(`Auth state check failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Test Login</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quick access for testing and development
          </p>
        </div>

        {/* Admin Quick Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Admin Quick Login
            </CardTitle>
            <CardDescription>
              Login with pre-configured admin accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminAccounts.map((account, index) => (
              <Button
                key={index}
                onClick={() => loginAsAdmin(account.email, account.name)}
                disabled={loading}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm text-gray-500">{account.email}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Custom Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Custom Login
            </CardTitle>
            <CardDescription>
              Login with any email/password combination
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button
              onClick={loginWithCustom}
              disabled={loading}
              className="w-full"
            >
              Login with Custom Credentials
            </Button>
          </CardContent>
        </Card>

        {/* Auth State Test */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={testAuthState}
              variant="secondary"
              className="w-full"
            >
              Check Current Auth State
            </Button>
          </CardContent>
        </Card>

        {/* Messages */}
        {message && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Authenticating...</p>
          </div>
        )}

        {/* Development Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🔧 Development Tool - Not for Production</p>
          <p>Admin Password: Welcome@123++</p>
          <p>Navigate to <code>/dashboard</code> after login</p>
        </div>
      </div>
    </div>
  )
}
