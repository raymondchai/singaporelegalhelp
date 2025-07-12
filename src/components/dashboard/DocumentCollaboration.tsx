'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// Using simple checkbox instead of Switch component
import { useToast } from '@/components/ui/use-toast'
import {
  Users,
  Share2,
  Link,
  Mail,
  Eye,
  Edit,
  Shield,
  Clock,
  Copy,
  Trash2,
  UserPlus,
  Globe,
  Lock,
  Calendar,
  Activity
} from 'lucide-react'
import { EnhancedDocument } from '@/types/dashboard'
import { useAuth } from '@/contexts/auth-context'

interface Collaborator {
  id: string
  userId: string
  name: string
  email: string
  permission: 'view' | 'edit' | 'admin'
  addedAt: string
  lastAccessed?: string
  isActive: boolean
}

interface ShareLink {
  id: string
  token: string
  permission: 'view' | 'edit'
  expiresAt?: string
  maxAccess?: number
  accessCount: number
  isActive: boolean
  createdAt: string
}

interface DocumentCollaborationProps {
  document: EnhancedDocument
  onUpdateSharing: (documentId: string, settings: any) => Promise<void>
  onAddCollaborator: (documentId: string, email: string, permission: string) => Promise<void>
  onRemoveCollaborator: (documentId: string, collaboratorId: string) => Promise<void>
  onUpdateCollaboratorPermission: (documentId: string, collaboratorId: string, permission: string) => Promise<void>
}

export default function DocumentCollaboration({
  document,
  onUpdateSharing,
  onAddCollaborator,
  onRemoveCollaborator,
  onUpdateCollaboratorPermission
}: DocumentCollaborationProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [currentAccessLevel, setCurrentAccessLevel] = useState<'private' | 'team' | 'shared' | 'public'>('private')
  
  // Add collaborator form
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('')
  const [newCollaboratorPermission, setNewCollaboratorPermission] = useState<'view' | 'edit'>('view')
  
  // Share link form
  const [linkPermission, setLinkPermission] = useState<'view' | 'edit'>('view')
  const [linkExpiry, setLinkExpiry] = useState<string>('')
  const [linkMaxAccess, setLinkMaxAccess] = useState<number | undefined>()

  useEffect(() => {
    loadCollaborationData()
  }, [document.id])

  const loadCollaborationData = async () => {
    try {
      setLoading(true)
      const [collaboratorsRes, linksRes] = await Promise.all([
        fetch(`/api/documents/${document.id}/collaborators`),
        fetch(`/api/documents/${document.id}/share-links`)
      ])

      if (collaboratorsRes.ok) {
        const collaboratorsData = await collaboratorsRes.json()
        setCollaborators(collaboratorsData.collaborators || [])
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json()
        setShareLinks(linksData.links || [])
      }
    } catch (error) {
      console.error('Error loading collaboration data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    try {
      await onAddCollaborator(document.id, newCollaboratorEmail, newCollaboratorPermission)
      setNewCollaboratorEmail('')
      setNewCollaboratorPermission('view')
      setShowAddDialog(false)
      await loadCollaborationData()
      
      toast({
        title: 'Success',
        description: 'Collaborator added successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add collaborator',
        variant: 'destructive'
      })
    }
  }

  const handleCreateShareLink = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission: linkPermission,
          expiresAt: linkExpiry || undefined,
          maxAccess: linkMaxAccess
        })
      })

      if (response.ok) {
        setLinkPermission('view')
        setLinkExpiry('')
        setLinkMaxAccess(undefined)
        setShowLinkDialog(false)
        await loadCollaborationData()
        
        toast({
          title: 'Success',
          description: 'Share link created successfully'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive'
      })
    }
  }

  const handleCopyLink = async (link: ShareLink) => {
    const fullUrl = `${window.location.origin}/shared/${link.token}`
    await navigator.clipboard.writeText(fullUrl)
    
    toast({
      title: 'Link Copied',
      description: 'Share link copied to clipboard'
    })
  }

  const handleToggleAccess = async (accessLevel: 'private' | 'team' | 'shared' | 'public') => {
    try {
      await onUpdateSharing(document.id, { access_level: accessLevel })
      setCurrentAccessLevel(accessLevel)
      toast({
        title: 'Success',
        description: 'Sharing settings updated'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sharing settings',
        variant: 'destructive'
      })
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'edit':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'view':
        return <Eye className="h-4 w-4 text-green-500" />
      default:
        return <Eye className="h-4 w-4 text-gray-500" />
    }
  }

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'shared':
        return <Link className="h-4 w-4" />
      case 'team':
        return <Users className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration & Sharing
          </h3>
          <p className="text-sm text-gray-600">
            Manage document access and collaborate with others
          </p>
        </div>
      </div>

      {/* Access Level Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getAccessLevelIcon('private')}
            Access Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                currentAccessLevel === 'private' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleToggleAccess('private')}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Private</p>
                  <p className="text-sm text-gray-500">Only you can access</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                currentAccessLevel === 'shared' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleToggleAccess('shared')}
            >
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Shared</p>
                  <p className="text-sm text-gray-500">Specific people can access</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators */}
      {currentAccessLevel !== 'private' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Collaborators</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Collaborator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="permission">Permission Level</Label>
                    <Select
                      value={newCollaboratorPermission}
                      onValueChange={(value: 'view' | 'edit') => setNewCollaboratorPermission(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only</SelectItem>
                        <SelectItem value="edit">Can Edit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCollaborator}>
                      Add Collaborator
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {collaborators.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No collaborators yet</p>
                <p className="text-sm text-gray-400">Add people to start collaborating</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collaborators.map(collaborator => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{collaborator.name}</p>
                        <p className="text-sm text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getPermissionIcon(collaborator.permission)}
                        {collaborator.permission}
                      </Badge>
                      
                      <Select
                        value={collaborator.permission}
                        onValueChange={(value) => onUpdateCollaboratorPermission(document.id, collaborator.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCollaborator(document.id, collaborator.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Share Links */}
      {currentAccessLevel !== 'private' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Share Links</CardTitle>
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Link className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Share Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linkPermission">Permission Level</Label>
                    <Select
                      value={linkPermission}
                      onValueChange={(value: 'view' | 'edit') => setLinkPermission(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only</SelectItem>
                        <SelectItem value="edit">Can Edit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                    <Input
                      id="expiry"
                      type="datetime-local"
                      value={linkExpiry}
                      onChange={(e) => setLinkExpiry(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxAccess">Max Access Count (Optional)</Label>
                    <Input
                      id="maxAccess"
                      type="number"
                      value={linkMaxAccess || ''}
                      onChange={(e) => setLinkMaxAccess(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Unlimited"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateShareLink}>
                      Create Link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {shareLinks.length === 0 ? (
              <div className="text-center py-8">
                <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No share links created</p>
                <p className="text-sm text-gray-400">Create links to share with anyone</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shareLinks.map(link => (
                  <div key={link.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getPermissionIcon(link.permission)}
                        {link.permission}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {link.accessCount} accesses
                        </span>
                        {link.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Created {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
