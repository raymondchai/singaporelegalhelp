'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Download,
  Trash2,
  Eye,
  Calendar,
  Search
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataSubjectRequest {
  id: string
  request_type: 'access' | 'rectification' | 'erasure' | 'restrict_processing' | 'data_portability' | 'object_processing' | 'withdraw_consent'
  data_subject_email: string
  data_subject_name?: string
  identity_verified: boolean
  request_description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'partially_completed'
  received_at: string
  due_date: string
  completed_at?: string
  response_notes?: string
}

interface DataProcessingRecord {
  id: string
  data_subject_email: string
  data_subject_type: 'user' | 'client' | 'employee' | 'vendor'
  processing_purpose: string
  legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests'
  data_categories: string[]
  collected_at: string
  retention_period_months?: number
  scheduled_deletion_at?: string
  consent_given: boolean
  status: 'active' | 'restricted' | 'deleted' | 'anonymized'
}

interface ComplianceAlert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed'
  triggered_at: string
  due_date?: string
}

export default function GDPRCompliance() {
  const [activeTab, setActiveTab] = useState('requests')
  const [dataRequests, setDataRequests] = useState<DataSubjectRequest[]>([])
  const [processingRecords, setProcessingRecords] = useState<DataProcessingRecord[]>([])
  const [complianceAlerts, setComplianceAlerts] = useState<ComplianceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [newRequest, setNewRequest] = useState({
    request_type: 'access' as const,
    data_subject_email: '',
    data_subject_name: '',
    request_description: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadGDPRData()
  }, [])

  const loadGDPRData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Load data subject requests
      const requestsResponse = await fetch('/api/v1/enterprise/compliance/data-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        setDataRequests(requestsData.data.requests)
      }

      // Load processing records
      const recordsResponse = await fetch('/api/v1/enterprise/compliance/processing-records', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setProcessingRecords(recordsData.data.records)
      }

      // Load compliance alerts
      const alertsResponse = await fetch('/api/v1/enterprise/compliance/alerts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json()
        setComplianceAlerts(alertsData.data.alerts)
      }

    } catch (error) {
      console.error('Error loading GDPR data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load compliance data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    if (!newRequest.data_subject_email || !newRequest.request_type) {
      toast({
        title: 'Error',
        description: 'Email and request type are required',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/compliance/data-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newRequest),
      })

      if (!response.ok) {
        throw new Error('Failed to create data subject request')
      }

      const data = await response.json()
      setDataRequests(prev => [data.data.request, ...prev])
      setShowRequestDialog(false)
      setNewRequest({
        request_type: 'access',
        data_subject_email: '',
        data_subject_name: '',
        request_description: ''
      })

      toast({
        title: 'Success',
        description: 'Data subject request created successfully'
      })
    } catch (error) {
      console.error('Error creating request:', error)
      toast({
        title: 'Error',
        description: 'Failed to create data subject request',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateRequestStatus = async (requestId: string, status: string, responseNotes?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/compliance/data-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status, response_notes: responseNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update request status')
      }

      setDataRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: status as any, response_notes: responseNotes }
            : request
        )
      )

      toast({
        title: 'Success',
        description: 'Request status updated successfully'
      })
    } catch (error) {
      console.error('Error updating request:', error)
      toast({
        title: 'Error',
        description: 'Failed to update request status',
        variant: 'destructive'
      })
    }
  }

  const exportComplianceReport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/compliance/export', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export compliance report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gdpr-compliance-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Compliance report exported successfully'
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: 'Error',
        description: 'Failed to export compliance report',
        variant: 'destructive'
      })
    }
  }

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'access': return 'bg-blue-100 text-blue-800'
      case 'rectification': return 'bg-yellow-100 text-yellow-800'
      case 'erasure': return 'bg-red-100 text-red-800'
      case 'restrict_processing': return 'bg-orange-100 text-orange-800'
      case 'data_portability': return 'bg-green-100 text-green-800'
      case 'object_processing': return 'bg-purple-100 text-purple-800'
      case 'withdraw_consent': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'partially_completed': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const filteredRequests = dataRequests.filter(request => {
    const matchesSearch = request.data_subject_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.data_subject_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">GDPR Compliance</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <h2 className="text-2xl font-bold">GDPR Compliance</h2>
          <p className="text-gray-600">Manage data protection and privacy compliance</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={exportComplianceReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Data Subject Request</DialogTitle>
                <DialogDescription>
                  Create a new GDPR data subject request
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="request_type">Request Type</Label>
                  <Select 
                    value={newRequest.request_type} 
                    onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, request_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="access">Data Access Request</SelectItem>
                      <SelectItem value="rectification">Data Rectification</SelectItem>
                      <SelectItem value="erasure">Data Erasure (Right to be Forgotten)</SelectItem>
                      <SelectItem value="restrict_processing">Restrict Processing</SelectItem>
                      <SelectItem value="data_portability">Data Portability</SelectItem>
                      <SelectItem value="object_processing">Object to Processing</SelectItem>
                      <SelectItem value="withdraw_consent">Withdraw Consent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_subject_email">Data Subject Email</Label>
                  <Input
                    id="data_subject_email"
                    type="email"
                    value={newRequest.data_subject_email}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, data_subject_email: e.target.value }))}
                    placeholder="subject@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="data_subject_name">Data Subject Name (Optional)</Label>
                  <Input
                    id="data_subject_name"
                    value={newRequest.data_subject_name}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, data_subject_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="request_description">Request Description</Label>
                  <Textarea
                    id="request_description"
                    value={newRequest.request_description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, request_description: e.target.value }))}
                    placeholder="Describe the specific request..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateRequest} className="flex-1">
                    Create Request
                  </Button>
                  <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold">
                  {dataRequests.filter(r => ['pending', 'in_progress'].includes(r.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue Requests</p>
                <p className="text-2xl font-bold">
                  {dataRequests.filter(r => isOverdue(r.due_date) && r.status !== 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed This Month</p>
                <p className="text-2xl font-bold">
                  {dataRequests.filter(r => r.status === 'completed' && 
                    new Date(r.completed_at || '').getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Open Alerts</p>
                <p className="text-2xl font-bold">
                  {complianceAlerts.filter(a => a.status === 'open').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="processing">Processing Records</TabsTrigger>
          <TabsTrigger value="alerts">Compliance Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Data Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Badge className={getRequestTypeColor(request.request_type)}>
                          {request.request_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.data_subject_email}</p>
                          {request.data_subject_name && (
                            <p className="text-sm text-gray-600">{request.data_subject_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        {!request.identity_verified && (
                          <Badge variant="outline" className="ml-2">
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm ${isOverdue(request.due_date) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {new Date(request.due_date).toLocaleDateString()}
                          {isOverdue(request.due_date) && request.status !== 'completed' && (
                            <span className="ml-1">(Overdue)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          {request.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, 'in_progress')}
                            >
                              Start
                            </Button>
                          )}
                          {request.status === 'in_progress' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, 'completed', 'Request fulfilled')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data subject requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Data processing records will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {complianceAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert.triggered_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {complianceAlerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No compliance alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
