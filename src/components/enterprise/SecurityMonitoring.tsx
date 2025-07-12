'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock,
  Activity,
  Globe,
  User,
  Clock,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface SecurityEvent {
  id: string
  event_type: string
  event_category: string
  action: string
  result: 'success' | 'failure' | 'blocked'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  ip_address: string
  user_agent: string
  created_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
  details: any
}

interface SecurityMetrics {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  blockedEvents: number
  highRiskEvents: number
  criticalEvents: number
  uniqueIPs: number
  suspiciousActivities: number
}

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626'
}

const RESULT_COLORS = {
  success: '#10B981',
  failure: '#EF4444',
  blocked: '#F59E0B'
}

export default function SecurityMonitoring() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('24h')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [riskLevelFilter, setRiskLevelFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    loadSecurityData()
  }, [period, eventTypeFilter, riskLevelFilter, resultFilter])

  const loadSecurityData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        period,
        ...(eventTypeFilter !== 'all' && { event_type: eventTypeFilter }),
        ...(riskLevelFilter !== 'all' && { risk_level: riskLevelFilter }),
        ...(resultFilter !== 'all' && { result: resultFilter })
      })

      const response = await fetch(`/api/v1/enterprise/security/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load security data')
      }

      const data = await response.json()
      setEvents(data.data.events)
      setMetrics(data.data.metrics)
    } catch (error) {
      console.error('Error loading security data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load security monitoring data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const exportSecurityReport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/security/export?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export security report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-report-${period}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Security report exported successfully'
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: 'Error',
        description: 'Failed to export security report',
        variant: 'destructive'
      })
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'failure': return 'bg-red-100 text-red-800'
      case 'blocked': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Eye className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Security Monitoring</h2>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Monitoring</h2>
          <p className="text-gray-600">Monitor and analyze security events across your organization</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportSecurityReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadSecurityData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    {metrics.successfulEvents} successful
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Risk Events</p>
                  <p className="text-2xl font-bold">{metrics.highRiskEvents + metrics.criticalEvents}</p>
                  <p className="text-xs text-gray-500">
                    {metrics.criticalEvents} critical
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed Events</p>
                  <p className="text-2xl font-bold">{metrics.failedEvents}</p>
                  <p className="text-xs text-gray-500">
                    {metrics.blockedEvents} blocked
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique IPs</p>
                  <p className="text-2xl font-bold">{metrics.uniqueIPs}</p>
                  <p className="text-xs text-gray-500">
                    {metrics.suspiciousActivities} suspicious
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Events by Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Low', value: (metrics?.totalEvents || 0) - (metrics?.highRiskEvents || 0) - (metrics?.criticalEvents || 0), fill: RISK_COLORS.low },
                    { name: 'Medium', value: Math.floor((metrics?.totalEvents || 0) * 0.3), fill: RISK_COLORS.medium },
                    { name: 'High', value: metrics?.highRiskEvents || 0, fill: RISK_COLORS.high },
                    { name: 'Critical', value: metrics?.criticalEvents || 0, fill: RISK_COLORS.critical }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events by Result</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Success', value: metrics?.successfulEvents || 0, fill: RESULT_COLORS.success },
                { name: 'Failure', value: metrics?.failedEvents || 0, fill: RESULT_COLORS.failure },
                { name: 'Blocked', value: metrics?.blockedEvents || 0, fill: RESULT_COLORS.blocked }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="authorization">Authorization</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
                <SelectItem value="api_access">API Access</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 20).map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{event.event_type}</p>
                      <p className="text-sm text-gray-600">{event.action}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.user ? (
                      <div>
                        <p className="font-medium">{event.user.full_name}</p>
                        <p className="text-sm text-gray-600">{event.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">Anonymous</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRiskLevelColor(event.risk_level)}>
                      <div className="flex items-center gap-1">
                        {getRiskIcon(event.risk_level)}
                        {event.risk_level}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getResultColor(event.result)}>
                      {event.result}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{event.ip_address}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No security events found</p>
              <p className="text-sm">Try adjusting your filters or time period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
