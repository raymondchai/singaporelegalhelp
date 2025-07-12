'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Folder, 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star,
  Share2,
  Download,
  MoreHorizontal,
  Plus,
  FolderPlus,
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DashboardLayout from '../components/DashboardLayout'
import DocumentCollectionManager from '@/components/dashboard/DocumentCollectionManager'
import DocumentVersionControl from '@/components/dashboard/DocumentVersionControl'
import DocumentCollaboration from '@/components/dashboard/DocumentCollaboration'

interface Document {
  id: string
  document_name: string
  document_type: string
  category: string
  file_name: string
  file_size: number
  folder_path: string
  is_favorite: boolean
  access_level: 'private' | 'team' | 'shared' | 'public'
  upload_status: 'uploading' | 'processing' | 'completed' | 'failed'
  version_number: number
  created_at: string
  updated_at: string
  tags: string[]
}

interface Folder {
  path: string
  name: string
  document_count: number
  created_at: string
}

export default function EnhancedDocumentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState('/')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading_documents, setLoadingDocuments] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return

      try {
        setLoadingDocuments(true)

        // Get session for access token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch(`/api/documents/enhanced?folder=${encodeURIComponent(currentFolder)}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch documents')
        }

        const data = await response.json()
        setDocuments(data.documents || [])
        setFolders(data.folders || [])
      } catch (error) {
        console.error('Error fetching documents:', error)
        toast({
          title: 'Error',
          description: 'Failed to load documents',
          variant: 'destructive',
        })
      } finally {
        setLoadingDocuments(false)
      }
    }

    if (user && !loading) {
      fetchDocuments()
    }
  }, [user, loading, currentFolder, toast])

  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocuments(prev => [...prev, documentId])
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id))
    } else {
      setSelectedDocuments([])
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select documents to perform bulk actions.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Get session for access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/documents/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          document_ids: selectedDocuments,
        }),
      })

      if (!response.ok) {
        throw new Error('Bulk action failed')
      }

      toast({
        title: 'Bulk Action Completed',
        description: `${action} applied to ${selectedDocuments.length} documents.`,
      })

      setSelectedDocuments([])
      // Refresh documents
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Bulk Action Failed',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterType === 'all' || doc.document_type === filterType
    return matchesSearch && matchesFilter
  })

  const breadcrumbs = currentFolder.split('/').filter(Boolean)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'private':
        return <User className="h-4 w-4 text-gray-500" />
      case 'team':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'shared':
        return <Share2 className="h-4 w-4 text-green-500" />
      case 'public':
        return <Eye className="h-4 w-4 text-purple-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Documents" subtitle="Loading your documents...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Enhanced Document Management"
      subtitle="Organize, share, and collaborate on your legal documents"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setCurrentFolder('/')}>
            <Folder className="h-4 w-4 mr-2" />
            All Documents
          </Button>
          {breadcrumbs.map((folder, index) => (
            <div key={index} className="flex items-center">
              <span className="text-gray-400 mx-2">/</span>
              <Button
                variant="ghost"
                onClick={() => setCurrentFolder('/' + breadcrumbs.slice(0, index + 1).join('/'))}
              >
                {folder}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Types</option>
            <option value="contract">Contracts</option>
            <option value="agreement">Agreements</option>
            <option value="legal_notice">Legal Notices</option>
            <option value="court_document">Court Documents</option>
            <option value="other">Other</option>
          </select>
          
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedDocuments.length} document(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('favorite')}>
                <Star className="h-4 w-4 mr-2" />
                Favorite
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('share')}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('download')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Documents</span>
                <Badge variant="secondary">{filteredDocuments.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage your legal documents with advanced organization features
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading_documents ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found.</p>
              <p className="text-sm text-gray-400">Upload your first document to get started.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`${
                    viewMode === 'grid'
                      ? 'p-4 border rounded-lg hover:shadow-md transition-shadow'
                      : 'flex items-center justify-between p-3 border rounded hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={(checked) => handleDocumentSelect(doc.id, checked as boolean)}
                    />
                    <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate">{doc.document_name}</h4>
                        {doc.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        {getAccessLevelIcon(doc.access_level)}
                      </div>
                      <p className="text-sm text-gray-600">{doc.document_type}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>v{doc.version_number}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
