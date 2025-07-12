'use client'

// =====================================================
// Phase 6A: Enterprise Dashboard
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Key, 
  CreditCard, 
  FileText, 
  Settings, 
  Users,
  Shield,
  Copy,
  Trash2,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/subscription-config'

interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  permissions: string[];
  expires_at: string | null;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount_sgd: number;
  status: string;
  created_at: string;
}

export default function EnterprisePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read'])

  useEffect(() => {
    if (user) {
      fetchEnterpriseData()
    }
  }, [user])

  const fetchEnterpriseData = async () => {
    try {
      setLoading(true)

      // Fetch API keys
      const keysResponse = await fetch(`/api/enterprise/api-keys?userId=${user?.id}`)
      const keysData = await keysResponse.json()

      if (keysData.success) {
        setApiKeys(keysData.apiKeys)
      }

      // Fetch invoices
      const invoicesResponse = await fetch(`/api/enterprise/billing?userId=${user?.id}`)
      const invoicesData = await invoicesResponse.json()

      if (invoicesData.success) {
        setInvoices(invoicesData.invoices)
      }

    } catch (error) {
      console.error('Failed to fetch enterprise data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load enterprise data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/enterprise/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          name: newKeyName,
          permissions: newKeyPermissions,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        })
        
        // Show the API key in a modal or copy to clipboard
        await navigator.clipboard.writeText(data.apiKey.key)
        toast({
          title: 'API Key Copied',
          description: 'The API key has been copied to your clipboard. Please save it securely.',
        })

        setNewKeyName('')
        setNewKeyPermissions(['read'])
        setShowCreateKey(false)
        await fetchEnterpriseData()
      } else {
        throw new Error(data.error)
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API key',
        variant: 'destructive',
      })
    }
  }

  const revokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/enterprise/api-keys?userId=${user?.id}&keyId=${keyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        })
        await fetchEnterpriseData()
      } else {
        throw new Error(data.error)
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke API key',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const },
      inactive: { label: 'Inactive', variant: 'secondary' as const },
      expired: { label: 'Expired', variant: 'destructive' as const },
    }
    
    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enterprise Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your enterprise features, API access, and billing</p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="billing">Custom Billing</TabsTrigger>
          <TabsTrigger value="settings">Enterprise Settings</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>API Keys</span>
                  </CardTitle>
                  <CardDescription>
                    Manage API keys for programmatic access to your account
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateKey(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showCreateKey && (
                <Card className="mb-6 border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Create New API Key</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Production API Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Permissions</Label>
                      <div className="flex space-x-2 mt-2">
                        {['read', 'write', 'admin'].map((permission) => (
                          <label key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newKeyPermissions.includes(permission)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewKeyPermissions([...newKeyPermissions, permission])
                                } else {
                                  setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission))
                                }
                              }}
                            />
                            <span className="capitalize">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={createApiKey}>Create Key</Button>
                      <Button variant="outline" onClick={() => setShowCreateKey(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No API keys created yet. Create your first API key to get started.
                  </p>
                ) : (
                  apiKeys.map((key) => (
                    <Card key={key.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{key.name}</h3>
                              <Badge {...getStatusBadge(key.is_active ? 'active' : 'inactive')}>
                                {getStatusBadge(key.is_active ? 'active' : 'inactive').label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Key: ****{key.key_hash.slice(-8)}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Permissions: {key.permissions.join(', ')}</span>
                              <span>Used: {key.usage_count} times</span>
                              <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => revokeApiKey(key.id)}
                              disabled={!key.is_active}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Custom Billing</span>
              </CardTitle>
              <CardDescription>
                Enterprise invoicing and custom payment terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No custom invoices yet. Contact support for enterprise billing setup.
                  </p>
                ) : (
                  invoices.map((invoice) => (
                    <Card key={invoice.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{invoice.invoice_number}</h3>
                            <p className="text-sm text-gray-600">
                              Due: {new Date(invoice.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(invoice.total_amount_sgd)}</p>
                            <Badge {...getStatusBadge(invoice.status)}>
                              {getStatusBadge(invoice.status).label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enterprise Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Enterprise Settings</span>
              </CardTitle>
              <CardDescription>
                Configure enterprise-specific features and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">White-label Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Customize the platform with your branding
                      </p>
                      <Button variant="outline">Configure Branding</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage unlimited team members and permissions
                      </p>
                      <Button variant="outline">Manage Teams</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Custom Workflows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Set up automated workflows for your organization
                      </p>
                      <Button variant="outline">Configure Workflows</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Compliance Reporting</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Generate compliance reports and audit logs
                      </p>
                      <Button variant="outline">View Reports</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
