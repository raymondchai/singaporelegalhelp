import { Stripe } from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

// Pricing configuration for Singapore market
export const PRICING_PLANS = {
  basic: {
    priceId: 'price_basic_sgd',
    amount: 2900, // $29 SGD
    currency: 'sgd',
    interval: 'month',
    name: 'Basic Plan',
    description: 'Essential legal assistance features',
    features: [
      'AI Legal Q&A (50 questions/month)',
      'Document Analysis (5 documents/month)',
      'Basic Legal Templates',
      'Email Support',
    ],
  },
  premium: {
    priceId: 'price_premium_sgd',
    amount: 9900, // $99 SGD
    currency: 'sgd',
    interval: 'month',
    name: 'Premium Plan',
    description: 'Advanced legal assistance with priority support',
    features: [
      'AI Legal Q&A (Unlimited)',
      'Document Analysis (50 documents/month)',
      'Advanced Legal Templates',
      'Priority Email Support',
      'Chat Support',
      'Legal Document Generation',
    ],
  },
  enterprise: {
    priceId: 'price_enterprise_sgd',
    amount: 29900, // $299 SGD
    currency: 'sgd',
    interval: 'month',
    name: 'Enterprise Plan',
    description: 'Complete legal solution for businesses',
    features: [
      'Everything in Premium',
      'Unlimited Document Analysis',
      'Custom Legal Templates',
      'Dedicated Account Manager',
      'Phone Support',
      'API Access',
      'Custom Integrations',
    ],
  },
}

export type PricingPlan = keyof typeof PRICING_PLANS

// Helper function to format currency
export function formatPrice(amount: number, currency: string = 'SGD'): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}

// Helper function to create checkout session
export async function createCheckoutSession(
  priceId: string,
  customerId?: string,
  successUrl?: string,
  cancelUrl?: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  })

  return session
}
