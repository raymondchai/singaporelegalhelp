'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Gauge, 
  RefreshCw, 
  TrendingUp,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface WebVitalsData {
  date: string
  metric_name: string
  average_value: number
  good_count: number
  needs_improvement_count: number
  poor_count: number
  sample_count: number
}

interface PerformanceMetrics {
  longTasks: number
  layoutShifts: number
  slowResources: number
  period: string
}

interface ErrorMetrics {
  total: number
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
}

export default function PerformanceDashboard() {
  const [webVitals, setWebVitals] = useState<WebVitalsData[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchAllData()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAllData, 120000)
    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchWebVitals(),
        fetchPerformanceMetrics(),
        fetchErrorMetrics(),
      ])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWebVitals = async () => {
    try {
      const response = await fetch('/api/analytics/web-vitals?days=7')
      const data = await response.json()
      setWebVitals(data)
    } catch (error) {
      console.error('Failed to fetch Web Vitals:', error)
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/performance?type=summary&days=7')
      const data = await response.json()
      setPerformanceMetrics(data)
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    }
  }

  const fetchErrorMetrics = async () => {
    try {
      const response = await fetch('/api/errors?days=7')
      const data = await response.json()
      
      const byCategory = data.reduce((acc: Record<string, number>, error: any) => {
        acc[error.category] = (acc[error.category] || 0) + 1
        return acc
      }, {})

      const bySeverity = data.reduce((acc: Record<string, number>, error: any) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1
        return acc
      }, {})

      setErrorMetrics({
        total: data.length,
        byCategory,
        bySeverity,
      })
    } catch (error) {
      console.error('Failed to fetch error metrics:', error)
    }
  }

  const getWebVitalRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    }

    const threshold = thresholds[metric]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'needs-improvement': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  // Group Web Vitals by metric
  const webVitalsByMetric = webVitals.reduce((acc, item) => {
    if (!acc[item.metric_name]) {
      acc[item.metric_name] = []
    }
    acc[item.metric_name].push(item)
    return acc
  }, {} as Record<string, WebVitalsData[]>)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-gray-600">Real-time performance monitoring and Web Vitals</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </Badge>
          <Button onClick={fetchAllData} size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="web-vitals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="web-vitals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(webVitalsByMetric).map(([metric, data]) => {
              const latest = data[data.length - 1]
              const rating = latest ? getWebVitalRating(metric, latest.average_value) : 'good'
              const passRate = latest ? 
                (latest.good_count / latest.sample_count) * 100 : 0

              return (
                <Card key={metric}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{metric}</CardTitle>
                    {getRatingIcon(rating)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {latest ? 
                        (metric === 'CLS' ? latest.average_value.toFixed(3) : 
                         Math.round(latest.average_value)) : 'N/A'}
                      {metric !== 'CLS' && latest && 'ms'}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Progress value={passRate} className="flex-1" />
                      <span className="text-sm text-gray-600">{Math.round(passRate)}% good</span>
                    </div>
                    <p className={`text-xs mt-1 ${getRatingColor(rating)}`}>
                      {rating.replace('-', ' ').toUpperCase()}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {Object.entries(webVitalsByMetric).map(([metric, data]) => (
            <Card key={`chart-${metric}`}>
              <CardHeader>
                <CardTitle>{metric} Trend (7 days)</CardTitle>
                <CardDescription>Average values over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="average_value" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Long Tasks</CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics?.longTasks || 0}</div>
                <p className="text-xs text-gray-600">Tasks &gt;50ms in {performanceMetrics?.period}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Layout Shifts</CardTitle>
                <Eye className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics?.layoutShifts || 0}</div>
                <p className="text-xs text-gray-600">Unexpected shifts in {performanceMetrics?.period}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slow Resources</CardTitle>
                <Gauge className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceMetrics?.slowResources || 0}</div>
                <p className="text-xs text-gray-600">Resources &gt;1s in {performanceMetrics?.period}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Errors by Category</CardTitle>
                <CardDescription>Error distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                {errorMetrics?.byCategory && Object.keys(errorMetrics.byCategory).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(errorMetrics.byCategory).map(([key, value]) => ({ name: key, count: value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">No errors in the last 7 days</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Severity</CardTitle>
                <CardDescription>Breakdown by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorMetrics?.bySeverity && Object.entries(errorMetrics.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="capitalize">{severity}</span>
                      <Badge variant={severity === 'critical' ? 'destructive' : severity === 'high' ? 'secondary' : 'outline'}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                  {(!errorMetrics?.bySeverity || Object.keys(errorMetrics.bySeverity).length === 0) && (
                    <div className="text-center py-4 text-gray-500">No errors recorded</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Insights</span>
              </CardTitle>
              <CardDescription>Automated recommendations based on your metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Optimization Opportunities</h4>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• Consider implementing image lazy loading for better LCP scores</li>
                    <li>• Optimize JavaScript bundle size to reduce FID</li>
                    <li>• Use CSS containment to minimize layout shifts</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Good Performance Areas</h4>
                  <ul className="mt-2 text-sm text-green-800 space-y-1">
                    <li>• TTFB is within acceptable range</li>
                    <li>• Error rates are low</li>
                    <li>• PWA caching is working effectively</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
