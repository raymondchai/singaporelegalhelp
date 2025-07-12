'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  FolderOpen,
  Tag,
  Plus,
  ArrowLeft,
  Download,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '../components/DashboardLayout'
import SavedContentManager from '@/components/saved-content/SavedContentManager'
import { useToast } from '@/hooks/use-toast'

export default function SavedContentPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalSavedItems: 0,
    totalCollections: 0,
    totalAnnotations: 0,
    totalTags: 0,
    itemsThisWeek: 0,
    favoriteItems: 0,
    unreadItems: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/dashboard/analytics/content-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.statistics || stats)
      }

    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <DashboardLayout title="Saved Content" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Saved Content Organization"
      subtitle="Organize, annotate, and manage your legal content"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saved Items</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {loading ? '...' : stats.totalSavedItems}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collections</p>
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? '...' : stats.totalCollections}
                  </p>
                </div>
                <FolderOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Annotations</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {loading ? '...' : stats.totalAnnotations}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tags</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {loading ? '...' : stats.totalTags}
                  </p>
                </div>
                <Tag className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Saved Content Organization
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => {
                  toast({
                    title: "Quick Save",
                    description: "Quick save functionality coming soon"
                  })
                }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Save Content
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <SavedContentManager userId={user.id} />
          </CardContent>
        </Card>

        {/* Help & Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips & Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Content Organization</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use collections to group related content</li>
                  <li>• Add tags for cross-collection categorization</li>
                  <li>• Star important items for quick access</li>
                  <li>• Use notes to add your own context</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Annotation Tips</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Highlight key passages for quick reference</li>
                  <li>• Add comments to explain complex concepts</li>
                  <li>• Use different colors for different purposes</li>
                  <li>• Tag annotations for better searchability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </DashboardLayout>
  )
}
