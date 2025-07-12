'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Shield,
  Users,
  FileText,
  MessageSquare,
  Database,
  Crown,
  Star
} from 'lucide-react'
import { SubscriptionDetails as SubscriptionDetailsType } from '@/types/dashboard'
import { SubscriptionTier } from '@/lib/subscription-config'
import { useAuth } from '@/contexts/auth-context'

interface SubscriptionDetailsProps {
  subscription: SubscriptionDetailsType
  onUpgrade: (tier: SubscriptionTier) => void
  onManagePayment: () => void
  onCancelSubscription: () => void
}

export default function SubscriptionDetails({
  subscription,
  onUpgrade,
  onManagePayment,
  onCancelSubscription
}: SubscriptionDetailsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Shield className="h-5 w-5 text-gray-500" />
      case 'basic_individual':
        return <Zap className="h-5 w-5 text-blue-500" />
      case 'premium_individual':
        return <Star className="h-5 w-5 text-purple-500" />
      case 'professional':
        return <Users className="h-5 w-5 text-green-500" />
      case 'enterprise':
        return <Crown className="h-5 w-5 text-yellow-500" />
      default:
        return <Shield className="h-5 w-5 text-gray-500" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800'
      case 'basic_individual':
        return 'bg-blue-100 text-blue-800'
      case 'premium_individual':
        return 'bg-purple-100 text-purple-800'
      case 'professional':
        return 'bg-green-100 text-green-800'
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getDaysUntilRenewal = () => {
    const renewalDate = new Date(subscription.currentPeriodEnd)
    const today = new Date()
    const diffTime = renewalDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setLoading(true)
    try {
      await onUpgrade(tier)
      toast({
        title: 'Upgrade Initiated',
        description: 'Your subscription upgrade is being processed'
      })
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: 'Failed to initiate subscription upgrade',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const daysUntilRenewal = getDaysUntilRenewal()
  const isNearRenewal = daysUntilRenewal <= 7

  return (
    <div className="space-y-6">
      {/* Current Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTierIcon(subscription.tier)}
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Details */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getTierColor(subscription.tier)}>
                    {subscription.tier.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                </p>
              </div>

              {subscription.tier !== 'free' && (
                <div>
                  <p className="text-2xl font-bold">
                    S${subscription.billingCycle === 'monthly' ? '29' : '290'}
                    <span className="text-sm font-normal text-gray-500">
                      /{subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </p>
                  {subscription.billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600">Save 17% with annual billing</p>
                  )}
                </div>
              )}
            </div>

            {/* Billing Dates */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Current Period</p>
                <p className="text-sm text-gray-600">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {isNearRenewal ? 'Renews Soon' : 'Next Renewal'}
                  </p>
                  <p className={`text-sm ${isNearRenewal ? 'text-orange-600' : 'text-gray-600'}`}>
                    {daysUntilRenewal} days ({formatDate(subscription.currentPeriodEnd)})
                  </p>
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Subscription will cancel on {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              {subscription.tier === 'free' ? (
                <Button onClick={() => handleUpgrade('basic_individual')} className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              ) : (
                <>
                  <Button onClick={onManagePayment} variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Payment
                  </Button>
                  {!subscription.cancelAtPeriodEnd && (
                    <Button onClick={onCancelSubscription} variant="outline" className="w-full">
                      Cancel Subscription
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Documents */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Documents</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.usage.documents.used}/{subscription.usage.documents.limit === -1 ? '∞' : subscription.usage.documents.limit}
                </span>
              </div>
              <Progress 
                value={calculateUsagePercentage(subscription.usage.documents.used, subscription.usage.documents.limit)} 
                className="h-2"
              />
              <p className={`text-xs ${getUsageColor(calculateUsagePercentage(subscription.usage.documents.used, subscription.usage.documents.limit))}`}>
                {calculateUsagePercentage(subscription.usage.documents.used, subscription.usage.documents.limit).toFixed(0)}% used
              </p>
            </div>

            {/* AI Queries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">AI Queries</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.usage.aiQueries.used}/{subscription.usage.aiQueries.limit === -1 ? '∞' : subscription.usage.aiQueries.limit}
                </span>
              </div>
              <Progress 
                value={calculateUsagePercentage(subscription.usage.aiQueries.used, subscription.usage.aiQueries.limit)} 
                className="h-2"
              />
              <p className={`text-xs ${getUsageColor(calculateUsagePercentage(subscription.usage.aiQueries.used, subscription.usage.aiQueries.limit))}`}>
                {calculateUsagePercentage(subscription.usage.aiQueries.used, subscription.usage.aiQueries.limit).toFixed(0)}% used
              </p>
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {(subscription.usage.storage.used / 1024 / 1024 / 1024).toFixed(1)}GB/
                  {subscription.usage.storage.limit === -1 ? '∞' : `${subscription.usage.storage.limit}GB`}
                </span>
              </div>
              <Progress 
                value={calculateUsagePercentage(subscription.usage.storage.used, subscription.usage.storage.limit * 1024 * 1024 * 1024)} 
                className="h-2"
              />
              <p className={`text-xs ${getUsageColor(calculateUsagePercentage(subscription.usage.storage.used, subscription.usage.storage.limit * 1024 * 1024 * 1024))}`}>
                {calculateUsagePercentage(subscription.usage.storage.used, subscription.usage.storage.limit * 1024 * 1024 * 1024).toFixed(0)}% used
              </p>
            </div>

            {/* Team Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Team Members</span>
                </div>
                <span className="text-sm text-gray-600">
                  {subscription.usage.teamMembers.used}/{subscription.usage.teamMembers.limit === -1 ? '∞' : subscription.usage.teamMembers.limit}
                </span>
              </div>
              <Progress 
                value={calculateUsagePercentage(subscription.usage.teamMembers.used, subscription.usage.teamMembers.limit)} 
                className="h-2"
              />
              <p className={`text-xs ${getUsageColor(calculateUsagePercentage(subscription.usage.teamMembers.used, subscription.usage.teamMembers.limit))}`}>
                {calculateUsagePercentage(subscription.usage.teamMembers.used, subscription.usage.teamMembers.limit).toFixed(0)}% used
              </p>
            </div>
          </div>

          {/* Usage Alerts */}
          <div className="mt-6 space-y-2">
            {Object.entries(subscription.usage).map(([key, usage]) => {
              const percentage = calculateUsagePercentage(usage.used, usage.limit)
              if (percentage >= 90) {
                return (
                  <div key={key} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">
                      You're approaching your {key.replace(/([A-Z])/g, ' $1').toLowerCase()} limit ({percentage.toFixed(0)}% used)
                    </p>
                  </div>
                )
              }
              return null
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trial Information */}
      {subscription.status === 'trialing' && subscription.trialEnd && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Free Trial Active</h3>
                <p className="text-sm text-blue-700">
                  Your trial ends on {formatDate(subscription.trialEnd)}. 
                  Upgrade now to continue enjoying premium features.
                </p>
              </div>
              <Button onClick={() => handleUpgrade('basic_individual')} className="ml-auto">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
