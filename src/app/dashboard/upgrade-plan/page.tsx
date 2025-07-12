'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Zap,
  Check,
  ArrowLeft,
  Info,
  Star,
  Users,
  FileText,
  MessageCircle,
  Shield,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function UpgradePlanPage() {
  const router = useRouter()

  // Mock subscription tiers
  const subscriptionTiers = [
    {
      id: 'basic',
      name: 'Basic Individual',
      price: 19.90,
      popular: false,
      features: [
        'Access to all legal content',
        'Basic document templates',
        '5 AI chat sessions/month',
        'Email support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Individual',
      price: 29.90,
      popular: true,
      features: [
        'Everything in Basic',
        'Advanced document builder',
        'Unlimited AI chat sessions',
        'Priority support',
        'Document collaboration',
        'Export to PDF/Word'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 49.90,
      popular: false,
      features: [
        'Everything in Premium',
        'Team collaboration (up to 5 users)',
        'Advanced analytics',
        'Custom templates',
        'API access',
        'Phone support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.90,
      popular: false,
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'On-premise deployment option'
      ]
    }
  ]

  return (
    <DashboardLayout
      title="Upgrade Your Plan"
      subtitle="Choose the plan that best fits your legal needs"
      actions={
        <div className="flex items-center space-x-3">
          <Link href="/dashboard/subscription">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscription
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Coming Soon Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Plan upgrades are coming soon!</strong> We're finalizing our subscription system with secure payment processing and instant plan activation.
          </AlertDescription>
        </Alert>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Your Current Plan</span>
            </CardTitle>
            <CardDescription>
              You're currently on the Free plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Free Plan</h3>
                <p className="text-sm text-gray-600">Basic access to legal content</p>
              </div>
              <Badge variant="outline">Current</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.popular ? 'border-blue-500 shadow-lg' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  S${tier.price}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                  disabled
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
            <CardDescription>
              Compare features across all subscription tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Free</th>
                    <th className="text-center py-3 px-4">Basic</th>
                    <th className="text-center py-3 px-4">Premium</th>
                    <th className="text-center py-3 px-4">Professional</th>
                    <th className="text-center py-3 px-4">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-3 px-4">Legal Content Access</td>
                    <td className="text-center py-3 px-4">Limited</td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                    <td className="text-center py-3 px-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">AI Chat Sessions</td>
                    <td className="text-center py-3 px-4">3/month</td>
                    <td className="text-center py-3 px-4">5/month</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Document Templates</td>
                    <td className="text-center py-3 px-4">Basic</td>
                    <td className="text-center py-3 px-4">Basic</td>
                    <td className="text-center py-3 px-4">Advanced</td>
                    <td className="text-center py-3 px-4">Custom</td>
                    <td className="text-center py-3 px-4">Custom</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Team Collaboration</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">5 users</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Common questions about our subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Can I change my plan anytime?</h4>
                <p className="text-sm text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
                <p className="text-sm text-gray-600">We accept all major credit cards, PayNow, and NETS for Singapore customers.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Is there a free trial?</h4>
                <p className="text-sm text-gray-600">Yes, all paid plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Need a Custom Solution?</CardTitle>
            <CardDescription>
              Contact our sales team for enterprise pricing and custom features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Button disabled>
                <Users className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
              <Button variant="outline" disabled>
                <MessageCircle className="h-4 w-4 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
