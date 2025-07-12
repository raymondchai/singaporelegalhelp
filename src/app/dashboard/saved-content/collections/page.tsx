'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FolderOpen,
  Plus,
  ArrowLeft,
  Info,
  Calendar,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function CollectionsPage() {
  const router = useRouter()

  return (
    <DashboardLayout
      title="Collections"
      subtitle="Organize your saved content into collections"
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/saved-content">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Saved Content
            </Button>
          </Link>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Coming Soon Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Collections feature is coming soon!</strong> This feature will allow you to organize your saved legal content into custom collections for better organization and quick access.
          </AlertDescription>
        </Alert>

        {/* Feature Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>Collections Management</span>
            </CardTitle>
            <CardDescription>
              Create and manage custom collections to organize your saved legal content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Planned Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Planned Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Create custom collections with names and descriptions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Organize saved articles and Q&As into collections</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Share collections with team members</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Export collections as PDF or Word documents</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Smart collections based on practice areas</span>
                    </li>
                  </ul>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Development Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Phase 1:</span>
                      <span className="text-gray-600">Basic collection creation (Q1 2025)</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Phase 2:</span>
                      <span className="text-gray-600">Advanced organization features (Q2 2025)</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Phase 3:</span>
                      <span className="text-gray-600">Sharing and collaboration (Q3 2025)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Workaround */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Current Workaround</h4>
                <p className="text-sm text-blue-800 mb-3">
                  While we're developing the collections feature, you can still organize your saved content by:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Using the search functionality to find specific saved items</li>
                  <li>• Filtering by content type (Articles or Q&As)</li>
                  <li>• Bookmarking content from specific practice areas</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <Link href="/dashboard/saved-content">
                  <Button>
                    View Saved Content
                  </Button>
                </Link>
                <Link href="/legal-categories">
                  <Button variant="outline">
                    Browse Legal Content
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card>
          <CardHeader>
            <CardTitle>Help Us Prioritize</CardTitle>
            <CardDescription>
              Your feedback helps us build the features you need most
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              What collection features would be most valuable for your legal work? Let us know your priorities to help us build the right solution.
            </p>
            <Button variant="outline" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Feedback Form (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
