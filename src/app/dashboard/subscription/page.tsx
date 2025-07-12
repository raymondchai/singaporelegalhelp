'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  CreditCard,
  Receipt,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import SubscriptionDetails from '@/components/dashboard/SubscriptionDetails'
import BillingHistory from '@/components/dashboard/BillingHistory'
import PaymentMethods from '@/components/dashboard/PaymentMethods'
import UpgradeRecommendations from '@/components/dashboard/UpgradeRecommendations'
import { SubscriptionDetails as SubscriptionDetailsType } from '@/types/dashboard'
import { SubscriptionTier } from '@/lib/subscription-config'

export default function SubscriptionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [subscription, setSubscription] = useState<SubscriptionDetailsType | null>(null)
  const [usageAnalytics, setUsageAnalytics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadSubscriptionData()
    }
  }, [user])

  const loadSubscriptionData = async () => {
    try {
      setLoadingData(true)

      const [subscriptionRes, analyticsRes] = await Promise.all([
        fetch('/api/subscription/current'),
        fetch('/api/dashboard/analytics?type=usage&timeRange=30d')
      ])

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json()
        setSubscription(subscriptionData.subscription)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setUsageAnalytics(analyticsData.data)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive'
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      const response = await fetch('/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          newTier: tier,
          newBillingCycle: subscription?.billingCycle || 'monthly'
        })
      })

      if (response.ok) {
        await loadSubscriptionData()
        toast({
          title: 'Upgrade Successful',
          description: `Successfully upgraded to ${tier} plan`
        })
      } else {
        throw new Error('Upgrade failed')
      }
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: 'Failed to upgrade subscription. Please try again.',
        variant: 'destructive'
      })
      throw error
    }
  }

  const handleManagePayment = () => {
    setActiveTab('payment-methods')
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      return
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })

      if (response.ok) {
        await loadSubscriptionData()
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.'
        })
      }
    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: 'Failed to cancel subscription. Please contact support.',
        variant: 'destructive'
      })
    }
  }

  const handlePaymentMethodUpdate = () => {
    // Refresh subscription data when payment methods are updated
    loadSubscriptionData()
  }

  if (loading || loadingData) {
    return (
      <DashboardLayout title="Subscription & Billing" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!subscription) {
    return (
      <DashboardLayout title="Subscription & Billing" subtitle="Subscription not found">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Not Found</h3>
          <p className="text-gray-500 mb-4">
            We couldn't find your subscription information. Please contact support if this issue persists.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Subscription & Billing"
      subtitle="Manage your subscription, billing, and payment methods"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Billing History
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="upgrade" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Upgrade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <SubscriptionDetails
            subscription={subscription}
            onUpgrade={handleUpgrade}
            onManagePayment={handleManagePayment}
            onCancelSubscription={handleCancelSubscription}
          />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <BillingHistory subscription={subscription} />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethods
            subscription={subscription}
            onPaymentMethodUpdate={handlePaymentMethodUpdate}
          />
        </TabsContent>

        <TabsContent value="upgrade" className="mt-6">
          <UpgradeRecommendations
            subscription={subscription}
            usageAnalytics={usageAnalytics}
            onUpgrade={handleUpgrade}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
