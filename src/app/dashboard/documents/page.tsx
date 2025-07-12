'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Document {
  id: string
  title: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  practice_area: string
  upload_date: string
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalDocuments: 0,
    storageUsed: 0,
    recentUploads: 0
  })

  // Enhanced loading states
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Enhanced useEffect with cleanup
  useEffect(() => {
    if (user) {
      fetchDocuments()
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    }
  }, [user])

  // Enhanced fetchDocuments with better error handling and retry logic
  const fetchDocuments = useCallback(async (isRetry = false) => {
    try {
      console.log(`FETCH: Starting document fetch for user: ${user?.id} (retry: ${isRetry})`)

      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }

      // Reset states
      setLoading(true)
      setError('')
      setHasTimedOut(false)
      if (isRetry) {
        setIsRetrying(true)
      }

      if (!user?.id) {
        console.log('FETCH: No user ID available')
        setError('Please log in to view your documents')
        setLoading(false)
        setIsRetrying(false)
        return
      }

      // Set loading timeout (30 seconds)
      const timeout = setTimeout(() => {
        console.log('FETCH: Loading timeout reached')
        setHasTimedOut(true)
        setError('Loading is taking longer than expected. Please try refreshing the page.')
      }, 30000)
      setLoadingTimeout(timeout)

      // Get auth token for API call
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('FETCH: No valid session for documents')
        setError('Authentication required. Please log in again.')
        setLoading(false)
        setIsRetrying(false)
        clearTimeout(timeout)
        return
      }

      // Enhanced API call with better timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout

      console.log('FETCH: Executing API call with enhanced error handling...')

      const response = await fetch('/api/analytics/documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      clearTimeout(timeout)

      if (!response.ok) {
        console.error('FETCH: API call failed:', response.status, response.statusText)

        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.')
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again in a few moments.')
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
      }

      const result = await response.json()
      const data = result.documents || []

      console.log('FETCH: API call completed successfully:', {
        hasData: !!data,
        count: data?.length ?? 0,
        retryAttempt: retryCount
      })

      setDocuments(data)
      setRetryCount(0) // Reset retry count on success

      // Calculate stats
      const totalSize = data?.reduce((sum: number, doc: Document) => sum + (doc.file_size || 0), 0) || 0
      const recentCount = data?.filter((doc: Document) => {
        if (!doc.upload_date) return false
        const uploadDate = new Date(doc.upload_date)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return uploadDate > thirtyDaysAgo
      }).length || 0

      setStats({
        totalDocuments: data?.length || 0,
        storageUsed: totalSize,
        recentUploads: recentCount
      })

      console.log('FETCH: Stats calculated successfully')

    } catch (error: any) {
      console.error('FETCH ERROR:', error)

      // Clear any timeouts
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }

      // Enhanced error handling with retry logic
      const currentRetryCount = retryCount + 1
      setRetryCount(currentRetryCount)

      let errorMessage = 'Failed to load documents.'

      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.'
      } else if (error.message.includes('Authentication')) {
        errorMessage = error.message
      } else if (error.message.includes('Server error')) {
        errorMessage = error.message
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      } else {
        errorMessage = error.message || 'Failed to load documents. Please try again.'
      }

      setError(errorMessage)

      // Set empty state on error
      setDocuments([])
      setStats({
        totalDocuments: 0,
        storageUsed: 0,
        recentUploads: 0
      })
    } finally {
      console.log('FETCH: Cleaning up loading states')
      setLoading(false)
      setIsRetrying(false)

      // Clear timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
        setLoadingTimeout(null)
      }
    }
  }, [user, retryCount, loadingTimeout])

  // Retry function
  const handleRetry = useCallback(() => {
    console.log('RETRY: Manual retry triggered')
    setRetryCount(prev => prev + 1)
    fetchDocuments(true)
  }, [fetchDocuments])

  const handleViewDocument = async (doc: Document) => {
    try {
      console.log('VIEW STEP 1: Starting view process for:', doc.title);
      setActionLoading(doc.id);

      console.log('VIEW STEP 2: Creating signed URL for path:', doc.file_path);

      // Use signed URL approach - more reliable for viewing
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('legal-documents')
        .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

      console.log('VIEW STEP 3: Signed URL result:', {
        hasData: !!signedUrlData,
        hasUrl: !!signedUrlData?.signedUrl,
        error: signedUrlError
      });

      if (signedUrlError) {
        console.error('VIEW STEP 4: Signed URL creation failed:', signedUrlError);
        alert(`Cannot access document "${doc.title}": ${signedUrlError.message}`);
        return;
      }

      if (!signedUrlData?.signedUrl) {
        console.error('VIEW STEP 5: No signed URL returned');
        alert(`Cannot generate access URL for document "${doc.title}"`);
        return;
      }

      console.log('VIEW STEP 6: Opening signed URL in new tab');
      window.open(signedUrlData.signedUrl, '_blank');
      console.log('VIEW STEP 7: View completed successfully');

    } catch (error: any) {
      console.error('VIEW ERROR: Unexpected error:', error);
      alert(`Failed to view document: ${error.message}`);
    } finally {
      console.log('VIEW STEP 8: Clearing loading state');
      setActionLoading(null);
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      console.log('DOWNLOAD STEP 1: Starting download for:', doc.title);
      setActionLoading(doc.id);

      console.log('DOWNLOAD STEP 2: Creating signed URL for download:', doc.file_path);

      // Get signed URL for download (shorter expiry for security)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('legal-documents')
        .createSignedUrl(doc.file_path, 300); // 5 minutes expiry

      console.log('DOWNLOAD STEP 3: Signed URL result:', {
        hasData: !!signedUrlData,
        hasUrl: !!signedUrlData?.signedUrl,
        error: signedUrlError
      });

      if (signedUrlError) {
        console.error('DOWNLOAD STEP 4: Signed URL creation failed:', signedUrlError);
        alert(`Cannot access document "${doc.title}": ${signedUrlError.message}`);
        return;
      }

      if (!signedUrlData?.signedUrl) {
        console.error('DOWNLOAD STEP 5: No signed URL returned');
        alert(`Cannot generate download URL for document "${doc.title}"`);
        return;
      }

      console.log('DOWNLOAD STEP 6: Fetching file from signed URL');

      // Fetch the file using the signed URL
      const response = await fetch(signedUrlData.signedUrl);

      if (!response.ok) {
        console.error('DOWNLOAD STEP 7: Fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      console.log('DOWNLOAD STEP 8: Converting to blob');
      const blob = await response.blob();

      console.log('DOWNLOAD STEP 9: Creating download link');
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('DOWNLOAD STEP 10: Download completed successfully');
      alert('Download completed successfully!');

    } catch (error: any) {
      console.error('DOWNLOAD ERROR: Unexpected error:', error);
      alert(`Unable to download document: ${error.message}`);
    } finally {
      console.log('DOWNLOAD STEP 11: Clearing loading state');
      setActionLoading(null);
    }
  }

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log('Deleting document:', doc.title)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('legal-documents')
        .remove([doc.file_path])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) {
        console.error('Error deleting from database:', dbError)
        alert('Unable to delete document. Please try again.')
        return
      }

      // Refresh documents list
      await fetchDocuments()
      console.log('Document deleted successfully')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Delete failed. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  if (loading) {
    return (
      <DashboardLayout
        title="Document Management"
        subtitle={isRetrying ? "Retrying document load..." : "Loading your documents..."}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-lg text-gray-600">
              {isRetrying ? 'Retrying...' : 'Loading documents...'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {hasTimedOut
                ? 'This is taking longer than expected...'
                : 'This may take a few moments'
              }
            </div>
            {retryCount > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Attempt {retryCount + 1}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        title="Document Management"
        subtitle="Error loading documents"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <div className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Documents</div>
            <div className="text-gray-600 mb-4">{error}</div>
            {retryCount > 0 && (
              <div className="text-sm text-gray-500 mb-4">
                Failed attempts: {retryCount}
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-2"
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>

              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Refresh Page
              </button>

              <div className="mt-4">
                <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Document Management"
      subtitle="Upload, organize, and manage your legal documents"
      actions={
        <Link href="/dashboard/documents/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Document Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalDocuments === 0 ? 'No documents yet' : 'Documents uploaded'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.storageUsed)}</div>
              <p className="text-xs text-muted-foreground">
                of 100 MB limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentUploads}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Document List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
            <CardDescription>
              Manage and organize your uploaded legal documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-4">Upload your first legal document to get started.</p>
                <Link href="/dashboard/documents/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">{document.title}</h3>
                        <p className="text-sm text-gray-500">
                          {document.file_type.toUpperCase()} • {formatFileSize(document.file_size)} • {document.practice_area}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded {new Date(document.upload_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(document)}
                        disabled={actionLoading === document.id}
                        title="View document"
                      >
                        {actionLoading === document.id ? 'Loading...' : 'View'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(document)}
                        disabled={actionLoading === document.id}
                        title="Download document"
                      >
                        {actionLoading === document.id ? 'Loading...' : 'Download'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDocument(document)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete document"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
