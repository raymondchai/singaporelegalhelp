'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  email: string
  two_factor_enabled: boolean
  last_login_at?: string
  login_count: number
  failed_login_attempts: number
}

interface SecurityTabProps {
  userProfile: UserProfile
  onUpdate: (profile: UserProfile) => void
}

export function SecurityTab({ userProfile, onUpdate }: SecurityTabProps) {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState({
    password: false,
    twoFactor: false,
    backupCodes: false,
  })
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  
  const { toast } = useToast()

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Password Mismatch',
        description: 'New passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    if (passwordData.new_password.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      })
      return
    }

    setLoading(prev => ({ ...prev, password: true }))

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change password')
      }

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      })

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (error: any) {
      toast({
        title: 'Password Change Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const handleTwoFactorToggle = async () => {
    setLoading(prev => ({ ...prev, twoFactor: true }))

    try {
      const action = userProfile.two_factor_enabled ? 'disable' : 'enable'
      const response = await fetch('/api/user/two-factor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update two-factor authentication')
      }

      const result = await response.json()
      
      onUpdate({
        ...userProfile,
        two_factor_enabled: !userProfile.two_factor_enabled,
      })

      if (result.backupCodes) {
        setBackupCodes(result.backupCodes)
        setShowBackupCodes(true)
      }

      toast({
        title: `Two-Factor Authentication ${action === 'enable' ? 'Enabled' : 'Disabled'}`,
        description: `2FA has been ${action}d for your account.`,
      })
    } catch (error: any) {
      toast({
        title: '2FA Update Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, twoFactor: false }))
    }
  }

  const generateBackupCodes = async () => {
    setLoading(prev => ({ ...prev, backupCodes: true }))

    try {
      const response = await fetch('/api/user/backup-codes', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate backup codes')
      }

      const result = await response.json()
      setBackupCodes(result.codes)
      setShowBackupCodes(true)

      toast({
        title: 'Backup Codes Generated',
        description: 'New backup codes have been generated. Please save them securely.',
      })
    } catch (error: any) {
      toast({
        title: 'Backup Code Generation Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, backupCodes: false }))
    }
  }

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'singapore-legal-help-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Change Password</span>
          </CardTitle>
          <CardDescription>
            Update your account password for better security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={loading.password}>
              <Lock className="h-4 w-4 mr-2" />
              {loading.password ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
            <Badge variant={userProfile.two_factor_enabled ? 'default' : 'secondary'}>
              {userProfile.two_factor_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            {userProfile.two_factor_enabled ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm">
                {userProfile.two_factor_enabled
                  ? 'Two-factor authentication is currently enabled for your account.'
                  : 'Two-factor authentication is not enabled. Enable it for better security.'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleTwoFactorToggle}
              disabled={loading.twoFactor}
              variant={userProfile.two_factor_enabled ? 'destructive' : 'default'}
            >
              <Shield className="h-4 w-4 mr-2" />
              {loading.twoFactor
                ? 'Processing...'
                : userProfile.two_factor_enabled
                ? 'Disable 2FA'
                : 'Enable 2FA'}
            </Button>

            {userProfile.two_factor_enabled && (
              <Button
                onClick={generateBackupCodes}
                disabled={loading.backupCodes}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {loading.backupCodes ? 'Generating...' : 'Generate Backup Codes'}
              </Button>
            )}
          </div>

          {showBackupCodes && backupCodes.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-yellow-900">Backup Codes</h4>
                <Button
                  onClick={downloadBackupCodes}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <p className="text-sm text-yellow-800 mb-3">
                Save these backup codes in a secure location. Each code can only be used once.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Account Activity</span>
          </CardTitle>
          <CardDescription>
            Recent activity and login information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Last Login</Label>
              <p className="text-sm text-gray-600">
                {userProfile.last_login_at
                  ? new Date(userProfile.last_login_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Total Logins</Label>
              <p className="text-sm text-gray-600">{userProfile.login_count}</p>
            </div>
          </div>

          {userProfile.failed_login_attempts > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">
                  <strong>Security Alert:</strong> {userProfile.failed_login_attempts} failed login attempts detected.
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Security Tip:</strong> Regularly review your account activity and enable 
              two-factor authentication for enhanced security.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
