'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale, Check, Star } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { PageLayout } from '@/components/layouts/page-layout'
import { SUBSCRIPTION_TIERS, formatPrice } from '@/lib/subscription-config'
import { useToast } from '@/hooks/use-toast'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectPlan = async (tierId: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(tierId)

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tier: tierId,
          billingCycle: 'monthly', // Default to monthly, can be changed later
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create subscription')
      }

      // Handle different subscription types
      if (data.clientSecret) {
        // Redirect to payment confirmation for paid subscriptions
        router.push(`/dashboard/subscription?payment_intent=${data.clientSecret}`)
      } else {
        // Free subscription activated immediately
        toast({
          title: 'Success',
          description: data.message,
        })
        router.push('/dashboard')
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message ?? 'Failed to start subscription process',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const breadcrumbs = [
    { name: 'Pricing', href: '/pricing', current: true }
  ];

  return (
    <PageLayout
      title="Choose Your Legal Assistance Plan"
      subtitle="Get the legal support you need with our AI-powered platform. All plans include access to Singapore law expertise."
      breadcrumbs={breadcrumbs}
      showNavigation={true}
      showHeader={true}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Legal Assistance Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get the legal support you need with our AI-powered platform. 
            All plans include access to Singapore law expertise.
          </p>
        </div>

        {/* Free Tier Highlight */}
        <div className="text-center mb-12">
          <Card className="max-w-md mx-auto border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-xl text-green-800">Start Free</CardTitle>
              <CardDescription className="text-green-700">
                Get started with essential legal tools at no cost
              </CardDescription>
              <div className="text-3xl font-bold text-green-800">Free Forever</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-green-700">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  3 documents per month
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  5 AI queries per month
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  1GB storage
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Community support
                </li>
              </ul>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleSelectPlan('free')}
                disabled={loading === 'free'}
              >
                {loading === 'free' ? 'Processing...' : 'Start Free'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Paid Tier Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {Object.values(SUBSCRIPTION_TIERS).filter(tier => tier.id !== 'free').map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${tier.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(tier.pricing.monthly_price_sgd)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                {tier.pricing.annual_discount_percentage > 0 && (
                  <p className="text-sm text-green-600">
                    Save {tier.pricing.annual_discount_percentage}% with annual billing
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{tier.features.document_templates_per_month === 'unlimited' ? 'Unlimited' : tier.features.document_templates_per_month} documents/month</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{tier.features.ai_queries_per_month === 'unlimited' ? 'Unlimited' : tier.features.ai_queries_per_month} AI queries/month</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{tier.features.document_storage_gb === 'unlimited' ? 'Unlimited' : tier.features.document_storage_gb + 'GB'} storage</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{tier.features.team_members_limit === 'unlimited' ? 'Unlimited' : tier.features.team_members_limit} team members</span>
                  </li>
                  {tier.features.team_collaboration && (
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Team collaboration</span>
                    </li>
                  )}
                  {tier.features.priority_support && (
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Priority support</span>
                    </li>
                  )}
                  {tier.features.api_access && (
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>API access</span>
                    </li>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(tier.id)}
                  disabled={loading === tier.id}
                >
                  {loading === tier.id ? 'Processing...' : `Choose ${tier.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. 
                Changes will be prorated and reflected in your next billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use enterprise-grade security measures and comply 
                with Singapore's Personal Data Protection Act (PDPA).
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for all paid plans. 
                Contact our support team for assistance.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I get legal advice for other countries?
              </h3>
              <p className="text-gray-600">
                Our platform specializes in Singapore law. For other jurisdictions, 
                we recommend consulting with local legal professionals.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Need help choosing the right plan or have questions?
          </p>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Our Team</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
