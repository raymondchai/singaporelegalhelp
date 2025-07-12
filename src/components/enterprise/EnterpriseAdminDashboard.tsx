'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  Shield, 
  DollarSign, 
  Settings,
  Building,
  Activity,
  Bell,
  Download,
  RefreshCw
} from 'lucide-react'
import EnterpriseDashboard from './EnterpriseDashboard'
import TeamManagement from './TeamManagement'
import SecurityMonitoring from './SecurityMonitoring'
import BillingManagement from './BillingManagement'

interface EnterpriseAdminDashboardProps {
  organizationId?: string
  userRole: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
}

export default function EnterpriseAdminDashboard({ 
  organizationId, 
  userRole 
}: EnterpriseAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications] = useState([
    {
      id: '1',
      type: 'security',
      message: 'High risk security event detected',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'billing',
      message: 'API usage approaching limit',
      timestamp: new Date().toISOString(),
      read: false
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  // Check if user has admin access
  const hasAdminAccess = ['owner', 'admin'].includes(userRole)
  const hasManagerAccess = ['owner', 'admin', 'manager'].includes(userRole)

  if (!hasManagerAccess) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the enterprise dashboard. 
            Please contact your organization administrator.
          </p>
          <Badge variant="outline">{userRole.toUpperCase()} Role</Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Enterprise Admin</h1>
                <p className="text-gray-600">Organization Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {userRole.toUpperCase()}
              </Badge>
              
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            {hasAdminAccess && (
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <EnterpriseDashboard />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityMonitoring />
          </TabsContent>

          {hasAdminAccess && (
            <TabsContent value="billing" className="space-y-6">
              <BillingManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Quick Actions Sidebar */}
      <div className="fixed right-6 bottom-6 space-y-3">
        <Card className="w-64 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </Button>
            {hasAdminAccess && (
              <Button variant="outline" size="sm" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                View Invoice
              </Button>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="w-64 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Status</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Available
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Security</span>
              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                Monitoring
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Toast Area */}
      {unreadCount > 0 && (
        <div className="fixed top-6 right-6 z-50">
          <Card className="w-80 shadow-lg border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">New Notifications</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {notifications.filter(n => !n.read).slice(0, 2).map(notification => (
                      <div key={notification.id} className="text-xs text-gray-500 border-l-2 border-gray-200 pl-2">
                        {notification.message}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
