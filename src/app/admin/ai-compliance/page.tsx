'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

interface ComplianceMetrics {
  totalQueries: number
  highRiskQueries: number
  mediumRiskQueries: number
  lowRiskQueries: number
  averageConfidence: number
  escalationRate: number
}

interface QueryLog {
  id: string
  question: string
  confidence: number
  created_at: string
  user_id: string
  risk_level?: string
  compliance_issues?: string[]
}

export default function AICompliancePage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null)
  const [recentQueries, setRecentQueries] = useState<QueryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (user) {
      loadComplianceData()
    }
  }, [user, timeRange])

  const loadComplianceData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const now = new Date()
      const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

      // Fetch query logs
      const { data: queries, error } = await supabase
        .from('ai_query_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading compliance data:', error)
        return
      }

      // Calculate metrics
      const totalQueries = queries?.length || 0
      const highRiskQueries = queries?.filter(q => q.confidence < 0.5).length || 0
      const mediumRiskQueries = queries?.filter(q => q.confidence >= 0.5 && q.confidence < 0.8).length || 0
      const lowRiskQueries = queries?.filter(q => q.confidence >= 0.8).length || 0
      const averageConfidence = queries?.reduce((sum, q) => sum + (q.confidence || 0), 0) / totalQueries || 0
      const escalationRate = (highRiskQueries / totalQueries) * 100 || 0

      setMetrics({
        totalQueries,
        highRiskQueries,
        mediumRiskQueries,
        lowRiskQueries,
        averageConfidence,
        escalationRate
      })

      setRecentQueries(queries || [])
    } catch (error) {
      console.error('Error loading compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Low Risk</Badge>
    } else if (confidence >= 0.5) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">High Risk</Badge>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Compliance Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor AI response quality and legal compliance</p>
        </div>
        
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalQueries || 0}</div>
            <p className="text-xs text-muted-foreground">
              AI queries processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? Math.round(metrics.averageConfidence * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Response confidence score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics?.highRiskQueries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require human review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? Math.round(metrics.escalationRate) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Queries needing escalation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Breakdown of query risk levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics?.lowRiskQueries || 0}
              </div>
              <p className="text-sm text-green-800">Low Risk (≥80% confidence)</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {metrics?.mediumRiskQueries || 0}
              </div>
              <p className="text-sm text-yellow-800">Medium Risk (50-79% confidence)</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {metrics?.highRiskQueries || 0}
              </div>
              <p className="text-sm text-red-800">High Risk (&lt;50% confidence)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
          <CardDescription>Latest AI queries with compliance assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQueries.slice(0, 10).map((query) => (
              <div key={query.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {query.question.length > 100 
                      ? `${query.question.substring(0, 100)}...` 
                      : query.question
                    }
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(query.created_at).toLocaleString()}
                    </span>
                    <span>Confidence: {Math.round((query.confidence || 0) * 100)}%</span>
                  </div>
                </div>
                <div className="ml-4">
                  {getRiskBadge(query.confidence || 0)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
