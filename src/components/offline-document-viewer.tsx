'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOfflineStorage } from '@/hooks/use-offline-storage'
import { FileText, Download, Trash2, HardDrive, WifiOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function OfflineDocumentViewer() {
  const { 
    isSupported, 
    documents, 
    deleteDocument, 
    clearAllDocuments, 
    getStorageInfo 
  } = useOfflineStorage()
  const { toast } = useToast()
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  const storageInfo = getStorageInfo()

  const handleDeleteDocument = async (id: string) => {
    try {
      await deleteDocument(id)
      toast({
        title: 'Document deleted',
        description: 'Document removed from offline storage',
      })
      if (selectedDocument === id) {
        setSelectedDocument(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      })
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAllDocuments()
      toast({
        title: 'All documents cleared',
        description: 'All offline documents have been removed',
      })
      setSelectedDocument(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear documents',
        variant: 'destructive',
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

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'legal-form': return 'bg-blue-100 text-blue-800'
      case 'contract': return 'bg-green-100 text-green-800'
      case 'agreement': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">Offline Storage Not Supported</CardTitle>
          <CardDescription className="text-orange-700">
            Your browser doesn't support offline document storage.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const selectedDoc = selectedDocument ? documents.find(d => d.id === selectedDocument) : null

  return (
    <div className="space-y-6">
      {/* Storage Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              <CardTitle>Offline Storage</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <WifiOff className="h-3 w-3" />
              <span>{documents.length} documents</span>
            </Badge>
          </div>
          <CardDescription>
            Using {storageInfo.used}MB of {storageInfo.quota}MB ({storageInfo.percentage}%)
          </CardDescription>
        </CardHeader>
        {documents.length > 0 && (
          <CardContent>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearAll}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Documents
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Document List */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Offline Documents</CardTitle>
            <CardDescription>
              Documents available for offline viewing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No offline documents</p>
                <p className="text-sm">Documents will appear here when saved offline</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDocument === doc.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDocument(doc.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{doc.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getDocumentTypeColor(doc.type)}`}
                          >
                            {doc.type.replace('-', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(doc.size)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(doc.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDocument(doc.id)
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
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

        {/* Document Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Document Viewer</CardTitle>
            <CardDescription>
              {selectedDoc ? selectedDoc.title : 'Select a document to view'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDoc ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getDocumentTypeColor(selectedDoc.type)}>
                    {selectedDoc.type.replace('-', ' ')}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {selectedDoc.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a document to view its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
