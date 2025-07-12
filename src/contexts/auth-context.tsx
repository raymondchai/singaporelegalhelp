'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const fetchProfile = async (userId: string) => {
    try {
      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No valid session for profile fetch')
        return null
      }

      // Use API route instead of direct database query
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Profile API call failed:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      return data.profile // API returns { profile: {...} }
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  useEffect(() => {
    setMounted(true)

    const initializeAuth = async () => {
      try {
        // Get initial session with retry logic
        let session = null
        let sessionError = null

        for (let attempt = 1; attempt <= 3; attempt++) {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()

          if (error) {
            sessionError = error
            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
              continue
            }
          } else {
            session = currentSession
            sessionError = null
            break
          }
        }

        if (sessionError && !session) {
          console.error('AUTH: Failed to get session:', sessionError.message)
        }

        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } catch (profileError) {
            // Don't fail auth if profile fetch fails
            console.error('AUTH: Profile fetch failed:', profileError)
          }
        }

        setLoading(false)

      } catch (error) {
        console.error('AUTH: Unexpected error during initialization:', error)
        setLoading(false)
      }
    }

    // Initialize auth
    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } catch (error) {
          // Don't fail auth if profile fetch fails
          console.error('AUTH: Profile fetch failed on state change:', error)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  }), [user, profile, loading])

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null
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
