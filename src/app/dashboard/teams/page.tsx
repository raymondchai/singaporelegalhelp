'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  Crown, 
  Shield, 
  User,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import DashboardLayout from '../components/DashboardLayout'

interface Team {
  id: string
  team_name: string
  team_description: string
  team_type: 'business' | 'law_firm' | 'department'
  max_members: number
  owner_id: string
  member_count: number
  created_at: string
  settings: {
    allow_external_sharing: boolean
    require_approval: boolean
  }
}

interface TeamMember {
  id: string
  user_id: string
  team_id: string
  role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer'
  status: 'invited' | 'active' | 'suspended' | 'removed'
  joined_at: string
  user_profile: {
    full_name: string
    email: string
    avatar_url?: string
  }
}

export default function TeamsPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading_teams, setLoadingTeams] = useState(true)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)

  const [newTeamData, setNewTeamData] = useState({
    team_name: '',
    team_description: '',
    team_type: 'business' as 'business' | 'law_firm' | 'department',
    max_members: 10,
  })

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as 'admin' | 'manager' | 'member' | 'viewer',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchTeams = async () => {
      if (!user) return

      try {
        setLoadingTeams(true)

        // Get session for access token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const response = await fetch('/api/teams', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch teams')
        }

        const data = await response.json()
        setTeams(data.teams || [])
        
        if (data.teams && data.teams.length > 0) {
          setSelectedTeam(data.teams[0])
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
        toast({
          title: 'Error',
          description: 'Failed to load teams',
          variant: 'destructive',
        })
      } finally {
        setLoadingTeams(false)
      }
    }

    if (user && !loading) {
      fetchTeams()
    }
  }, [user, loading, toast])

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!selectedTeam) return

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch team members')
        }

        const data = await response.json()
        setTeamMembers(data.members || [])
      } catch (error) {
        console.error('Error fetching team members:', error)
        toast({
          title: 'Error',
          description: 'Failed to load team members',
          variant: 'destructive',
        })
      }
    }

    if (selectedTeam) {
      fetchTeamMembers()
    }
  }, [selectedTeam, user, toast])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(newTeamData),
      })

      if (!response.ok) {
        throw new Error('Failed to create team')
      }

      const result = await response.json()
      setTeams(prev => [result.team, ...prev])
      setSelectedTeam(result.team)
      setShowCreateTeam(false)
      setNewTeamData({
        team_name: '',
        team_description: '',
        team_type: 'business',
        max_members: 10,
      })

      toast({
        title: 'Team Created',
        description: 'Your team has been created successfully.',
      })
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create team. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTeam) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(inviteData),
      })

      if (!response.ok) {
        throw new Error('Failed to invite member')
      }

      const result = await response.json()
      setTeamMembers(prev => [result.member, ...prev])
      setShowInviteMember(false)
      setInviteData({ email: '', role: 'member' })

      toast({
        title: 'Invitation Sent',
        description: 'Team invitation has been sent successfully.',
      })
    } catch (error) {
      toast({
        title: 'Invitation Failed',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'manager':
        return <Settings className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    }

    return (
      <Badge className={colors[role as keyof typeof colors] || colors.member}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      invited: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      removed: 'bg-gray-100 text-gray-800',
    }

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || colors.active}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Check if user can manage teams (business accounts only)
  const canManageTeams = profile?.user_type !== 'individual'

  if (loading) {
    return (
      <DashboardLayout title="Teams" subtitle="Loading your teams...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!canManageTeams) {
    return (
      <DashboardLayout title="Teams" subtitle="Team management">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Team features are available for business accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Team management is not available for individual accounts.</p>
              <p className="text-sm text-gray-400">Upgrade to a business account to access team features.</p>
              <Button className="mt-4">
                Upgrade Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Team Management"
      subtitle="Manage your teams and collaborate with colleagues"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Your Teams</span>
                </CardTitle>
                <Button size="sm" onClick={() => setShowCreateTeam(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Teams you own or are a member of
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading_teams ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No teams yet.</p>
                  <Button size="sm" className="mt-2" onClick={() => setShowCreateTeam(true)}>
                    Create Your First Team
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{team.team_name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{team.team_type}</p>
                        </div>
                        <Badge variant="outline">{team.member_count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <Tabs defaultValue="members" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeam.team_name}</h2>
                  <p className="text-gray-600">{selectedTeam.team_description}</p>
                </div>
                <TabsList>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Team Members</CardTitle>
                      <Button size="sm" onClick={() => setShowInviteMember(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </div>
                    <CardDescription>
                      Manage team members and their roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{member.user_profile.full_name}</h4>
                                {getRoleIcon(member.role)}
                              </div>
                              <p className="text-sm text-gray-600">{member.user_profile.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {getRoleBadge(member.role)}
                                {getStatusBadge(member.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Settings</CardTitle>
                    <CardDescription>
                      Configure team preferences and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <Label>Team Name</Label>
                        <Input value={selectedTeam.team_name} readOnly />
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea value={selectedTeam.team_description} readOnly />
                      </div>
                      
                      <div>
                        <Label>Team Type</Label>
                        <Input value={selectedTeam.team_type} readOnly className="capitalize" />
                      </div>
                      
                      <div>
                        <Label>Maximum Members</Label>
                        <Input value={selectedTeam.max_members} readOnly />
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-4">Permissions</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Allow external sharing</span>
                            <Badge variant={selectedTeam.settings.allow_external_sharing ? 'default' : 'secondary'}>
                              {selectedTeam.settings.allow_external_sharing ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Require approval for new members</span>
                            <Badge variant={selectedTeam.settings.require_approval ? 'default' : 'secondary'}>
                              {selectedTeam.settings.require_approval ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a team to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Team Modal would go here */}
      {/* Invite Member Modal would go here */}
    </DashboardLayout>
  )
}
