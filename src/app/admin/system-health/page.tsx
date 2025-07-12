'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Database,
  FileText,
  UserCheck,
  CreditCard,
  Clock
} from 'lucide-react'

interface HealthCheckResult {
  component: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
  response_time_ms?: number
}

interface HealthCheckResponse {
  request_id: string
  timestamp: string
  overall_status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
  success_rate: string
  summary: {
    total_tests: number
    passed: number
    warnings: number
    failed: number
  }
  results: HealthCheckResult[]
  recommendations: string[]
}

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runHealthCheck = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/system/health-check')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Health check failed')
      }
      
      setHealthData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'HEALTHY':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'WARNING':
      case 'DEGRADED':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'FAIL':
      case 'UNHEALTHY':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'HEALTHY':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>
      case 'WARNING':
      case 'DEGRADED':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>
      case 'FAIL':
      case 'UNHEALTHY':
        return <Badge className="bg-red-100 text-red-800">FAIL</Badge>
      default:
        return <Badge variant="outline">UNKNOWN</Badge>
    }
  }

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'Profile API':
        return <UserCheck className="h-5 w-5" />
      case 'Document Management':
        return <FileText className="h-5 w-5" />
      case 'Registration System':
        return <UserCheck className="h-5 w-5" />
      case 'Subscription Display':
        return <CreditCard className="h-5 w-5" />
      case 'Database Performance':
        return <Database className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Check</h1>
          <p className="text-gray-600">Monitor critical platform components and verify fixes</p>
        </div>
        <Button 
          onClick={runHealthCheck} 
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Running...' : 'Run Health Check'}</span>
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span>Health check failed: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {healthData && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(healthData.overall_status)}
                <span>Overall System Status</span>
              </CardTitle>
              <CardDescription>
                Last checked: {new Date(healthData.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{healthData.summary.passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{healthData.summary.warnings}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{healthData.summary.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{healthData.success_rate}</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Health</span>
                  <span>{healthData.success_rate}</span>
                </div>
                <Progress 
                  value={parseInt(healthData.success_rate)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Component Results */}
          <div className="grid md:grid-cols-2 gap-6">
            {healthData.results.map((result, index) => (
              <Card key={index} className={`${
                result.status === 'FAIL' ? 'border-red-200' : 
                result.status === 'WARNING' ? 'border-yellow-200' : 
                'border-green-200'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getComponentIcon(result.component)}
                      <span>{result.component}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{result.message}</p>
                  
                  {result.response_time_ms && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Response time: {result.response_time_ms}ms</span>
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="bg-gray-50 p-3 rounded text-xs">
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommendations */}
          {healthData.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actions to improve system health</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {healthData.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!healthData && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Click "Run Health Check" to verify system status</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
