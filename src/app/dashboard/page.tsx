// src/app/dashboard/page.tsx - Enhanced with Admin Redirect
'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  MessageCircle,
  Users,
  BarChart3,
  TrendingUp,
  Upload,
  Bookmark,
  Activity,
  Scale,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from './components/DashboardLayout'
import PersonalizedRecommendations from '@/components/dashboard/PersonalizedRecommendations'
import EnhancedUsageAnalytics from '@/components/dashboard/EnhancedUsageAnalytics'

// ADD ADMIN ACCESS HOOK - Enhanced functionality
interface AdminRole {
  role: 'super_admin' | 'admin' | 'support' | 'analytics';
  permissions: string[];
  is_active: boolean;
}

function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        setLoading(true);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setIsAdmin(false);
          setAdminRole(null);
          setLoading(false);
          return;
        }

        // Use API route for consistency with admin dashboard
        const response = await fetch('/api/admin/roles', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Admin roles API error:', response.status);
          setIsAdmin(false);
          setAdminRole(null);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.isAdmin && data.role) {
          setIsAdmin(true);
          setAdminRole({
            role: data.role,
            permissions: data.permissions || [],
            is_active: data.is_active
          });
        } else {
          setIsAdmin(false);
          setAdminRole(null);
        }

      } catch (err) {
        console.error('Admin access check error:', err);
        setIsAdmin(false);
        setAdminRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  return { isAdmin, adminRole, loading };
}

