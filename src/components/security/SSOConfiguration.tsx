'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  Key, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  Download,
  Upload,
  TestTube,
  Save
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface SSOConfiguration {
  id: string
  provider: 'saml' | 'oidc' | 'oauth2' | 'azure_ad' | 'google_workspace'
  provider_name: string
  issuer_url?: string
  sso_url: string
  certificate?: string
  metadata_url?: string
  client_id?: string
  authorization_endpoint?: string
  token_endpoint?: string
  userinfo_endpoint?: string
  entity_id?: string
  x509_certificate?: string
  attribute_mapping: Record<string, string>
  is_active: boolean
  auto_provision_users: boolean
  default_role: string
  allowed_domains: string[]
  enforce_sso: boolean
  session_timeout_minutes: number
}

export default function SSOConfiguration() {
  const [configurations, setConfigurations] = useState<SSOConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [testingSSO, setTestingSSO] = useState<string | null>(null)
  const [newConfig, setNewConfig] = useState<Partial<SSOConfiguration>>({
    provider: 'saml',
    provider_name: '',
    sso_url: '',
    attribute_mapping: {
      email: 'email',
      first_name: 'given_name',
      last_name: 'family_name',
      display_name: 'name',
      groups: 'groups'
    },
    is_active: false,
    auto_provision_users: true,
    default_role: 'member',
    allowed_domains: [],
    enforce_sso: false,
    session_timeout_minutes: 480
  })
  const { toast } = useToast()

  useEffect(() => {
    loadSSOConfigurations()
  }, [])

  const loadSSOConfigurations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/security/sso', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load SSO configurations')
      }

      const data = await response.json()
      setConfigurations(data.data.configurations)
    } catch (error) {
      console.error('Error loading SSO configurations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load SSO configurations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfiguration = async () => {
    if (!newConfig.provider_name || !newConfig.sso_url) {
      toast({
        title: 'Error',
        description: 'Provider name and SSO URL are required',
        variant: 'destructive'
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/v1/enterprise/security/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newConfig),
      })

      if (!response.ok) {
        throw new Error('Failed to create SSO configuration')
      }

      const data = await response.json()
      setConfigurations(prev => [...prev, data.data.configuration])
      setShowCreateDialog(false)
      setNewConfig({
        provider: 'saml',
        provider_name: '',
        sso_url: '',
        attribute_mapping: {
          email: 'email',
          first_name: 'given_name',
          last_name: 'family_name',
          display_name: 'name',
          groups: 'groups'
        },
        is_active: false,
        auto_provision_users: true,
        default_role: 'member',
        allowed_domains: [],
        enforce_sso: false,
        session_timeout_minutes: 480
      })

      toast({
        title: 'Success',
        description: 'SSO configuration created successfully'
      })
    } catch (error) {
      console.error('Error creating SSO configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to create SSO configuration',
        variant: 'destructive'
      })
    }
  }

  const handleToggleConfiguration = async (configId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/security/sso/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update SSO configuration')
      }

      setConfigurations(prev => 
        prev.map(config => 
          config.id === configId ? { ...config, is_active: isActive } : config
        )
      )

      toast({
        title: 'Success',
        description: `SSO configuration ${isActive ? 'enabled' : 'disabled'}`
      })
    } catch (error) {
      console.error('Error updating SSO configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to update SSO configuration',
        variant: 'destructive'
      })
    }
  }

  const handleTestSSO = async (configId: string) => {
    setTestingSSO(configId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/v1/enterprise/security/sso/${configId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('SSO test failed')
      }

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'SSO configuration test passed'
        })
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'SSO configuration test failed',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error testing SSO:', error)
      toast({
        title: 'Error',
        description: 'Failed to test SSO configuration',
        variant: 'destructive'
      })
    } finally {
      setTestingSSO(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard'
    })
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'saml': return <Shield className="h-4 w-4" />
      case 'oidc': return <Key className="h-4 w-4" />
      case 'oauth2': return <Key className="h-4 w-4" />
      case 'azure_ad': return <Shield className="h-4 w-4" />
      case 'google_workspace': return <Shield className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'saml': return 'bg-blue-100 text-blue-800'
      case 'oidc': return 'bg-green-100 text-green-800'
      case 'oauth2': return 'bg-purple-100 text-purple-800'
      case 'azure_ad': return 'bg-indigo-100 text-indigo-800'
      case 'google_workspace': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSO Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SSO Configuration</h2>
          <p className="text-gray-600">Configure Single Sign-On for your organization</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Add SSO Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure SSO Provider</DialogTitle>
              <DialogDescription>
                Set up Single Sign-On integration for your organization
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="attributes">Attributes</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="provider">Provider Type</Label>
                  <Select 
                    value={newConfig.provider} 
                    onValueChange={(value: any) => setNewConfig(prev => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                      <SelectItem value="oidc">OpenID Connect</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="azure_ad">Azure AD</SelectItem>
                      <SelectItem value="google_workspace">Google Workspace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="provider_name">Provider Name</Label>
                  <Input
                    id="provider_name"
                    value={newConfig.provider_name}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, provider_name: e.target.value }))}
                    placeholder="e.g. Company Active Directory"
                  />
                </div>

                <div>
                  <Label htmlFor="sso_url">SSO URL</Label>
                  <Input
                    id="sso_url"
                    value={newConfig.sso_url}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, sso_url: e.target.value }))}
                    placeholder="https://your-provider.com/sso"
                  />
                </div>

                {newConfig.provider === 'saml' && (
                  <div>
                    <Label htmlFor="entity_id">Entity ID</Label>
                    <Input
                      id="entity_id"
                      value={newConfig.entity_id || ''}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, entity_id: e.target.value }))}
                      placeholder="urn:your-company:saml"
                    />
                  </div>
                )}

                {(newConfig.provider === 'oidc' || newConfig.provider === 'oauth2') && (
                  <div>
                    <Label htmlFor="client_id">Client ID</Label>
                    <Input
                      id="client_id"
                      value={newConfig.client_id || ''}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, client_id: e.target.value }))}
                      placeholder="your-client-id"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_provision"
                    checked={newConfig.auto_provision_users}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, auto_provision_users: checked }))}
                  />
                  <Label htmlFor="auto_provision">Auto-provision users</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enforce_sso"
                    checked={newConfig.enforce_sso}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, enforce_sso: checked }))}
                  />
                  <Label htmlFor="enforce_sso">Enforce SSO (disable password login)</Label>
                </div>

                <div>
                  <Label htmlFor="default_role">Default Role for New Users</Label>
                  <Select 
                    value={newConfig.default_role} 
                    onValueChange={(value) => setNewConfig(prev => ({ ...prev, default_role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={newConfig.session_timeout_minutes}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) }))}
                    min="30"
                    max="1440"
                  />
                </div>
              </TabsContent>

              <TabsContent value="attributes" className="space-y-4">
                <div>
                  <Label>Attribute Mapping</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Map SSO provider attributes to user fields
                  </p>
                  <div className="space-y-3">
                    {Object.entries(newConfig.attribute_mapping || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Label className="w-24 text-sm">{key}:</Label>
                        <Input
                          value={value}
                          onChange={(e) => setNewConfig(prev => ({
                            ...prev,
                            attribute_mapping: {
                              ...prev.attribute_mapping,
                              [key]: e.target.value
                            }
                          }))}
                          placeholder={`SSO ${key} attribute`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2">
              <Button onClick={handleCreateConfiguration} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Create Configuration
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SSO Configurations */}
      <div className="space-y-4">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getProviderColor(config.provider)}>
                    <div className="flex items-center gap-1">
                      {getProviderIcon(config.provider)}
                      {config.provider.toUpperCase()}
                    </div>
                  </Badge>
                  <div>
                    <h3 className="font-semibold">{config.provider_name}</h3>
                    <p className="text-sm text-gray-600">{config.sso_url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.is_active ? "default" : "secondary"}>
                    {config.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => handleToggleConfiguration(config.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Auto Provision</p>
                  <p className="font-medium">{config.auto_provision_users ? 'Enabled' : 'Disabled'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Default Role</p>
                  <p className="font-medium">{config.default_role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Session Timeout</p>
                  <p className="font-medium">{config.session_timeout_minutes} minutes</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTestSSO(config.id)}
                  disabled={testingSSO === config.id}
                >
                  <TestTube className="h-3 w-3 mr-1" />
                  {testingSSO === config.id ? 'Testing...' : 'Test SSO'}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(config.sso_url)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configurations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No SSO Configurations</h3>
            <p className="text-gray-600 mb-4">
              Set up Single Sign-On to enable secure authentication for your organization
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Add SSO Provider
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
