'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Key, 
  Smartphone, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Lock,
  Globe,
  FileText,
  Download,
  Settings
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DashboardLayout from '../components/DashboardLayout'

interface SecurityStatus {
  two_factor_enabled: boolean
  password_last_changed: string
  failed_login_attempts: number
  active_sessions: number
  last_login_at: string
  account_locked_until?: string
}

interface ActivityLog {
  id: string
  action_type: string
  ip_address: string
  user_agent: string
  created_at: string
  details: any
}

interface ComplianceStatus {
  pdpa_consent: boolean
  terms_accepted: boolean
  privacy_policy_accepted: boolean
  data_retention_compliant: boolean
  audit_log_enabled: boolean
}

export default function SecurityPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [loading_security, setLoadingSecurity] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchSecurityData = async () => {
      if (!user) return

      try {
        setLoadingSecurity(true)

        // Get session for access token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Fetch security status
        const securityResponse = await fetch('/api/security/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (securityResponse.ok) {
          const securityData = await securityResponse.json()
          setSecurityStatus(securityData.security_status)
          setComplianceStatus(securityData.compliance_status)
        }

        // Fetch activity logs
        const activityResponse = await fetch('/api/security/activity', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setActivityLogs(activityData.activities || [])
        }

      } catch (error) {
        console.error('Error fetching security data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load security information',
          variant: 'destructive',
        })
      } finally {
        setLoadingSecurity(false)
      }
    }

    if (user && !loading) {
      fetchSecurityData()
    }
  }, [user, loading, toast])

  const getSecurityScore = () => {
    if (!securityStatus || !complianceStatus) return 0
    
    let score = 0
    const maxScore = 100
    
    // Two-factor authentication (30 points)
    if (securityStatus.two_factor_enabled) score += 30
    
    // Recent password change (20 points)
    const passwordAge = new Date().getTime() - new Date(securityStatus.password_last_changed).getTime()
    const daysOld = passwordAge / (1000 * 60 * 60 * 24)
    if (daysOld < 90) score += 20
    else if (daysOld < 180) score += 10
    
    // No failed login attempts (15 points)
    if (securityStatus.failed_login_attempts === 0) score += 15
    
    // Compliance status (35 points)
    if (complianceStatus.pdpa_consent) score += 10
    if (complianceStatus.terms_accepted) score += 10
    if (complianceStatus.privacy_policy_accepted) score += 5
    if (complianceStatus.data_retention_compliant) score += 5
    if (complianceStatus.audit_log_enabled) score += 5
    
    return Math.min(score, maxScore)
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'login':
      case 'logout':
        return <Key className="h-4 w-4" />
      case 'password_changed':
        return <Lock className="h-4 w-4" />
      case 'two_factor_enabled':
      case 'two_factor_disabled':
        return <Smartphone className="h-4 w-4" />
      case 'profile_updated':
        return <Settings className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatActionType = (actionType: string) => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading || loading_security) {
    return (
      <DashboardLayout title="Security" subtitle="Loading security information...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const securityScore = getSecurityScore()

  return (
    <DashboardLayout
      title="Security & Compliance"
      subtitle="Monitor your account security and compliance status"
    >
      {/* Security Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getSecurityScoreColor(securityScore)}`}>
                {securityScore}%
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Two-Factor Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {securityStatus?.two_factor_enabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Disabled</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStatus?.active_sessions || 0}</div>
            <p className="text-sm text-gray-600">Current sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Failed Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{securityStatus?.failed_login_attempts || 0}</div>
              {(securityStatus?.failed_login_attempts || 0) > 0 && (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">Recent attempts</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {securityStatus?.account_locked_until && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">Account Security Alert</h4>
                <p className="text-sm text-red-800">
                  Your account is temporarily locked until {new Date(securityStatus.account_locked_until).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Authentication Security</span>
                </CardTitle>
                <CardDescription>
                  Manage your authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add extra security to your account</p>
                  </div>
                  <Badge variant={securityStatus?.two_factor_enabled ? 'default' : 'secondary'}>
                    {securityStatus?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-gray-600">
                      Last changed: {securityStatus?.password_last_changed ? 
                        new Date(securityStatus.password_last_changed).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Account Access</span>
                </CardTitle>
                <CardDescription>
                  Monitor account access and sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Last Login</h4>
                    <p className="text-sm text-gray-600">
                      {securityStatus?.last_login_at ? 
                        new Date(securityStatus.last_login_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Active Sessions</h4>
                    <p className="text-sm text-gray-600">Devices currently signed in</p>
                  </div>
                  <Badge variant="outline">{securityStatus?.active_sessions || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Your recent account activity and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getActionTypeIcon(log.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{formatActionType(log.action_type)}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {log.ip_address} • {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Compliance Status</span>
              </CardTitle>
              <CardDescription>
                Your compliance with Singapore legal requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">PDPA Consent</h4>
                    <p className="text-sm text-gray-600">Personal Data Protection Act compliance</p>
                  </div>
                  <Badge variant={complianceStatus?.pdpa_consent ? 'default' : 'secondary'}>
                    {complianceStatus?.pdpa_consent ? 'Compliant' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600">Platform terms acceptance</p>
                  </div>
                  <Badge variant={complianceStatus?.terms_accepted ? 'default' : 'secondary'}>
                    {complianceStatus?.terms_accepted ? 'Accepted' : 'Pending'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Data Retention</h4>
                    <p className="text-sm text-gray-600">Data retention policy compliance</p>
                  </div>
                  <Badge variant={complianceStatus?.data_retention_compliant ? 'default' : 'secondary'}>
                    {complianceStatus?.data_retention_compliant ? 'Compliant' : 'Review Required'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Audit Logging</h4>
                    <p className="text-sm text-gray-600">Activity audit trail enabled</p>
                  </div>
                  <Badge variant={complianceStatus?.audit_log_enabled ? 'default' : 'secondary'}>
                    {complianceStatus?.audit_log_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Session management coming soon</p>
                <p className="text-sm text-gray-400">View and manage all your active sessions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
