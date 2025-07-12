'use client'

// =====================================================
// Phase 6A: Usage Monitoring Component
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  MessageSquare, 
  HardDrive, 
  Users,
  Zap,
  Eye
} from 'lucide-react'

interface UsageMonitorProps {
  userId: string
  compact?: boolean
  showAlerts?: boolean
}

interface UsageData {
  resource_type: string
  current_usage: number
  limit: number | 'unlimited'
  percentage_used: number
  remaining: number | 'unlimited'
  status: 'safe' | 'warning' | 'critical' | 'exceeded'
}

const resourceIcons = {
  document_generation: FileText,
  ai_query: MessageSquare,
  storage_gb: HardDrive,
  team_member: Users,
  api_call: Zap,
  template_access: Eye,
}

const resourceLabels = {
  document_generation: 'Documents',
  ai_query: 'AI Queries',
  storage_gb: 'Storage (GB)',
  team_member: 'Team Members',
  api_call: 'API Calls',
  template_access: 'Template Access',
}

export function UsageMonitor({ userId, compact = false, showAlerts = true }: UsageMonitorProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUsageData()
      
      // Set up periodic refresh every 5 minutes
      const interval = setInterval(fetchUsageData, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [userId])

  const fetchUsageData = async () => {
    try {
      const response = await fetch(`/api/usage/track?userId=${userId}`)
      const data = await response.json()

      if (data.success && data.usageSummary) {
        const summary = data.usageSummary
        
        // Transform usage summary into usage data array
        const transformedData: UsageData[] = Object.entries(summary.usage).map(([resourceType, usage]) => {
          const limit = summary.limits[resourceType]
          const percentage = summary.usage_percentages[resourceType] || 0
          
          let status: UsageData['status'] = 'safe'
          if (percentage >= 100) status = 'exceeded'
          else if (percentage >= 90) status = 'critical'
          else if (percentage >= 75) status = 'warning'
          
          const remaining = limit === 'unlimited' ? 'unlimited' : Math.max(0, limit - (usage as number))
          
          return {
            resource_type: resourceType,
            current_usage: usage as number,
            limit,
            percentage_used: percentage,
            remaining,
            status,
          }
        })
        
        setUsageData(transformedData)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch usage data')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch usage data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: UsageData['status']) => {
    switch (status) {
      case 'safe': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-orange-600'
      case 'exceeded': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getProgressColor = (status: UsageData['status']) => {
    switch (status) {
      case 'safe': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-orange-500'
      case 'exceeded': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: UsageData['status']) => {
    const config = {
      safe: { label: 'Good', variant: 'default' as const },
      warning: { label: 'Warning', variant: 'secondary' as const },
      critical: { label: 'Critical', variant: 'destructive' as const },
      exceeded: { label: 'Exceeded', variant: 'destructive' as const },
    }
    return config[status]
  }

  const criticalUsage = usageData.filter(item => item.status === 'critical' || item.status === 'exceeded')
  const warningUsage = usageData.filter(item => item.status === 'warning')

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading usage data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Alerts */}
        {showAlerts && criticalUsage.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {criticalUsage.length} usage limit(s) exceeded or critical
            </AlertDescription>
          </Alert>
        )}

        {/* Compact Usage Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {usageData.map((item) => {
            const Icon = resourceIcons[item.resource_type as keyof typeof resourceIcons]
            const label = resourceLabels[item.resource_type as keyof typeof resourceLabels]
            
            return (
              <Card key={item.resource_type} className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{item.current_usage}</span>
                    <span>{item.limit === 'unlimited' ? '∞' : item.limit}</span>
                  </div>
                  {item.limit !== 'unlimited' && (
                    <Progress 
                      value={Math.min(item.percentage_used, 100)} 
                      className={`h-1 ${getProgressColor(item.status)}`}
                    />
                  )}
                  <Badge 
                    variant={getStatusBadge(item.status).variant}
                    className="text-xs"
                  >
                    {getStatusBadge(item.status).label}
                  </Badge>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Usage Alerts */}
      {showAlerts && (
        <>
          {criticalUsage.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Critical Usage Alert:</strong> You have exceeded or are near limits for:{' '}
                {criticalUsage.map(item => resourceLabels[item.resource_type as keyof typeof resourceLabels]).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {warningUsage.length > 0 && criticalUsage.length === 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Usage Warning:</strong> You are approaching limits for:{' '}
                {warningUsage.map(item => resourceLabels[item.resource_type as keyof typeof resourceLabels]).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Detailed Usage Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usageData.map((item) => {
          const Icon = resourceIcons[item.resource_type as keyof typeof resourceIcons]
          const label = resourceLabels[item.resource_type as keyof typeof resourceLabels]
          
          return (
            <Card key={item.resource_type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <Badge variant={getStatusBadge(item.status).variant}>
                    {getStatusBadge(item.status).label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{item.current_usage}</span>
                    <span className="text-sm text-gray-600">
                      of {item.limit === 'unlimited' ? 'unlimited' : item.limit}
                    </span>
                  </div>
                  
                  {item.limit !== 'unlimited' && (
                    <>
                      <Progress 
                        value={Math.min(item.percentage_used, 100)} 
                        className={`h-2 ${getProgressColor(item.status)}`}
                      />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{item.percentage_used.toFixed(1)}% used</span>
                        <span>{item.remaining} remaining</span>
                      </div>
                    </>
                  )}
                  
                  {item.limit === 'unlimited' && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unlimited usage
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
