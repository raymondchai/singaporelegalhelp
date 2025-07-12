'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, Activity, Users, FileText } from 'lucide-react'

interface AnalyticsData {
  practiceAreaStats: Array<{ name: string; value: number; color: string }>
  monthlyActivity: Array<{ month: string; activities: number }>
  topQueries: Array<{ query: string; count: number }>
  weeklyTrends: Array<{ day: string; documents: number; chats: number }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    practiceAreaStats: [],
    monthlyActivity: [],
    topQueries: [],
    weeklyTrends: []
  })
  const [loading, setLoading] = useState(true)
  const [totalStats, setTotalStats] = useState({
    totalActivities: 0,
    totalDocuments: 0,
    totalChats: 0,
    avgSessionLength: 0
  })

  useEffect(() => {
    if (user) {
      fetchAnalyticsData()
    }
  }, [user])

  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics data for user:', user?.id)

      // Get auth token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No valid session for analytics')
        return
      }

      // Use API routes instead of direct database queries
      const [activitiesResponse, documentsResponse, chatsResponse] = await Promise.allSettled([
        fetch('/api/analytics/activities', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/analytics/documents', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/analytics/chats', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      // Process activities
      let activities = []
      if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.ok) {
        const activitiesData = await activitiesResponse.value.json()
        activities = activitiesData.activities ?? []
      }

      // Process documents
      let documents = []
      if (documentsResponse.status === 'fulfilled' && documentsResponse.value.ok) {
        const documentsData = await documentsResponse.value.json()
        documents = documentsData.documents ?? []
      }

      // Process chats
      let chats = []
      if (chatsResponse.status === 'fulfilled' && chatsResponse.value.ok) {
        const chatsData = await chatsResponse.value.json()
        chats = chatsData.chats ?? []
      }



      // Process practice area data
      const practiceAreaCounts: { [key: string]: number } = {}
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
      
      // Count from activities
      activities?.forEach((activity: any) => {
        if (activity.practice_area) {
          practiceAreaCounts[activity.practice_area] = (practiceAreaCounts[activity.practice_area] || 0) + 1
        }
      })

      // Count from documents
      documents?.forEach((doc: any) => {
        if (doc.practice_area) {
          practiceAreaCounts[doc.practice_area] = (practiceAreaCounts[doc.practice_area] || 0) + 1
        }
      })

      // Count from chats
      chats?.forEach((chat: any) => {
        if (chat.practice_area) {
          practiceAreaCounts[chat.practice_area] = (practiceAreaCounts[chat.practice_area] || 0) + 1
        }
      })

      const practiceAreaStats = Object.entries(practiceAreaCounts).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))

      // Generate monthly activity data (last 6 months)
      const monthlyActivity = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        
        const monthActivities = activities?.filter((activity: any) => {
          const activityDate = new Date(activity.created_at)
          return activityDate.getMonth() === date.getMonth() && 
                 activityDate.getFullYear() === date.getFullYear()
        }).length || 0

        monthlyActivity.push({
          month: monthName,
          activities: monthActivities
        })
      }

      // Generate weekly trends (last 7 days)
      const weeklyTrends = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        const dayDocuments = documents?.filter((doc: any) => {
          const docDate = new Date(doc.upload_date)
          return docDate.toDateString() === date.toDateString()
        }).length || 0

        const dayChats = chats?.filter((chat: any) => {
          const chatDate = new Date(chat.created_at)
          return chatDate.toDateString() === date.toDateString()
        }).length || 0

        weeklyTrends.push({
          day: dayName,
          documents: dayDocuments,
          chats: dayChats
        })
      }

      // Generate mock top queries (since we don't have query tracking yet)
      const topQueries = [
        { query: "Employment contract review", count: Math.floor(Math.random() * 20) + 5 },
        { query: "Property law questions", count: Math.floor(Math.random() * 15) + 3 },
        { query: "Corporate compliance", count: Math.floor(Math.random() * 12) + 2 },
        { query: "Intellectual property", count: Math.floor(Math.random() * 10) + 1 },
        { query: "Family law matters", count: Math.floor(Math.random() * 8) + 1 }
      ].sort((a, b) => b.count - a.count)

      // Calculate total stats
      const avgSessionLength = chats?.length ?
        chats.reduce((sum: number, chat: any) => sum + chat.message_count, 0) / chats.length : 0

      setAnalyticsData({
        practiceAreaStats,
        monthlyActivity,
        topQueries,
        weeklyTrends
      })

      setTotalStats({
        totalActivities: activities?.length || 0,
        totalDocuments: documents?.length || 0,
        totalChats: chats?.length || 0,
        avgSessionLength: Math.round(avgSessionLength)
      })

      console.log('Analytics data processed successfully')
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Loading your usage analytics...">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Analytics" subtitle="View your usage analytics and insights">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalActivities}</div>
              <p className="text-xs text-muted-foreground">Platform interactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Files uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalChats}</div>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.avgSessionLength}</div>
              <p className="text-xs text-muted-foreground">Messages per chat</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Practice Area Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Practice Area Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.practiceAreaStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.practiceAreaStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.practiceAreaStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No practice area data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="activities" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="documents" stroke="#3b82f6" name="Documents" />
                  <Line type="monotone" dataKey="chats" stroke="#10b981" name="Chats" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Query Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topQueries.map((query, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{query.query}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(query.count / Math.max(...analyticsData.topQueries.map(q => q.count))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 ml-4">{query.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
