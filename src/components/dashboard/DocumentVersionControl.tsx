'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  History,
  FileText,
  Download,
  Eye,
  GitBranch,
  Clock,
  User,
  ArrowRight,
  Upload,
  RotateCcw as Restore,
  GitCompare as Compare,
  Tag,
  MessageSquare
} from 'lucide-react'
import { EnhancedDocument } from '@/types/dashboard'
import { useAuth } from '@/contexts/auth-context'

interface DocumentVersion {
  id: string
  documentId: string
  version: number
  fileName: string
  filePath: string
  fileSize: number
  changeDescription: string
  createdBy: string
  createdByName: string
  createdAt: string
  isLatest: boolean
  parentVersionId?: string
}

interface DocumentVersionControlProps {
  document: EnhancedDocument
  onVersionCreate: (documentId: string, file: File, description: string) => Promise<void>
  onVersionRestore: (documentId: string, versionId: string) => Promise<void>
  onVersionDelete: (versionId: string) => Promise<void>
}

export default function DocumentVersionControl({
  document: documentData,
  onVersionCreate,
  onVersionRestore,
  onVersionDelete
}: DocumentVersionControlProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [changeDescription, setChangeDescription] = useState('')
  const [comparing, setComparing] = useState<{ version1: string; version2: string } | null>(null)

  useEffect(() => {
    loadVersions()
  }, [documentData.id])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${documentData.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type matches original document
      const originalExtension = documentData.fileName.split('.').pop()?.toLowerCase()
      const newExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (originalExtension !== newExtension) {
        toast({
          title: 'Invalid File Type',
          description: `Please upload a ${originalExtension?.toUpperCase()} file to match the original document`,
          variant: 'destructive'
        })
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleCreateVersion = async () => {
    if (!selectedFile || !changeDescription.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and provide a change description',
        variant: 'destructive'
      })
      return
    }

    try {
      await onVersionCreate(documentData.id, selectedFile, changeDescription)
      setSelectedFile(null)
      setChangeDescription('')
      setShowUploadDialog(false)
      await loadVersions()
      
      toast({
        title: 'Success',
        description: 'New version created successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new version',
        variant: 'destructive'
      })
    }
  }

  const handleRestoreVersion = async (versionId: string, versionNumber: number) => {
    if (window.confirm(`Are you sure you want to restore version ${versionNumber}? This will create a new version based on the selected one.`)) {
      try {
        await onVersionRestore(documentData.id, versionId)
        await loadVersions()
        
        toast({
          title: 'Success',
          description: `Version ${versionNumber} has been restored as the latest version`
        })
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to restore version',
          variant: 'destructive'
        })
      }
    }
  }

  const handleDownloadVersion = async (version: DocumentVersion) => {
    try {
      const response = await fetch(`/api/documents/versions/${version.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${documentData.title}_v${version.version}.${version.fileName.split('.').pop()}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
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
    if (version.isLatest) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </h3>
          <p className="text-sm text-gray-600">
            Track changes and manage document versions
          </p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload New Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept={`.${documentData.fileName.split('.').pop()}`}
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Change Description</Label>
                <Textarea
                  id="description"
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="Describe what changed in this version..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion}>
                  Create Version
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {documentData.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Current Version</p>
              <p className="font-medium">v{documentData.version}</p>
            </div>
            <div>
              <p className="text-gray-600">File Size</p>
              <p className="font-medium">{formatFileSize(documentData.fileSize)}</p>
            </div>
            <div>
              <p className="text-gray-600">Last Modified</p>
              <p className="font-medium">{new Date(documentData.lastModified).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Versions</p>
              <p className="font-medium">{versions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Version Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No version history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  {/* Version indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      version.isLatest ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {version.version}
                    </div>
                    {index < versions.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Version details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getVersionBadgeColor(version)}>
                        Version {version.version}
                      </Badge>
                      {version.isLatest && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 mb-1">{version.changeDescription}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.createdByName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                      <span>{formatFileSize(version.fileSize)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadVersion(version)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {!version.isLatest && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreVersion(version.id, version.version)}
                        className="h-8 w-8 p-0"
                      >
                        <Restore className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Version Comparison (Future Enhancement) */}
      {versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compare className="h-5 w-5" />
              Compare Versions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Compare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Version comparison feature coming soon</p>
              <p className="text-sm">Compare changes between different versions of your document</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
