'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  Users, 
  Activity, 
  Shield, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Zap,
  FileText,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react'

interface DashboardData {
  organization: {
    id: string
    name: string
    subscription_tier: string
    max_users: number
    max_api_calls_per_month: number
    max_storage_gb: number
    status: string
  }
  overview: {
    members: {
      total: number
      active: number
      byRole: Record<string, number>
    }
    api: {
      totalCalls: number
      successfulCalls: number
      errorCalls: number
      avgResponseTime: number
      topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>
    }
    documents: {
      totalDocuments: number
      byType: Record<string, number>
      byStatus: Record<string, number>
      totalSize: number
    }
    collaboration: {
      totalSessions: number
      activeSessions: number
      byType: Record<string, number>
    }
    security: {
      totalEvents: number
      highRiskEvents: number
      failedEvents: number
      recentEvents: any[]
    }
    billing: {
      total_cost_sgd: number
      total_api_calls: number
      total_storage_gb: number
      billing_period_start: string
      billing_period_end: string
    }
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function EnterpriseDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [period])

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/dashboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const data = await response.json()
      setDashboardData(data.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Enterprise Dashboard</h1>
          <div className="animate-spin">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Enterprise Dashboard</h1>
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    )
  }

  const { organization, overview } = dashboardData

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <p className="text-gray-600">Enterprise Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Organization Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(organization.status)}>
                {organization.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                {organization.subscription_tier.toUpperCase()} Plan
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div>Users: {overview.members.active}/{organization.max_users}</div>
              <div>API Calls: {overview.api.totalCalls.toLocaleString()}/{organization.max_api_calls_per_month.toLocaleString()}</div>
              <div>Storage: {formatBytes(overview.documents.totalSize)}/{organization.max_storage_gb}GB</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{overview.members.active}</p>
                <p className="text-xs text-gray-500">
                  {overview.members.total} total members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">API Calls</p>
                <p className="text-2xl font-bold">{overview.api.totalCalls.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {Math.round((overview.api.successfulCalls / overview.api.totalCalls) * 100)}% success rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Documents</p>
                <p className="text-2xl font-bold">{overview.documents.totalDocuments}</p>
                <p className="text-xs text-gray-500">
                  {formatBytes(overview.documents.totalSize)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Security Events</p>
                <p className="text-2xl font-bold">{overview.security.totalEvents}</p>
                <p className="text-xs text-gray-500">
                  {overview.security.highRiskEvents} high risk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>API Usage by Endpoint</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overview.api.topEndpoints.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="endpoint" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Document Types */}
            <Card>
              <CardHeader>
                <CardTitle>Documents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(overview.documents.byType).map(([type, count]) => ({
                        name: type,
                        value: count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(overview.documents.byType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.security.recentEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${
                        event.risk_level === 'high' || event.risk_level === 'critical' 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{event.event_type}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={event.result === 'success' ? 'default' : 'destructive'}>
                      {event.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Detailed usage analytics will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(overview.api.avgResponseTime)}ms</p>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {Math.round((overview.api.successfulCalls / overview.api.totalCalls) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{overview.api.errorCalls}</p>
                  <p className="text-sm text-gray-600">Error Count</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{overview.security.totalEvents - overview.security.failedEvents}</p>
                  <p className="text-sm text-gray-600">Successful Events</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{overview.security.failedEvents}</p>
                  <p className="text-sm text-gray-600">Failed Events</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{overview.security.highRiskEvents}</p>
                  <p className="text-sm text-gray-600">High Risk Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              {overview.billing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(overview.billing.total_cost_sgd)}</p>
                    <p className="text-sm text-gray-600">Current Period Cost</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{overview.billing.total_api_calls.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">API Calls Used</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{overview.billing.total_storage_gb.toFixed(2)}GB</p>
                    <p className="text-sm text-gray-600">Storage Used</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No billing information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
