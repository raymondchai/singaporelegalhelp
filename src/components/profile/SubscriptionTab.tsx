'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Crown, Star, Zap, Shield } from 'lucide-react'
import { useAdminAccess } from '@/hooks/useAdminAccess'

interface UserProfile {
  id: string
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise'
  user_type?: string
}

interface SubscriptionTabProps {
  userProfile: UserProfile
  onUpdate: (profile: UserProfile) => void
}

export function SubscriptionTab({ userProfile }: SubscriptionTabProps) {
  const { isAdmin, adminRole } = useAdminAccess()
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 'S$0',
      icon: Star,
      features: ['Basic legal templates', 'Limited document generation', 'Community support'],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 'S$29',
      icon: CreditCard,
      features: ['All legal templates', 'Unlimited documents', 'Email support', 'Document sharing'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'S$99',
      icon: Crown,
      features: ['Everything in Basic', 'Team collaboration', 'Priority support', 'Advanced analytics'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      icon: Zap,
      features: ['Everything in Premium', 'Custom integrations', 'Dedicated support', 'White-label options'],
    },
  ]

  const currentPlan = plans.find(plan => plan.id === userProfile.subscription_tier)

  // Check if user is admin
  const isUserAdmin = isAdmin || userProfile.user_type === 'admin'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isUserAdmin ? <Shield className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            <span>{isUserAdmin ? 'Administrative Access' : 'Current Subscription'}</span>
          </CardTitle>
          <CardDescription>
            {isUserAdmin
              ? 'You have administrative privileges on this platform'
              : 'Manage your subscription and billing information'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isUserAdmin ? (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">System Administrator</h3>
                  <p className="text-sm text-red-700">
                    {adminRole?.role === 'super_admin' ? 'Super Admin' : 'Admin'} • Full Platform Access
                  </p>
                </div>
              </div>
              <Badge variant="destructive">Admin</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {currentPlan && <currentPlan.icon className="h-6 w-6 text-blue-600" />}
                <div>
                  <h3 className="font-medium">{currentPlan?.name} Plan</h3>
                  <p className="text-sm text-gray-600">{currentPlan?.price}/month</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {!isUserAdmin && (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.id === userProfile.subscription_tier ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <plan.icon className="h-5 w-5" />
                  <span>{plan.name}</span>
                  {plan.id === userProfile.subscription_tier && (
                    <Badge variant="default">Current</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-2xl font-bold">
                  {plan.price}
                  {plan.price !== 'Custom' && <span className="text-sm font-normal">/month</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={`${plan.id}-feature-${featureIndex}`} className="text-sm text-gray-600">• {feature}</li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.id === userProfile.subscription_tier ? 'outline' : 'default'}
                  disabled={plan.id === userProfile.subscription_tier}
                >
                  {plan.id === userProfile.subscription_tier ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isUserAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Admin Privileges</span>
            </CardTitle>
            <CardDescription>
              Administrative access and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">Role</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {adminRole?.role?.replace('_', ' ') || 'Administrator'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">Access Level</h4>
                  <p className="text-sm text-gray-600">Full Platform Access</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">User Management</Badge>
                  <Badge variant="secondary">Content Management</Badge>
                  <Badge variant="secondary">System Configuration</Badge>
                  <Badge variant="secondary">Analytics Access</Badge>
                  <Badge variant="secondary">Full Database Access</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
