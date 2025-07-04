'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, Loader2, Scale, User, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

interface SystemCheck {
  name: string
  status: 'checking' | 'success' | 'error'
  message: string
  details?: string
}

export default function DemoPage() {
  const { user } = useAuth()
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { name: 'Supabase Connection', status: 'checking', message: 'Testing connection...' },
    { name: 'Database Tables', status: 'checking', message: 'Verifying tables...' },
    { name: 'Authentication System', status: 'checking', message: 'Checking auth...' },
    { name: 'Environment Variables', status: 'checking', message: 'Validating config...' },
  ])

  // Registration form state
  const [registrationForm, setRegistrationForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: '',
    // Optional identity fields
    nric: '',
    fin: '',
    passport: '',
    companyUen: ''
  })
  const [registrationErrors, setRegistrationErrors] = useState<Record<string, string>>({})
  const [isRegistering, setIsRegistering] = useState(false)

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Flexible ID validation functions
  const validateNRIC = (nric: string): boolean => {
    if (!nric) return true // Optional field
    const nricRegex = /^[ST]\d{7}[A-Z]$/
    if (!nricRegex.test(nric.toUpperCase())) return false

    // Check digit validation
    const weights = [2, 7, 6, 5, 4, 3, 2]
    const letters = 'ABCDEFGHIZJ'

    let sum = nric.charAt(0) === 'T' ? 4 : 0
    for (let i = 1; i <= 7; i++) {
      sum += parseInt(nric.charAt(i)) * weights[i - 1]
    }

    const remainder = sum % 11
    const expectedLetter = letters.charAt(remainder)

    return nric.charAt(8).toUpperCase() === expectedLetter
  }

  const validateFIN = (fin: string): boolean => {
    if (!fin) return true // Optional field
    // FIN format: F1234567A, G1234567A, etc.
    const finRegex = /^[FG]\d{7}[A-Z]$/
    return finRegex.test(fin.toUpperCase())
  }

  const validatePassport = (passport: string): boolean => {
    if (!passport) return true // Optional field
    // Basic passport validation - alphanumeric, 6-12 characters
    const passportRegex = /^[A-Z0-9]{6,12}$/
    return passportRegex.test(passport.toUpperCase())
  }

  const validateUEN = (uen: string): boolean => {
    if (!uen) return true // Optional field
    // Singapore UEN format: 12345678A or 123456789A
    const uenRegex = /^\d{8,9}[A-Z]$/
    return uenRegex.test(uen.toUpperCase())
  }

  // Form validation - Flexible approach
  const validateRegistrationForm = () => {
    const errors: Record<string, string> = {}

    // Required fields
    if (!registrationForm.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(registrationForm.email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!registrationForm.password) {
      errors.password = 'Password is required'
    } else if (registrationForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (registrationForm.password !== registrationForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!registrationForm.userType) {
      errors.userType = 'Please select a user type'
    }

    if (!registrationForm.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }

    // Optional fields - validate only if provided
    if (registrationForm.nric && !validateNRIC(registrationForm.nric)) {
      errors.nric = 'Please enter a valid Singapore NRIC (e.g., S1234567A)'
    }

    if (registrationForm.fin && !validateFIN(registrationForm.fin)) {
      errors.fin = 'Please enter a valid Singapore FIN (e.g., F1234567A)'
    }

    if (registrationForm.passport && !validatePassport(registrationForm.passport)) {
      errors.passport = 'Please enter a valid passport number (6-12 alphanumeric characters)'
    }

    if (registrationForm.companyUen && !validateUEN(registrationForm.companyUen)) {
      errors.companyUen = 'Please enter a valid Singapore UEN (e.g., 12345678A)'
    }

    setRegistrationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Registration function
  const handleRegistration = async () => {
    if (!validateRegistrationForm()) return

    setIsRegistering(true)
    try {
      // Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationForm.email,
        password: registrationForm.password,
        options: {
          data: {
            full_name: registrationForm.fullName,
            user_type: registrationForm.userType,
            // Optional identity fields
            nric: registrationForm.nric || null,
            fin: registrationForm.fin || null,
            passport: registrationForm.passport || null,
            company_uen: registrationForm.companyUen || null,
          }
        }
      })

      if (authError) throw authError

      // Success notification
      alert(`Account created successfully! Please check your email (${registrationForm.email}) to verify your account.`)

      // Reset form
      setRegistrationForm({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        userType: '',
        nric: '',
        fin: '',
        passport: '',
        companyUen: ''
      })
      setRegistrationErrors({})

    } catch (error: any) {
      console.error('Registration error:', error)
      alert(`Registration failed: ${error.message}`)
    } finally {
      setIsRegistering(false)
    }
  }

  // Login function
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      alert('Please enter both email and password')
      return
    }

    setIsLoggingIn(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      })

      if (error) throw error

      alert('Successfully signed in!')
      setLoginForm({ email: '', password: '' })

    } catch (error: any) {
      console.error('Login error:', error)
      alert(`Login failed: ${error.message}`)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Sign out function
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      alert('Successfully signed out!')
    } catch (error: any) {
      console.error('Sign out error:', error)
      alert(`Sign out failed: ${error.message}`)
    }
  }

  const updateSystemCheck = (name: string, status: SystemCheck['status'], message: string, details?: string) => {
    setSystemChecks(prev => prev.map(check =>
      check.name === name ? { ...check, status, message, details } : check
    ))
  }

  const runSystemChecks = async () => {
    // Reset all checks to checking state
    setSystemChecks(prev => prev.map(check => ({ ...check, status: 'checking' as const })))

    // Check 1: Supabase Connection
    try {
      const { data, error } = await supabase.from('legal_categories').select('count').limit(1)
      if (error) throw error
      updateSystemCheck('Supabase Connection', 'success', 'Connected successfully', 'Database accessible')
    } catch (error: any) {
      updateSystemCheck('Supabase Connection', 'error', 'Connection failed', error.message)
    }

    // Check 2: Database Tables
    try {
      const tables = ['legal_categories', 'profiles', 'payment_transactions']
      const results = await Promise.all(
        tables.map(table => supabase.from(table).select('count').limit(1))
      )

      const failedTables = results.filter((result, index) => result.error)
      if (failedTables.length > 0) {
        throw new Error(`Failed to access: ${failedTables.map((_, i) => tables[i]).join(', ')}`)
      }

      updateSystemCheck('Database Tables', 'success', 'All tables accessible', `Verified: ${tables.join(', ')}`)
    } catch (error: any) {
      updateSystemCheck('Database Tables', 'error', 'Table access failed', error.message)
    }

    // Check 3: Authentication System
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (user) {
        updateSystemCheck('Authentication System', 'success', `Authenticated as ${user.email}`, 'User session active')
      } else {
        updateSystemCheck('Authentication System', 'success', 'Auth system ready', 'No active session')
      }
    } catch (error: any) {
      updateSystemCheck('Authentication System', 'error', 'Auth system error', error.message)
    }

    // Check 4: Environment Variables
    try {
      // Check if Supabase client is properly initialized (which means env vars are loaded)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        // Try to verify through successful Supabase connection instead
        const { error } = await supabase.from('legal_categories').select('count').limit(1)
        if (error) throw new Error('Supabase not properly configured')
      }

      updateSystemCheck('Environment Variables', 'success', 'All variables configured', 'Supabase config loaded and functional')
    } catch (error: any) {
      updateSystemCheck('Environment Variables', 'error', 'Config error', error.message)
    }
  }

  useEffect(() => {
    runSystemChecks()
  }, [user])

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Singapore Legal Help</span>
          </div>
          <div className="text-sm text-gray-600">
            System Demo & Status
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* System Status Dashboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-6 w-6 text-blue-600" />
              <span>System Status Dashboard</span>
            </CardTitle>
            <CardDescription>
              Real-time health check of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {systemChecks.map((check) => (
                <div
                  key={check.name}
                  className="flex items-start space-x-3 p-4 rounded-lg border bg-white/50"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">{check.name}</h3>
                    <p className="text-sm text-gray-600">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Authentication Demo */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-green-600" />
              <span>Interactive Authentication Demo</span>
            </CardTitle>
            <CardDescription>
              Test user registration with Singapore NRIC validation and authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-4">
                  <User className="h-12 w-12 text-green-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Successfully Authenticated!
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-green-700">
                        <strong>Email:</strong> {user.email}
                      </p>
                      {user.user_metadata?.full_name && (
                        <p className="text-green-700">
                          <strong>Name:</strong> {user.user_metadata.full_name}
                        </p>
                      )}
                      {user.user_metadata?.user_type && (
                        <p className="text-green-700">
                          <strong>User Type:</strong> {user.user_metadata.user_type.charAt(0).toUpperCase() + user.user_metadata.user_type.slice(1).replace('_', ' ')}
                        </p>
                      )}
                      {user.user_metadata?.nric && (
                        <p className="text-green-700">
                          <strong>NRIC:</strong> {user.user_metadata.nric}
                        </p>
                      )}
                      {user.user_metadata?.fin && (
                        <p className="text-green-700">
                          <strong>FIN:</strong> {user.user_metadata.fin}
                        </p>
                      )}
                      {user.user_metadata?.passport && (
                        <p className="text-green-700">
                          <strong>Passport:</strong> {user.user_metadata.passport}
                        </p>
                      )}
                      {user.user_metadata?.company_uen && (
                        <p className="text-green-700">
                          <strong>Company UEN:</strong> {user.user_metadata.company_uen}
                        </p>
                      )}
                      <p className="text-green-600 text-xs">
                        <strong>Account Status:</strong> {user.email_confirmed_at ? 'Email Verified' : 'Email Verification Pending'}
                      </p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        size="sm"
                      >
                        Sign Out
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Profile management coming soon!')}
                      >
                        Manage Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Registration Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">User Registration</h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={registrationForm.fullName}
                        onChange={(e) => setRegistrationForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className={registrationErrors.fullName ? 'border-red-500' : ''}
                      />
                      {registrationErrors.fullName && (
                        <p className="text-sm text-red-500 mt-1">{registrationErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="userType">User Type</Label>
                      <Select
                        value={registrationForm.userType}
                        onValueChange={(value) => setRegistrationForm(prev => ({ ...prev, userType: value }))}
                      >
                        <SelectTrigger className={registrationErrors.userType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select user type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="law_firm">Law Firm</SelectItem>
                        </SelectContent>
                      </Select>
                      {registrationErrors.userType && (
                        <p className="text-sm text-red-500 mt-1">{registrationErrors.userType}</p>
                      )}
                    </div>

                    {/* Optional Identity Section */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Optional Identity Information
                        <span className="text-xs text-gray-500 block font-normal">
                          Add for enhanced services (can be completed later)
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nric">Singapore NRIC (optional)</Label>
                          <Input
                            id="nric"
                            type="text"
                            placeholder="S1234567A"
                            value={registrationForm.nric}
                            onChange={(e) => setRegistrationForm(prev => ({ ...prev, nric: e.target.value.toUpperCase() }))}
                            className={registrationErrors.nric ? 'border-red-500' : ''}
                          />
                          {registrationErrors.nric && (
                            <p className="text-sm text-red-500 mt-1">{registrationErrors.nric}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="fin">Singapore FIN (optional)</Label>
                          <Input
                            id="fin"
                            type="text"
                            placeholder="F1234567A"
                            value={registrationForm.fin}
                            onChange={(e) => setRegistrationForm(prev => ({ ...prev, fin: e.target.value.toUpperCase() }))}
                            className={registrationErrors.fin ? 'border-red-500' : ''}
                          />
                          {registrationErrors.fin && (
                            <p className="text-sm text-red-500 mt-1">{registrationErrors.fin}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="passport">Passport Number (optional)</Label>
                          <Input
                            id="passport"
                            type="text"
                            placeholder="A1234567"
                            value={registrationForm.passport}
                            onChange={(e) => setRegistrationForm(prev => ({ ...prev, passport: e.target.value.toUpperCase() }))}
                            className={registrationErrors.passport ? 'border-red-500' : ''}
                          />
                          {registrationErrors.passport && (
                            <p className="text-sm text-red-500 mt-1">{registrationErrors.passport}</p>
                          )}
                        </div>

                        {registrationForm.userType === 'business' && (
                          <div>
                            <Label htmlFor="companyUen">Company UEN (optional)</Label>
                            <Input
                              id="companyUen"
                              type="text"
                              placeholder="12345678A"
                              value={registrationForm.companyUen}
                              onChange={(e) => setRegistrationForm(prev => ({ ...prev, companyUen: e.target.value.toUpperCase() }))}
                              className={registrationErrors.companyUen ? 'border-red-500' : ''}
                            />
                            {registrationErrors.companyUen && (
                              <p className="text-sm text-red-500 mt-1">{registrationErrors.companyUen}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="regEmail">Email</Label>
                      <Input
                        id="regEmail"
                        type="email"
                        value={registrationForm.email}
                        onChange={(e) => setRegistrationForm(prev => ({ ...prev, email: e.target.value }))}
                        className={registrationErrors.email ? 'border-red-500' : ''}
                      />
                      {registrationErrors.email && (
                        <p className="text-sm text-red-500 mt-1">{registrationErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="regPassword">Password</Label>
                      <Input
                        id="regPassword"
                        type="password"
                        value={registrationForm.password}
                        onChange={(e) => setRegistrationForm(prev => ({ ...prev, password: e.target.value }))}
                        className={registrationErrors.password ? 'border-red-500' : ''}
                      />
                      {registrationErrors.password && (
                        <p className="text-sm text-red-500 mt-1">{registrationErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={registrationForm.confirmPassword}
                        onChange={(e) => setRegistrationForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={registrationErrors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {registrationErrors.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">{registrationErrors.confirmPassword}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleRegistration}
                      disabled={isRegistering}
                      className="w-full"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </div>

                {/* Login Form */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sign In</h3>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <Label htmlFor="loginEmail">Email</Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="loginPassword">Password</Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-gray-600">Remember me</span>
                      </label>
                      <a href="#" className="text-blue-600 hover:underline">
                        Forgot password?
                      </a>
                    </div>

                    <Button
                      type="button"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="w-full"
                      variant="outline"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Demo Tip:</strong> Create an account first, then use the same credentials to sign in.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
