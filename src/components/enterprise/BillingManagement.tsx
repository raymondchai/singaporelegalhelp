'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  CreditCard,
  Calendar,
  BarChart3,
  Zap,
  Database,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts'
// Using simple div structure instead of Table component

interface BillingData {
  currentPeriod: {
    total_cost_sgd: number
    total_api_calls: number
    total_storage_gb: number
    total_users: number
    billing_period_start: string
    billing_period_end: string
    api_overage_calls: number
    api_overage_cost_sgd: number
    storage_overage_gb: number
    storage_overage_cost_sgd: number
  }
  organization: {
    max_api_calls_per_month: number
    max_storage_gb: number
    max_users: number
    subscription_tier: string
  }
  history: Array<{
    billing_period_start: string
    total_cost_sgd: number
    total_api_calls: number
    total_storage_gb: number
  }>
  projections: {
    nextMonth: number
    nextQuarter: number
  }
}

export default function BillingManagement() {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/billing', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load billing data')
      }

      const data = await response.json()
      setBillingData(data.data)
    } catch (error) {
      console.error('Error loading billing data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoice = async (billingPeriod: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/billing/invoice?period=${billingPeriod}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download invoice')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${billingPeriod}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully'
      })
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB'
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Billing & Usage</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!billingData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Billing & Usage</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No billing data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { currentPeriod, organization, history, projections } = billingData

  const apiUsagePercentage = getUsagePercentage(currentPeriod.total_api_calls, organization.max_api_calls_per_month)
  const storageUsagePercentage = getUsagePercentage(currentPeriod.total_storage_gb, organization.max_storage_gb)
  const userUsagePercentage = getUsagePercentage(currentPeriod.total_users, organization.max_users)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing & Usage</h2>
          <p className="text-gray-600">Monitor your subscription usage and billing information</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {organization.subscription_tier.toUpperCase()} Plan
          </Badge>
          <Button onClick={() => downloadInvoice(currentPeriod.billing_period_start)} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Current Period Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Billing Period
          </CardTitle>
          <p className="text-sm text-gray-600">
            {new Date(currentPeriod.billing_period_start).toLocaleDateString()} - {new Date(currentPeriod.billing_period_end).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(currentPeriod.total_cost_sgd)}</p>
              <p className="text-sm text-gray-600">Total Cost</p>
              {currentPeriod.api_overage_cost_sgd + currentPeriod.storage_overage_cost_sgd > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  +{formatCurrency(currentPeriod.api_overage_cost_sgd + currentPeriod.storage_overage_cost_sgd)} overage
                </p>
              )}
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{currentPeriod.total_api_calls.toLocaleString()}</p>
              <p className="text-sm text-gray-600">API Calls</p>
              <p className={`text-xs mt-1 ${getUsageColor(apiUsagePercentage)}`}>
                {apiUsagePercentage.toFixed(1)}% of limit
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-3xl font-bold">{formatBytes(currentPeriod.total_storage_gb * 1024 * 1024 * 1024)}</p>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className={`text-xs mt-1 ${getUsageColor(storageUsagePercentage)}`}>
                {storageUsagePercentage.toFixed(1)}% of limit
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-3xl font-bold">{currentPeriod.total_users}</p>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className={`text-xs mt-1 ${getUsageColor(userUsagePercentage)}`}>
                {userUsagePercentage.toFixed(1)}% of limit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              API Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Used: {currentPeriod.total_api_calls.toLocaleString()}</span>
                <span>Limit: {organization.max_api_calls_per_month.toLocaleString()}</span>
              </div>
              <Progress value={apiUsagePercentage} className="h-2" />
              {currentPeriod.api_overage_calls > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{currentPeriod.api_overage_calls.toLocaleString()} overage calls</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Used: {currentPeriod.total_storage_gb.toFixed(2)} GB</span>
                <span>Limit: {organization.max_storage_gb} GB</span>
              </div>
              <Progress value={storageUsagePercentage} className="h-2" />
              {currentPeriod.storage_overage_gb > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{currentPeriod.storage_overage_gb.toFixed(2)} GB overage</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Used: {currentPeriod.total_users}</span>
                <span>Limit: {organization.max_users}</span>
              </div>
              <Progress value={userUsagePercentage} className="h-2" />
              {userUsagePercentage >= 90 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Approaching user limit</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="billing_period_start" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [formatCurrency(value as number), 'Cost']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total_cost_sgd" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="billing_period_start" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_api_calls" 
                  stroke="#8884d8" 
                  name="API Calls"
                />
                <Line 
                  type="monotone" 
                  dataKey="total_storage_gb" 
                  stroke="#82ca9d" 
                  name="Storage (GB)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cost Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 border rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Projected Next Month</p>
              <p className="text-3xl font-bold">{formatCurrency(projections.nextMonth)}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {projections.nextMonth > currentPeriod.total_cost_sgd ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      +{formatCurrency(projections.nextMonth - currentPeriod.total_cost_sgd)}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      -{formatCurrency(currentPeriod.total_cost_sgd - projections.nextMonth)}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-center p-6 border rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Projected Next Quarter</p>
              <p className="text-3xl font-bold">{formatCurrency(projections.nextQuarter)}</p>
              <p className="text-sm text-gray-600 mt-2">
                Avg: {formatCurrency(projections.nextQuarter / 3)}/month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 font-medium">
                <div>Period</div>
                <div>API Calls</div>
                <div>Storage</div>
                <div>Total Cost</div>
                <div>Actions</div>
              </div>
              {history.slice(0, 10).map((record, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 p-4 border-b">
                  <div>
                    {new Date(record.billing_period_start).toLocaleDateString()}
                  </div>
                  <div>{record.total_api_calls.toLocaleString()}</div>
                  <div>{record.total_storage_gb.toFixed(2)} GB</div>
                  <div className="font-medium">
                    {formatCurrency(record.total_cost_sgd)}
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(record.billing_period_start)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
