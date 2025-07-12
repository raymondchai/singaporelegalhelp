'use client'

// =====================================================
// Phase 6A: Business Intelligence Dashboard
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { formatPrice } from '@/lib/subscription-config'

interface RevenueAnalytics {
  period: {
    start: string;
    end: string;
    days: number;
  };
  revenue: {
    total: number;
    mrr: number;
    arpu: number;
    clv: number;
    growth_percentage: number;
    daily_breakdown: Record<string, number>;
    by_tier: Record<string, number>;
  };
  subscriptions: {
    total_active: number;
    new_subscriptions: number;
    canceled_subscriptions: number;
    churn_rate: number;
    tier_distribution: Record<string, number>;
  };
  metrics: {
    conversion_rate: number;
    customer_acquisition_cost: number;
    lifetime_value: number;
    payback_period: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/revenue?period=${period}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        setError(data.error || 'Failed to fetch analytics')
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatGrowth = (percentage: number) => {
    const isPositive = percentage >= 0
    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp className={`h-4 w-4 ${isPositive ? '' : 'rotate-180'}`} />
        <span>{Math.abs(percentage).toFixed(1)}%</span>
      </div>
    )
  }

  const getTierColor = (tier: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic_individual: 'bg-blue-100 text-blue-800',
      premium_individual: 'bg-purple-100 text-purple-800',
      professional: 'bg-green-100 text-green-800',
      enterprise: 'bg-orange-100 text-orange-800',
    }
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600 mt-2">Revenue insights and subscription metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(analytics.revenue.total)}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Last {analytics.period.days} days
                  </p>
                  {formatGrowth(analytics.revenue.growth_percentage)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(analytics.revenue.mrr)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  ARPU: {formatPrice(analytics.revenue.arpu)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.subscriptions.total_active}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Churn Rate: {analytics.subscriptions.churn_rate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Lifetime Value</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(analytics.revenue.clv)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg. lifetime value
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="tiers">Tier Analysis</TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Tier</CardTitle>
                    <CardDescription>Monthly recurring revenue breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(analytics.revenue.by_tier).map(([tier, revenue]) => (
                        <div key={tier} className="flex items-center justify-between">
                          <Badge className={getTierColor(tier)}>
                            {tier.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="font-medium">{formatPrice(revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                    <CardDescription>Important business indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Revenue Per User</span>
                        <span className="font-medium">{formatPrice(analytics.revenue.arpu)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Customer Lifetime Value</span>
                        <span className="font-medium">{formatPrice(analytics.revenue.clv)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue Growth</span>
                        <span className="font-medium">{analytics.revenue.growth_percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>New Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {analytics.subscriptions.new_subscriptions}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Last {analytics.period.days} days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cancellations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {analytics.subscriptions.canceled_subscriptions}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Last {analytics.period.days} days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Churn Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {analytics.subscriptions.churn_rate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Monthly churn rate
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tier Analysis Tab */}
            <TabsContent value="tiers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Tier Distribution</CardTitle>
                  <CardDescription>Active subscriptions by tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.subscriptions.tier_distribution).map(([tier, count]) => {
                      const percentage = (count / analytics.subscriptions.total_active) * 100
                      return (
                        <div key={tier} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getTierColor(tier)}>
                              {tier.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
