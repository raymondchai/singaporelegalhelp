'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  FileText,
  MessageSquare,
  Eye,
  Calendar,
  BarChart3
} from 'lucide-react'
import { UsageAnalytics } from '@/types/dashboard'
import { createAnalyticsService } from '@/lib/enhanced-analytics'
import { useAuth } from '@/contexts/auth-context'

interface EnhancedUsageAnalyticsProps {
  className?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function EnhancedUsageAnalytics({ className = "" }: EnhancedUsageAnalyticsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    if (!user) return

    try {
      setLoading(true)
      const service = createAnalyticsService(user.id)
      const data = await service.getUsageAnalytics(timeRange)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load usage analytics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeRange = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case '1y': return 'Last year'
      default: return 'Last 30 days'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No usage data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Analytics
        </CardTitle>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Practice Area Breakdown */}
            <div>
              <h3 className="text-lg font-medium mb-4">Practice Area Activity</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.practiceAreaBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ area, percentage }) => `${area}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {analytics.practiceAreaBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {analytics.practiceAreaBreakdown.map((area, index) => (
                    <div key={area.area} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{area.area}</span>
                        {getTrendIcon(area.trend)}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{area.count}</div>
                        <div className="text-sm text-gray-500">{area.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold">{analytics.timeSpentAnalytics.totalHours}h</div>
                  <div className="text-sm text-gray-500">
                    Avg: {analytics.timeSpentAnalytics.averageSessionLength}min/session
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Content Views</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analytics.contentEngagement.mostViewedArticles.reduce((sum, article) => sum + article.views, 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {analytics.contentEngagement.mostViewedArticles.length} articles viewed
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Searches</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analytics.contentEngagement.searchPatterns.reduce((sum, pattern) => sum + pattern.frequency, 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {analytics.contentEngagement.searchPatterns.length} unique queries
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Daily Activity Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="documents" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="chats" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="searches" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    <Area type="monotone" dataKey="views" stackId="1" stroke="#ff7300" fill="#ff7300" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Viewed Articles */}
              <div>
                <h3 className="text-lg font-medium mb-4">Most Viewed Articles</h3>
                <div className="space-y-3">
                  {analytics.contentEngagement.mostViewedArticles.slice(0, 5).map((article, index) => (
                    <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium truncate">{article.title}</div>
                        <div className="text-sm text-gray-500">{article.practiceArea}</div>
                      </div>
                      <Badge variant="secondary">{article.views} views</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Patterns */}
              <div>
                <h3 className="text-lg font-medium mb-4">Top Search Queries</h3>
                <div className="space-y-3">
                  {analytics.contentEngagement.searchPatterns.slice(0, 5).map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{pattern.query}</div>
                        <div className="text-sm text-gray-500">
                          Last searched: {new Date(pattern.lastSearched).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">{pattern.frequency}x</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookmark Trends */}
            {analytics.contentEngagement.bookmarkTrends.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Bookmark Activity</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.contentEngagement.bookmarkTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="bookmarks" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            {/* Peak Usage Hours */}
            <div>
              <h3 className="text-lg font-medium mb-4">Peak Usage Hours</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.timeSpentAnalytics.peakUsageHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(hour) => `${hour}:00 - ${hour + 1}:00`}
                    />
                    <Bar dataKey="activity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Time Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="font-medium">{analytics.timeSpentAnalytics.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Session:</span>
                      <span className="font-medium">{analytics.timeSpentAnalytics.averageSessionLength} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peak Hour:</span>
                      <span className="font-medium">
                        {analytics.timeSpentAnalytics.peakUsageHours[0]?.hour || 0}:00
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Usage Insights</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      You're most active during{' '}
                      <span className="font-medium">
                        {analytics.timeSpentAnalytics.peakUsageHours[0]?.hour || 0}:00
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Your sessions average{' '}
                      <span className="font-medium">
                        {analytics.timeSpentAnalytics.averageSessionLength} minutes
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Total platform engagement:{' '}
                      <span className="font-medium">
                        {analytics.timeSpentAnalytics.totalHours} hours
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