interface DashboardStats {
  totalDocuments: number
  chatSessions: number
  savedItems: number
  monthlyUsage: number
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // ADD ADMIN ACCESS CHECK
  const { isAdmin, loading: adminLoading } = useAdminAccess()


  
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    chatSessions: 0,
    savedItems: 0,
    monthlyUsage: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // ADMIN REDIRECT LOGIC
  useEffect(() => {
    if (!loading && !adminLoading && user && isAdmin) {
      console.log('Admin user detected, redirecting to admin dashboard')
      router.replace('/admin/dashboard')
      return
    }
  }, [loading, adminLoading, user, isAdmin, router])

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || isAdmin) return // Don't fetch stats if admin (will be redirected)

      try {
        setStatsLoading(true)
        setStatsError(null)
        console.log('Fetching dashboard stats for user:', user.id)

        // Get current session to ensure auth is properly set
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          return
        }

        if (!session) {
          console.error('No active session found')
          return
        }

        console.log('Active session found, proceeding with queries...')

        // Get auth token for API calls
        if (!session?.access_token) {
          console.error('No valid session for dashboard stats')
          return
        }

        // Use API routes instead of direct database queries
        // Fixed: Ensure no array indices are accidentally appended to URLs
        const statTypes = ['documents', 'chats', 'saved', 'activity'];
        const apiCalls = statTypes.map(statType => {
          const url = `/api/dashboard/stats?type=${statType}`;
          console.log(`🔍 Dashboard: Making API call to: ${url}`);
          return fetch(url, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
        });

        const [docResult, chatResult, savedResult, activityResult] = await Promise.allSettled(apiCalls);

        // Helper function to process API results
        const processApiResult = async (result: PromiseSettledResult<Response>): Promise<number> => {
          if (result.status === 'fulfilled' && result.value.ok) {
            try {
              const data = await result.value.json()
              return data.count ?? 0
            } catch (error) {
              console.error('Error parsing API response:', error)
              return 0
            }
          }
          return 0
        }

        // Process API responses
        const documentCount = await processApiResult(docResult)
        const chatCount = await processApiResult(chatResult)
        const savedCount = await processApiResult(savedResult)
        const activityCount = await processApiResult(activityResult)

        // Log any errors
        if (docResult.status === 'rejected' || (docResult.status === 'fulfilled' && !docResult.value.ok)) {
          console.error('Documents query error:', docResult.status === 'rejected' ? docResult.reason : 'API error')
        }
        if (chatResult.status === 'rejected' || (chatResult.status === 'fulfilled' && !chatResult.value.ok)) {
          console.error('Chat sessions query error:', chatResult.status === 'rejected' ? chatResult.reason : 'API error')
        }
        if (savedResult.status === 'rejected' || (savedResult.status === 'fulfilled' && !savedResult.value.ok)) {
          console.error('Saved content query error:', savedResult.status === 'rejected' ? savedResult.reason : 'API error')
        }
        if (activityResult.status === 'rejected' || (activityResult.status === 'fulfilled' && !activityResult.value.ok)) {
          console.error('Activity logs query error:', activityResult.status === 'rejected' ? activityResult.reason : 'API error')
        }

        console.log('Dashboard stats processed:', {
          documents: documentCount,
          chats: chatCount,
          saved: savedCount,
          activity: activityCount
        })

        setStats({
          totalDocuments: documentCount,
          chatSessions: chatCount,
          savedItems: savedCount,
          monthlyUsage: Math.min(Math.round((activityCount / 100) * 100), 100) // Convert to percentage
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setStatsError(error instanceof Error ? error.message : 'Failed to load dashboard data')
        // Set default stats on error
        setStats({
          totalDocuments: 0,
          chatSessions: 0,
          savedItems: 0,
          monthlyUsage: 0
        })
      } finally {
        setStatsLoading(false)
      }
    }

    if (user && !loading && !adminLoading && !isAdmin) {
      fetchDashboardStats()
    }
  }, [user, loading, adminLoading, isAdmin])

  // ENHANCED LOADING STATE
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">
            {adminLoading ? 'Checking access permissions...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // ADMIN REDIRECT UI
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Detected</h2>
          <p className="text-gray-600 mb-4">Redirecting to admin dashboard...</p>
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Upload and analyze legal documents',
      icon: Upload,
      href: '/dashboard/documents/upload',
      color: 'text-blue-600'
    },
    {
      title: 'Start Chat',
      description: 'Ask questions about Singapore law',
      icon: MessageCircle,
      href: '/dashboard/chat-history',
      color: 'text-green-600'
    },
    {
      title: 'Browse Content',
      description: 'Explore legal articles and resources',
      icon: Bookmark,
      href: '/dashboard/saved-content',
      color: 'text-purple-600'
    },
    {
      title: 'View Analytics',
      description: 'Track your usage and activity',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-orange-600'
    }
  ]

  const recentActivity = [
    { action: 'Uploaded contract.pdf', time: '2 hours ago', type: 'upload' },
    { action: 'Asked about employment law', time: '1 day ago', type: 'chat' },
    { action: 'Saved article on property rights', time: '2 days ago', type: 'save' },
    { action: 'Viewed analytics dashboard', time: '3 days ago', type: 'view' }
  ]

  return (
    <DashboardLayout
      title="My Dashboard"
      subtitle={`Welcome back, ${profile?.full_name || 'User'}! Here's what's happening with your account.`}
    >
      {/* Error Display */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">
            <strong>Error loading dashboard data:</strong> {statsError}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats.totalDocuments}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDocuments > 0 ? 'Documents uploaded' : 'No documents yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats.chatSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.chatSessions > 0 ? 'Conversations started' : 'No chats yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Items</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats.savedItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.savedItems > 0 ? 'Items bookmarked' : 'No saved items'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${stats.monthlyUsage}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              of activity this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="text-center">
                <action.icon className={`h-12 w-12 ${action.color} mx-auto mb-2`} />
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Enhanced Dashboard Components */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Personalized Recommendations */}
        <div className="lg:col-span-1">
          <PersonalizedRecommendations limit={4} />
        </div>

        {/* Enhanced Usage Analytics */}
        <div className="lg:col-span-2">
          <EnhancedUsageAnalytics />
        </div>
      </div>

      {/* Recent Activity & Account Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-900">{activity.action}</span>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium">{user?.email || 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Full Name:</span>
              <span className="text-sm font-medium">{profile?.full_name || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Account Type:</span>
              <span className="text-sm font-medium capitalize">{profile?.user_type || 'individual'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subscription:</span>
              <span className="text-sm font-medium capitalize">{profile?.subscription_status || 'free'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}