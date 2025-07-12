'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import {
  TrendingUp,
  Zap,
  Star,
  Users,
  Shield,
  Crown,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Target,
  BarChart3
} from 'lucide-react'
import { SubscriptionDetails } from '@/types/dashboard'
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/subscription-config'
import { useAuth } from '@/contexts/auth-context'

interface UpgradeRecommendationsProps {
  subscription: SubscriptionDetails
  usageAnalytics: any
  onUpgrade: (tier: SubscriptionTier) => void
}

interface RecommendationReason {
  type: 'usage_limit' | 'feature_unlock' | 'cost_savings' | 'productivity'
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  icon: React.ReactNode
}

interface UpgradeOption {
  tier: SubscriptionTier
  name: string
  currentPrice: number
  savings?: number
  features: string[]
  reasons: RecommendationReason[]
  priority: number
}

export default function UpgradeRecommendations({
  subscription,
  usageAnalytics,
  onUpgrade
}: UpgradeRecommendationsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<UpgradeOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateRecommendations()
  }, [subscription, usageAnalytics])

  const generateRecommendations = async () => {
    try {
      setLoading(true)
      const reasons = analyzeUpgradeReasons()
      const options = generateUpgradeOptions(reasons)
      setRecommendations(options.sort((a, b) => b.priority - a.priority))
    } catch (error) {
      console.error('Error generating recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeUpgradeReasons = (): RecommendationReason[] => {
    const reasons: RecommendationReason[] = []

    // Check usage limits
    Object.entries(subscription.usage).forEach(([key, usage]) => {
      const percentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0
      
      if (percentage >= 90) {
        reasons.push({
          type: 'usage_limit',
          title: `${key.replace(/([A-Z])/g, ' $1')} Limit Reached`,
          description: `You're using ${percentage.toFixed(0)}% of your ${key.toLowerCase()} allowance`,
          urgency: 'high',
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />
        })
      } else if (percentage >= 75) {
        reasons.push({
          type: 'usage_limit',
          title: `Approaching ${key.replace(/([A-Z])/g, ' $1')} Limit`,
          description: `You're using ${percentage.toFixed(0)}% of your ${key.toLowerCase()} allowance`,
          urgency: 'medium',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
        })
      }
    })

    // Feature-based recommendations
    if (subscription.tier === 'free') {
      reasons.push({
        type: 'feature_unlock',
        title: 'Unlock Advanced Features',
        description: 'Get access to unlimited documents, AI queries, and priority support',
        urgency: 'medium',
        icon: <Sparkles className="h-4 w-4 text-purple-500" />
      })
    }

    if (subscription.tier === 'basic') {
      reasons.push({
        type: 'productivity',
        title: 'Boost Your Productivity',
        description: 'Advanced analytics and custom templates can save you hours each week',
        urgency: 'low',
        icon: <Target className="h-4 w-4 text-blue-500" />
      })
    }

    // Cost savings for annual billing
    if (subscription.billingCycle === 'monthly') {
      reasons.push({
        type: 'cost_savings',
        title: 'Save with Annual Billing',
        description: 'Switch to annual billing and save up to 17% on your subscription',
        urgency: 'low',
        icon: <TrendingUp className="h-4 w-4 text-green-500" />
      })
    }

    return reasons
  }

  // Map dashboard tier types to config tier types
  const mapTierToConfig = (dashboardTier: string): SubscriptionTier => {
    switch (dashboardTier) {
      case 'free': return 'free'
      case 'basic': return 'basic_individual'
      case 'premium': return 'premium_individual'
      case 'enterprise': return 'enterprise'
      default: return 'free'
    }
  }

  const generateUpgradeOptions = (reasons: RecommendationReason[]): UpgradeOption[] => {
    const currentConfigTier = mapTierToConfig(subscription.tier)
    const options: UpgradeOption[] = []

    // Get available upgrade tiers
    const tierOrder: SubscriptionTier[] = ['free', 'basic_individual', 'premium_individual', 'professional', 'enterprise']
    const currentIndex = tierOrder.indexOf(currentConfigTier)
    const availableTiers = tierOrder.slice(currentIndex + 1)

    availableTiers.forEach((tier, index) => {
      const tierConfig = SUBSCRIPTION_TIERS[tier]
      const relevantReasons = reasons.filter(reason => 
        isReasonRelevantForTier(reason, tier, currentConfigTier)
      )

      if (relevantReasons.length > 0 || index === 0) {
        const priority = calculatePriority(tier, relevantReasons, index)
        const savings = subscription.billingCycle === 'monthly' ? 
          tierConfig.pricing.monthly_price_sgd * 12 - tierConfig.pricing.annual_price_sgd : 0

        options.push({
          tier,
          name: tierConfig.name,
          currentPrice: subscription.billingCycle === 'monthly' ? 
            tierConfig.pricing.monthly_price_sgd : 
            tierConfig.pricing.annual_price_sgd,
          savings: savings > 0 ? savings : undefined,
          features: getKeyFeatures(tier, currentConfigTier),
          reasons: relevantReasons,
          priority
        })
      }
    })

    return options
  }

  const isReasonRelevantForTier = (
    reason: RecommendationReason, 
    targetTier: SubscriptionTier, 
    currentTier: SubscriptionTier
  ): boolean => {
    const targetConfig = SUBSCRIPTION_TIERS[targetTier]
    
    switch (reason.type) {
      case 'usage_limit':
        return true // All higher tiers typically have higher limits
      case 'feature_unlock':
        return targetTier !== 'free'
      case 'productivity':
        return targetConfig.features.advanced_analytics || targetConfig.features.custom_templates
      case 'cost_savings':
        return true
      default:
        return true
    }
  }

  const calculatePriority = (
    tier: SubscriptionTier, 
    reasons: RecommendationReason[], 
    tierIndex: number
  ): number => {
    let priority = 0
    
    // Base priority (closer tiers get higher priority)
    priority += (5 - tierIndex) * 10
    
    // Urgency-based priority
    reasons.forEach(reason => {
      switch (reason.urgency) {
        case 'high':
          priority += 30
          break
        case 'medium':
          priority += 20
          break
        case 'low':
          priority += 10
          break
      }
    })

    return priority
  }

  const getKeyFeatures = (targetTier: SubscriptionTier, currentTier: SubscriptionTier): string[] => {
    const targetConfig = SUBSCRIPTION_TIERS[targetTier]
    const currentConfig = SUBSCRIPTION_TIERS[currentTier]
    
    const features: string[] = []

    // Compare key features
    if (targetConfig.features.document_templates_per_month === 'unlimited' && 
        currentConfig.features.document_templates_per_month !== 'unlimited') {
      features.push('Unlimited document templates')
    }

    if (targetConfig.features.ai_queries_per_month === 'unlimited' && 
        currentConfig.features.ai_queries_per_month !== 'unlimited') {
      features.push('Unlimited AI queries')
    }

    if (targetConfig.features.advanced_analytics && !currentConfig.features.advanced_analytics) {
      features.push('Advanced analytics')
    }

    if (targetConfig.features.team_collaboration && !currentConfig.features.team_collaboration) {
      features.push('Team collaboration')
    }

    if (targetConfig.features.priority_support && !currentConfig.features.priority_support) {
      features.push('Priority support')
    }

    if (targetConfig.features.custom_templates && !currentConfig.features.custom_templates) {
      features.push('Custom templates')
    }

    return features.slice(0, 4) // Limit to top 4 features
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
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

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      await onUpgrade(tier)
      toast({
        title: 'Upgrade Initiated',
        description: `Upgrading to ${SUBSCRIPTION_TIERS[tier].name} plan`
      })
    } catch (error) {
      toast({
        title: 'Upgrade Failed',
        description: 'Failed to initiate upgrade. Please try again.',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            You're All Set!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Perfect Plan Match</h3>
            <p className="text-gray-500">
              Your current plan meets all your needs. We'll let you know if we recommend any changes.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Upgrade Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations.map((option, index) => (
          <div key={option.tier} className="border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getTierIcon(option.tier)}
                <div>
                  <h3 className="text-lg font-semibold">{option.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">S${option.currentPrice}</span>
                    <span className="text-sm text-gray-500">
                      /{subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                    {option.savings && (
                      <Badge className="bg-green-100 text-green-800">
                        Save S${option.savings}/year
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {index === 0 && (
                <Badge className="bg-blue-100 text-blue-800">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </div>

            {/* Reasons for upgrade */}
            <div className="space-y-2 mb-4">
              {option.reasons.map((reason, reasonIndex) => (
                <div key={reasonIndex} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  {reason.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reason.title}</p>
                    <p className="text-xs text-gray-600">{reason.description}</p>
                  </div>
                  <Badge className={getUrgencyColor(reason.urgency)}>
                    {reason.urgency}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Key features */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features You'll Unlock:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {option.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => handleUpgrade(option.tier)}
              className="w-full"
              variant={index === 0 ? 'default' : 'outline'}
            >
              Upgrade to {option.name}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ))}

        {/* Annual billing promotion */}
        {subscription.billingCycle === 'monthly' && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Switch to Annual Billing</h4>
                <p className="text-sm text-green-700">
                  Save up to 17% by switching to annual billing on any plan
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
