'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Phone,
  Mail,
  Calendar,
  User,
  Database,
  Eye,
  Edit,
  Download
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataBreachIncident {
  id: string
  incident_title: string
  incident_description: string
  breach_type: 'unauthorized_access' | 'data_theft' | 'accidental_disclosure' | 'system_compromise' | 'insider_threat' | 'third_party_breach'
  affected_data_types: string[]
  estimated_affected_records: number
  data_sensitivity: 'low' | 'medium' | 'high' | 'critical'
  discovered_at: string
  occurred_at?: string
  contained_at?: string
  impact_assessment?: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  immediate_actions_taken?: string
  containment_measures?: string
  notification_required: boolean
  authorities_notified: boolean
  authorities_notified_at?: string
  status: 'investigating' | 'contained' | 'resolved' | 'closed'
  incident_manager?: {
    id: string
    full_name: string
    email: string
  }
  created_at: string
}

export default function DataBreachManagement() {
  const [incidents, setIncidents] = useState<DataBreachIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<DataBreachIncident | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [newIncident, setNewIncident] = useState({
    incident_title: '',
    incident_description: '',
    breach_type: 'unauthorized_access' as const,
    affected_data_types: [] as string[],
    estimated_affected_records: 0,
    data_sensitivity: 'medium' as const,
    discovered_at: new Date().toISOString().slice(0, 16),
    occurred_at: '',
    impact_assessment: '',
    risk_level: 'medium' as const,
    immediate_actions_taken: '',
    notification_required: false
  })
  const { toast } = useToast()

  useEffect(() => {
    loadIncidents()
  }, [])

  const loadIncidents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/security/data-breaches', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load data breach incidents')
      }

      const data = await response.json()
      setIncidents(data.data.incidents)
    } catch (error) {
      console.error('Error loading incidents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data breach incidents',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIncident = async () => {
    if (!newIncident.incident_title || !newIncident.incident_description) {
      toast({
        title: 'Error',
        description: 'Title and description are required',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/security/data-breaches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newIncident),
      })

      if (!response.ok) {
        throw new Error('Failed to create data breach incident')
      }

      const data = await response.json()
      setIncidents(prev => [data.data.incident, ...prev])
      setShowCreateDialog(false)
      setNewIncident({
        incident_title: '',
        incident_description: '',
        breach_type: 'unauthorized_access',
        affected_data_types: [],
        estimated_affected_records: 0,
        data_sensitivity: 'medium',
        discovered_at: new Date().toISOString().slice(0, 16),
        occurred_at: '',
        impact_assessment: '',
        risk_level: 'medium',
        immediate_actions_taken: '',
        notification_required: false
      })

      toast({
        title: 'Success',
        description: 'Data breach incident created successfully'
      })
    } catch (error) {
      console.error('Error creating incident:', error)
      toast({
        title: 'Error',
        description: 'Failed to create data breach incident',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/security/data-breaches/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update incident status')
      }

      setIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId ? { ...incident, status: status as any } : incident
        )
      )

      toast({
        title: 'Success',
        description: 'Incident status updated successfully'
      })
    } catch (error) {
      console.error('Error updating incident:', error)
      toast({
        title: 'Error',
        description: 'Failed to update incident status',
        variant: 'destructive'
      })
    }
  }

  const handleNotifyAuthorities = async (incidentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/security/data-breaches/${incidentId}/notify-authorities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to notify authorities')
      }

      setIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId 
            ? { 
                ...incident, 
                authorities_notified: true, 
                authorities_notified_at: new Date().toISOString() 
              } 
            : incident
        )
      )

      toast({
        title: 'Success',
        description: 'Authorities have been notified'
      })
    } catch (error) {
      console.error('Error notifying authorities:', error)
      toast({
        title: 'Error',
        description: 'Failed to notify authorities',
        variant: 'destructive'
      })
    }
  }

  const exportIncidentReport = async (incidentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/security/data-breaches/${incidentId}/export`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export incident report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data-breach-incident-${incidentId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Incident report exported successfully'
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: 'Error',
        description: 'Failed to export incident report',
        variant: 'destructive'
      })
    }
  }

  const getBreachTypeColor = (type: string) => {
    switch (type) {
      case 'unauthorized_access': return 'bg-red-100 text-red-800'
      case 'data_theft': return 'bg-red-100 text-red-800'
      case 'accidental_disclosure': return 'bg-yellow-100 text-yellow-800'
      case 'system_compromise': return 'bg-red-100 text-red-800'
      case 'insider_threat': return 'bg-orange-100 text-orange-800'
      case 'third_party_breach': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'contained': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'investigating': return <AlertTriangle className="h-4 w-4" />
      case 'contained': return <Shield className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const isNotificationOverdue = (discoveredAt: string, notified: boolean) => {
    const discoveryDate = new Date(discoveredAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - discoveryDate.getTime()) / (1000 * 60 * 60)
    return hoursDiff > 72 && !notified // 72 hours = GDPR requirement
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Data Breach Management</h2>
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
          <h2 className="text-2xl font-bold">Data Breach Management</h2>
          <p className="text-gray-600">Manage and track data security incidents</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Data Breach Incident</DialogTitle>
              <DialogDescription>
                Create a new data breach incident report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="incident_title">Incident Title</Label>
                <Input
                  id="incident_title"
                  value={newIncident.incident_title}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, incident_title: e.target.value }))}
                  placeholder="Brief description of the incident"
                />
              </div>

              <div>
                <Label htmlFor="breach_type">Breach Type</Label>
                <Select 
                  value={newIncident.breach_type} 
                  onValueChange={(value: any) => setNewIncident(prev => ({ ...prev, breach_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                    <SelectItem value="data_theft">Data Theft</SelectItem>
                    <SelectItem value="accidental_disclosure">Accidental Disclosure</SelectItem>
                    <SelectItem value="system_compromise">System Compromise</SelectItem>
                    <SelectItem value="insider_threat">Insider Threat</SelectItem>
                    <SelectItem value="third_party_breach">Third Party Breach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_sensitivity">Data Sensitivity</Label>
                  <Select 
                    value={newIncident.data_sensitivity} 
                    onValueChange={(value: any) => setNewIncident(prev => ({ ...prev, data_sensitivity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="risk_level">Risk Level</Label>
                  <Select 
                    value={newIncident.risk_level} 
                    onValueChange={(value: any) => setNewIncident(prev => ({ ...prev, risk_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="estimated_affected_records">Estimated Affected Records</Label>
                <Input
                  id="estimated_affected_records"
                  type="number"
                  value={newIncident.estimated_affected_records}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, estimated_affected_records: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discovered_at">Discovered At</Label>
                  <Input
                    id="discovered_at"
                    type="datetime-local"
                    value={newIncident.discovered_at}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, discovered_at: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="occurred_at">Occurred At (if known)</Label>
                  <Input
                    id="occurred_at"
                    type="datetime-local"
                    value={newIncident.occurred_at}
                    onChange={(e) => setNewIncident(prev => ({ ...prev, occurred_at: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="incident_description">Incident Description</Label>
                <Textarea
                  id="incident_description"
                  value={newIncident.incident_description}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, incident_description: e.target.value }))}
                  placeholder="Detailed description of what happened..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="immediate_actions_taken">Immediate Actions Taken</Label>
                <Textarea
                  id="immediate_actions_taken"
                  value={newIncident.immediate_actions_taken}
                  onChange={(e) => setNewIncident(prev => ({ ...prev, immediate_actions_taken: e.target.value }))}
                  placeholder="What immediate steps were taken to address the incident..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notification_required"
                  checked={newIncident.notification_required}
                  onCheckedChange={(checked) => setNewIncident(prev => ({ ...prev, notification_required: checked }))}
                />
                <Label htmlFor="notification_required">Regulatory notification required</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateIncident} className="flex-1">
                Create Incident Report
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incident Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Incidents</p>
                <p className="text-2xl font-bold">
                  {incidents.filter(i => ['investigating', 'contained'].includes(i.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Notification Overdue</p>
                <p className="text-2xl font-bold">
                  {incidents.filter(i => 
                    i.notification_required && isNotificationOverdue(i.discovered_at, i.authorities_notified)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Database className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Records Affected</p>
                <p className="text-2xl font-bold">
                  {incidents.reduce((sum, i) => sum + i.estimated_affected_records, 0).toLocaleString()}
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
                <p className="text-sm text-gray-600">Resolved This Month</p>
                <p className="text-2xl font-bold">
                  {incidents.filter(i => 
                    i.status === 'resolved' && 
                    new Date(i.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Breach Incidents ({incidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected Records</TableHead>
                <TableHead>Discovered</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{incident.incident_title}</p>
                      <p className="text-sm text-gray-600 truncate max-w-xs">
                        {incident.incident_description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getBreachTypeColor(incident.breach_type)}>
                      {incident.breach_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRiskLevelColor(incident.risk_level)}>
                      {incident.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(incident.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(incident.status)}
                          {incident.status}
                        </div>
                      </Badge>
                      {incident.notification_required && !incident.authorities_notified && (
                        <Badge variant="destructive" className="text-xs">
                          Notify Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {incident.estimated_affected_records.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(incident.discovered_at).toLocaleDateString()}
                      {incident.notification_required && 
                       isNotificationOverdue(incident.discovered_at, incident.authorities_notified) && (
                        <div className="text-red-600 text-xs">Overdue</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {incident.notification_required && !incident.authorities_notified && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleNotifyAuthorities(incident.id)}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => exportIncidentReport(incident.id)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {incidents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data breach incidents reported</p>
              <p className="text-sm">This is good news for your organization's security!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Incident Title</Label>
                  <p className="font-medium">{selectedIncident.incident_title}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedIncident.status)}>
                    {selectedIncident.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-700 mt-1">{selectedIncident.incident_description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Breach Type</Label>
                  <Badge className={getBreachTypeColor(selectedIncident.breach_type)}>
                    {selectedIncident.breach_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <Badge className={getRiskLevelColor(selectedIncident.risk_level)}>
                    {selectedIncident.risk_level}
                  </Badge>
                </div>
                <div>
                  <Label>Affected Records</Label>
                  <p className="font-medium">{selectedIncident.estimated_affected_records.toLocaleString()}</p>
                </div>
              </div>

              {selectedIncident.immediate_actions_taken && (
                <div>
                  <Label>Immediate Actions Taken</Label>
                  <p className="text-sm text-gray-700 mt-1">{selectedIncident.immediate_actions_taken}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Incident
                </Button>
                <Button variant="outline" onClick={() => exportIncidentReport(selectedIncident.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
