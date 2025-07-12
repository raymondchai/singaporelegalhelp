'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  Users, 
  History, 
  CheckSquare, 
  Settings,
  Activity,
  Bell,
  Share2
} from 'lucide-react'
import DocumentComments from './DocumentComments'
import CollaborationSession from './CollaborationSession'
import DocumentVersions from './DocumentVersions'

interface CollaborationDashboardProps {
  documentId: string
  documentTitle: string
  currentUserId: string
  isOwner: boolean
}

export default function CollaborationDashboard({
  documentId,
  documentTitle,
  currentUserId,
  isOwner
}: CollaborationDashboardProps) {
  const [activeTab, setActiveTab] = useState('comments')
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'comment',
      message: 'New comment on your document',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'collaboration',
      message: 'User joined collaboration session',
      timestamp: new Date().toISOString(),
      read: false
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collaboration</h1>
          <p className="text-gray-600">{documentTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Document
          </Button>
          {isOwner && (
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Comments</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Versions</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Tasks</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <MessageCircle className="h-4 w-4 text-blue-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">John Doe</span> added a comment on page 3
                </p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="h-4 w-4 text-green-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Sarah Wilson</span> joined collaboration session
                </p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <History className="h-4 w-4 text-purple-600 mt-1" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Mike Chen</span> created version 1.2
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Collaboration Features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Versions
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <DocumentComments
            documentId={documentId}
            currentUserId={currentUserId}
            onCommentAdded={(comment) => {
              console.log('New comment added:', comment)
            }}
          />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <CollaborationSession
            documentId={documentId}
            currentUserId={currentUserId}
            onSessionCreated={(session) => {
              console.log('New session created:', session)
            }}
          />
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <DocumentVersions
            documentId={documentId}
            currentUserId={currentUserId}
            onVersionRestore={(version) => {
              console.log('Version restored:', version)
            }}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Document Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Review legal terminology</h4>
                      <p className="text-sm text-gray-600">Assigned to John Doe</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      In Progress
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Please review the legal terminology used in sections 2-4 for accuracy.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Due: Tomorrow</span>
                    <span>•</span>
                    <span>Priority: High</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Format citations</h4>
                      <p className="text-sm text-gray-600">Assigned to Sarah Wilson</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Ensure all citations follow the proper legal format.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Completed: Yesterday</span>
                    <span>•</span>
                    <span>Priority: Medium</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">Final approval</h4>
                      <p className="text-sm text-gray-600">Assigned to Mike Chen</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Final review and approval before publication.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Due: Next week</span>
                    <span>•</span>
                    <span>Priority: High</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Create New Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
