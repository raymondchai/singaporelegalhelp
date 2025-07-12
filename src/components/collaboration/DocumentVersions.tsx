'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Using simple div for avatar instead of external component
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  History, 
  Download, 
  Eye, 
  GitBranch, 
  Tag, 
  Clock,
  FileText,
  GitCompare,
  RotateCcw
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
// Using simple title attributes instead of tooltip components

interface DocumentVersion {
  id: string
  version_number: number
  version_name?: string
  description?: string
  file_size: number
  checksum: string
  is_major_version: boolean
  is_published: boolean
  tags: string[]
  created_at: string
  created_by: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  changes_summary?: {
    additions: number
    deletions: number
    modifications: number
    total_changes: number
  }
}

interface DocumentVersionsProps {
  documentId: string
  currentUserId: string
  onVersionRestore?: (version: DocumentVersion) => void
}

export default function DocumentVersions({ 
  documentId, 
  currentUserId, 
  onVersionRestore 
}: DocumentVersionsProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [showCompareDialog, setShowCompareDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadVersions()
  }, [documentId])

  const loadVersions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/documents/${documentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load versions')
      }

      const data = await response.json()
      setVersions(data.versions)
    } catch (error) {
      console.error('Error loading versions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load document versions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreVersion = async (version: DocumentVersion) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/documents/${documentId}/versions/${version.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to restore version')
      }

      if (onVersionRestore) {
        onVersionRestore(version)
      }

      toast({
        title: 'Success',
        description: `Document restored to version ${version.version_number}`
      })

      // Reload versions to show the new current version
      loadVersions()
    } catch (error) {
      console.error('Error restoring version:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore document version',
        variant: 'destructive'
      })
    }
  }

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/documents/${documentId}/versions/${version.id}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download version')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document-v${version.version_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Success',
        description: 'Version downloaded successfully'
      })
    } catch (error) {
      console.error('Error downloading version:', error)
      toast({
        title: 'Error',
        description: 'Failed to download version',
        variant: 'destructive'
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVersionBadgeColor = (version: DocumentVersion) => {
    if (version.is_published) return 'bg-green-100 text-green-800'
    if (version.is_major_version) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History ({versions.length})
          </CardTitle>
          {selectedVersions.length === 2 && (
            <Button size="sm" onClick={() => setShowCompareDialog(true)}>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div 
              key={version.id} 
              className={`border rounded-lg p-4 transition-colors ${
                selectedVersions.includes(version.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (selectedVersions.length < 2) {
                            setSelectedVersions(prev => [...prev, version.id])
                          }
                        } else {
                          setSelectedVersions(prev => prev.filter(id => id !== version.id))
                        }
                      }}
                      disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm font-medium">v{version.version_number}</span>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getVersionBadgeColor(version)}>
                    {version.is_published ? 'Published' : version.is_major_version ? 'Major' : 'Minor'}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadVersion(version)}
                    title="Download this version"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {index !== 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRestoreVersion(version)}
                      title="Restore this version"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-3 ml-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {version.created_by.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{version.created_by.full_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(version.created_at).toLocaleString()}
                  </span>
                </div>

                {version.version_name && (
                  <h4 className="font-medium text-sm mb-1">{version.version_name}</h4>
                )}

                {version.description && (
                  <p className="text-sm text-gray-600 mb-2">{version.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{formatFileSize(version.file_size)}</span>
                  </div>
                  
                  {version.changes_summary && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">+{version.changes_summary.additions}</span>
                      <span className="text-red-600">-{version.changes_summary.deletions}</span>
                      <span className="text-blue-600">~{version.changes_summary.modifications}</span>
                    </div>
                  )}

                  {version.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      <span>{version.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {versions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No version history available.</p>
            <p className="text-sm">Versions will appear here as you make changes.</p>
          </div>
        )}

        {/* Compare Dialog */}
        <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Compare Versions</DialogTitle>
              <DialogDescription>
                Compare the differences between selected versions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedVersions.length === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedVersions.map(versionId => {
                    const version = versions.find(v => v.id === versionId)
                    if (!version) return null
                    
                    return (
                      <div key={version.id} className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-mono font-medium">v{version.version_number}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Created by {version.created_by.full_name}</p>
                          <p>{new Date(version.created_at).toLocaleString()}</p>
                          <p>{formatFileSize(version.file_size)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="border rounded p-4 bg-gray-50">
                <p className="text-sm text-gray-600 text-center">
                  Detailed comparison view would be implemented here
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
