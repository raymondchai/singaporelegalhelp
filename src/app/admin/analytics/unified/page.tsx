'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Search, 
  MessageSquare, 
  Brain,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target
} from 'lucide-react'
import type { UnifiedAnalytics } from '@/lib/unified-analytics'

export default function UnifiedAnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<UnifiedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/admin/analytics/unified?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.data)
      } else {
        console.error('Failed to load analytics:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/admin/analytics/unified?timeRange=${timeRange}&format=${format}&export=true`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `unified-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting analytics:', error)
    }
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

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analytics Data Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load analytics data. Please try again.</p>
          <Button onClick={loadAnalytics}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unified Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive platform insights and performance metrics</p>
        </div>
        
        <div className="flex space-x-2">
          {/* Time Range Selector */}
          {['24h', '7d', '30d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range as '24h' | '7d' | '30d')}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.searchMetrics.totalSearches + analytics.aiMetrics.totalAIQueries).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Performance</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.aiMetrics.avgConfidence}%</div>
            <p className="text-xs text-muted-foreground">
              Average confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userEngagement.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.aiMetrics.cacheHitRate}%</div>
            <p className="text-xs text-muted-foreground">
              Cache efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="ai">AI System</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
                <CardDescription>Key metrics across all platform features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Search Queries</span>
                    <Badge variant="secondary">{analytics.searchMetrics.totalSearches}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">AI Conversations</span>
                    <Badge variant="secondary">{analytics.aiMetrics.totalAIQueries}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Unique Queries</span>
                    <Badge variant="secondary">{analytics.searchMetrics.uniqueQueries}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Response Time</span>
                    <Badge variant="secondary">{analytics.aiMetrics.avgResponseTime}ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>System performance and quality indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">AI Confidence</span>
                    <Badge 
                      variant={analytics.aiMetrics.avgConfidence > 80 ? "default" : "secondary"}
                    >
                      {analytics.aiMetrics.avgConfidence}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Search CTR</span>
                    <Badge variant="secondary">{analytics.searchMetrics.clickThroughRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <Badge 
                      variant={analytics.aiMetrics.complianceScore > 90 ? "default" : "secondary"}
                    >
                      {analytics.aiMetrics.complianceScore}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Escalation Rate</span>
                    <Badge 
                      variant={analytics.aiMetrics.escalationRate < 5 ? "default" : "destructive"}
                    >
                      {analytics.aiMetrics.escalationRate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Performance</CardTitle>
                <CardDescription>Search behavior and effectiveness metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Searches</span>
                    <Badge variant="secondary">{analytics.searchMetrics.totalSearches}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Unique Queries</span>
                    <Badge variant="secondary">{analytics.searchMetrics.uniqueQueries}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Results</span>
                    <Badge variant="secondary">{analytics.searchMetrics.avgResultsPerSearch}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Click-through Rate</span>
                    <Badge variant="secondary">{analytics.searchMetrics.clickThroughRate}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Most popular search terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.searchMetrics.topQueries.slice(0, 5).map((query, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate flex-1 mr-2">{query.query}</span>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="text-xs">{query.count}</Badge>
                        <Badge variant="outline" className="text-xs">{query.ctr}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI System Performance</CardTitle>
                <CardDescription>AI response quality and system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total AI Queries</span>
                    <Badge variant="secondary">{analytics.aiMetrics.totalAIQueries}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Confidence</span>
                    <Badge variant="secondary">{analytics.aiMetrics.avgConfidence}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                    <Badge variant="secondary">{analytics.aiMetrics.cacheHitRate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Response Time</span>
                    <Badge variant="secondary">{analytics.aiMetrics.avgResponseTime}ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Categories</CardTitle>
                <CardDescription>Most queried legal practice areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.aiMetrics.topCategories.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate flex-1 mr-2">{category.category}</span>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="text-xs">{category.count}</Badge>
                        <Badge variant="outline" className="text-xs">{category.avgConfidence}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>User behavior and engagement patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Users</span>
                    <Badge variant="secondary">{analytics.userEngagement.activeUsers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Avg Session Duration</span>
                    <Badge variant="secondary">{analytics.userEngagement.avgSessionDuration} min</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Queries per Session</span>
                    <Badge variant="secondary">{analytics.userEngagement.queriesPerSession}</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Feature Usage</h4>
                  {Object.entries(analytics.userEngagement.featureUsage).map(([feature, usage]) => (
                    <div key={feature} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                      <Badge variant="outline">{usage}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emerging Trends</CardTitle>
              <CardDescription>Growing topics and trending queries</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.trends.emergingTopics.length > 0 ? (
                <div className="space-y-3">
                  {analytics.trends.emergingTopics.slice(0, 8).map((trend, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate flex-1 mr-2">{trend.topic}</span>
                      <div className="flex space-x-2">
                        <Badge 
                          variant={trend.growth > 50 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          +{trend.growth}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(trend.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No significant trends detected in this period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
