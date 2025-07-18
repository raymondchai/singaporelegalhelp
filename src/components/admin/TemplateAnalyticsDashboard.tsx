'use client'

import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Download, 
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  timeframe: string
  dateRange: {
    start: string
    end: string
  }
  overallStats: {
    totalGenerations: number
    successfulGenerations: number
    failedGenerations: number
    successRate: string
    uniqueUsers: number
    uniqueTemplates: number
    avgGenerationTime: number
    formatBreakdown: {
      docx: number
      pdf: number
    }
  }
  usageTrends: Array<{
    date: string
    generations: number
    success: number
    failed: number
  }>
  popularTemplates: Array<{
    template_id: string
    title: string
    category: string
    subscription_tier: string
    price_sgd: number
    generations: number
  }>
  userBehavior: {
    totalUsers: number
    avgGenerationsPerUser: number
    avgTemplatesPerUser: number
    userSegments: {
      powerUsers: number
      regularUsers: number
      casualUsers: number
    }
  }
  errorAnalytics: {
    totalErrors: number
    topErrors: Array<{
      error: string
      count: number
    }>
  }
}

export default function TemplateAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe, selectedCategory, selectedTemplate])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        timeframe,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedTemplate && { template_id: selectedTemplate })
      })

      const response = await fetch(`/api/admin/analytics/templates?${params}`)
      const result = await response.json()

      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        console.error('Analytics fetch failed:', result.error)
      }
    } catch (error) {
      console.error('Analytics fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue' 
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: any
    trend?: string
    color?: string
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-sm text-green-600">{trend}</span>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Unable to load analytics data. Please try again.</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Analytics</h2>
          <p className="text-gray-600">
            Document generation insights and usage statistics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Generations"
          value={analyticsData.overallStats.totalGenerations.toLocaleString()}
          subtitle={`${analyticsData.overallStats.successRate}% success rate`}
          icon={Download}
          color="blue"
        />
        
        <StatCard
          title="Active Users"
          value={analyticsData.userBehavior.totalUsers.toLocaleString()}
          subtitle={`${analyticsData.userBehavior.avgGenerationsPerUser} avg per user`}
          icon={Users}
          color="green"
        />
        
        <StatCard
          title="Templates Used"
          value={analyticsData.overallStats.uniqueTemplates}
          subtitle={`${analyticsData.userBehavior.avgTemplatesPerUser} avg per user`}
          icon={FileText}
          color="purple"
        />
        
        <StatCard
          title="Avg Generation Time"
          value={`${analyticsData.overallStats.avgGenerationTime}ms`}
          subtitle="Processing speed"
          icon={BarChart3}
          color="orange"
        />
      </div>

      {/* Format Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Output Format Distribution</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.overallStats.formatBreakdown.docx}
            </div>
            <div className="text-sm text-gray-600">DOCX Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {analyticsData.overallStats.formatBreakdown.pdf}
            </div>
            <div className="text-sm text-gray-600">PDF Documents</div>
          </div>
        </div>
      </div>

      {/* Popular Templates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Most Popular Templates</h3>
        <div className="space-y-3">
          {analyticsData.popularTemplates.slice(0, 5).map((template, index) => (
            <div key={template.template_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                <div>
                  <div className="font-medium text-gray-900">{template.title}</div>
                  <div className="text-sm text-gray-600">
                    {template.category} • {template.subscription_tier}
                    {template.price_sgd > 0 && ` • $${template.price_sgd} SGD`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">{template.generations}</div>
                <div className="text-sm text-gray-600">generations</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Segments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Segments</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analyticsData.userBehavior.userSegments.powerUsers}
            </div>
            <div className="text-sm text-gray-600">Power Users</div>
            <div className="text-xs text-gray-500">10+ generations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analyticsData.userBehavior.userSegments.regularUsers}
            </div>
            <div className="text-sm text-gray-600">Regular Users</div>
            <div className="text-xs text-gray-500">3-9 generations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {analyticsData.userBehavior.userSegments.casualUsers}
            </div>
            <div className="text-sm text-gray-600">Casual Users</div>
            <div className="text-xs text-gray-500">1-2 generations</div>
          </div>
        </div>
      </div>

      {/* Error Analysis */}
      {analyticsData.errorAnalytics.totalErrors > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Error Analysis</h3>
          <div className="space-y-3">
            {analyticsData.errorAnalytics.topErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="text-sm text-gray-900">{error.error}</div>
                </div>
                <div className="text-sm font-medium text-red-600">{error.count} occurrences</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Trends Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Trends</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Chart visualization would go here</p>
            <p className="text-sm text-gray-500">
              {analyticsData.usageTrends.length} data points available
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
