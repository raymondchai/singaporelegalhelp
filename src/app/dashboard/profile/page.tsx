'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Shield,
  Bell,
  Building,
  CreditCard,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAdminAccess } from '@/hooks/useAdminAccess'
import DashboardLayout from '../components/DashboardLayout'

// Import profile components
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab'
import { SecurityTab } from '@/components/profile/SecurityTab'
import { NotificationsTab } from '@/components/profile/NotificationsTab'
import { BusinessInfoTab } from '@/components/profile/BusinessInfoTab'
import { SubscriptionTab } from '@/components/profile/SubscriptionTab'
import { ComplianceTab } from '@/components/profile/ComplianceTab'

interface UserProfile {
  id: string
  email: string
  full_name: string
  display_name?: string
  phone_number?: string
  user_type: 'individual' | 'business' | 'law_firm' | 'corporate'
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise'
  singapore_validation_status: 'pending' | 'verified' | 'failed' | 'expired'
  singapore_nric?: string
  singapore_uen?: string
  company_name?: string
  industry_sector?: string
  address_street?: string
  address_postal_code?: string
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin, adminRole } = useAdminAccess()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        setProfileLoading(true)

        // Get session for access token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Fetch enhanced user profile
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const profileData = await response.json()
        setUserProfile(profileData)
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profile information',
          variant: 'destructive',
        })
      } finally {
        setProfileLoading(false)
      }
    }

    if (user && !loading) {
      fetchUserProfile()
    }
  }, [user, loading, toast])

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        )
    }
  }

  const getSubscriptionBadge = (tier: string, userType?: string) => {
    // Check if user is admin
    const isUserAdmin = isAdmin || userType === 'admin'

    if (isUserAdmin) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <Shield className="h-3 w-3 mr-1" />
          Administrator
        </Badge>
      )
    }

    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-gold-100 text-gold-800',
    }

    return (
      <Badge className={colors[tier as keyof typeof colors] || colors.free}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    )
  }

  if (loading || profileLoading) {
    return (
      <DashboardLayout title="Profile" subtitle="Loading your profile information...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user || !userProfile) {
    return (
      <DashboardLayout title="Profile" subtitle="Profile not found">
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load profile information.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Profile Settings"
      subtitle="Manage your account information and preferences"
    >
      {/* Profile Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verification</span>
                {getVerificationStatusBadge(userProfile.singapore_validation_status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{isAdmin ? 'Access Level' : 'Subscription'}</span>
                {getSubscriptionBadge(userProfile.subscription_tier, userProfile.user_type)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">2FA</span>
                <Badge variant={userProfile.two_factor_enabled ? "default" : "outline"}>
                  {userProfile.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {isAdmin ? (
                  <>
                    <Shield className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">System Administrator</span>
                  </>
                ) : (
                  <>
                    {userProfile.user_type === 'individual' && <User className="h-4 w-4" />}
                    {userProfile.user_type !== 'individual' && <Building className="h-4 w-4" />}
                    <span className="font-medium capitalize">{userProfile.user_type.replace('_', ' ')}</span>
                  </>
                )}
              </div>
              {isAdmin && (
                <p className="text-sm text-red-700">
                  {adminRole?.role === 'super_admin' ? 'Super Admin' : 'Admin'} • Full Platform Access
                </p>
              )}
              {!isAdmin && userProfile.company_name && (
                <p className="text-sm text-gray-600">{userProfile.company_name}</p>
              )}
              {!isAdmin && userProfile.industry_sector && (
                <p className="text-sm text-gray-500">{userProfile.industry_sector}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing & Plans
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
          <CardDescription>
            Update your personal information, security settings, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <PersonalInfoTab userProfile={userProfile} onUpdate={(profile: any) => setUserProfile(profile)} />
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <SecurityTab userProfile={userProfile as any} onUpdate={(profile: any) => setUserProfile(profile)} />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationsTab userProfile={userProfile as any} onUpdate={(profile: any) => setUserProfile(profile)} />
            </TabsContent>

            <TabsContent value="business" className="mt-6">
              <BusinessInfoTab userProfile={userProfile as any} onUpdate={(profile: any) => setUserProfile(profile)} />
            </TabsContent>

            <TabsContent value="subscription" className="mt-6">
              <SubscriptionTab userProfile={userProfile as any} onUpdate={(profile: any) => setUserProfile(profile)} />
            </TabsContent>

            <TabsContent value="compliance" className="mt-6">
              <ComplianceTab userProfile={userProfile as any} onUpdate={(profile: any) => setUserProfile(profile)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
