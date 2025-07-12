import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SubscriptionDetails } from '@/types/dashboard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        subscription_tier,
        billing_cycle,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        trial_end,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Subscription fetch error:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // Get usage data for current billing period
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', subscription?.current_period_start || new Date().toISOString())
      .single()

    // Get billing history
    const { data: billingHistory, error: billingError } = await supabase
      .from('billing_transactions')
      .select(`
        id,
        amount_sgd,
        currency,
        status,
        transaction_date,
        invoice_url,
        payment_method_type
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(10)

    // Get payment methods
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('user_payment_methods')
      .select(`
        id,
        payment_type,
        last_four_digits,
        card_brand,
        is_default,
        expiry_month,
        expiry_year,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Default subscription for free users
    if (!subscription) {
      const defaultSubscription: SubscriptionDetails = {
        id: 'free-' + user.id,
        tier: 'free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        usage: {
          documents: { used: usage?.document_generation || 0, limit: 3 },
          aiQueries: { used: usage?.ai_query || 0, limit: 10 },
          storage: { used: usage?.storage_bytes || 0, limit: 1024 * 1024 * 1024 }, // 1GB
          teamMembers: { used: 1, limit: 1 }
        },
        billingHistory: [],
        paymentMethods: []
      }

      return NextResponse.json({
        success: true,
        subscription: defaultSubscription
      })
    }

    // Format subscription data
    const formattedSubscription: SubscriptionDetails = {
      id: subscription.id,
      tier: subscription.subscription_tier as any,
      status: subscription.status as any,
      billingCycle: subscription.billing_cycle as any,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end,
      usage: {
        documents: { 
          used: usage?.document_generation || 0, 
          limit: getUsageLimit(subscription.subscription_tier, 'documents') 
        },
        aiQueries: { 
          used: usage?.ai_query || 0, 
          limit: getUsageLimit(subscription.subscription_tier, 'aiQueries') 
        },
        storage: { 
          used: usage?.storage_bytes || 0, 
          limit: getUsageLimit(subscription.subscription_tier, 'storage') 
        },
        teamMembers: { 
          used: usage?.team_members || 1, 
          limit: getUsageLimit(subscription.subscription_tier, 'teamMembers') 
        }
      },
      billingHistory: (billingHistory || []).map(bill => ({
        id: bill.id,
        amount: bill.amount_sgd,
        currency: bill.currency,
        status: bill.status as any,
        date: bill.transaction_date,
        invoiceUrl: bill.invoice_url,
        paymentMethod: bill.payment_method_type
      })),
      paymentMethods: (paymentMethods || []).map(method => ({
        id: method.id,
        type: method.payment_type as any,
        last4: method.last_four_digits,
        brand: method.card_brand,
        isDefault: method.is_default,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year
      }))
    }

    return NextResponse.json({
      success: true,
      subscription: formattedSubscription
    })

  } catch (error) {
    console.error('Current subscription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get usage limits based on subscription tier
function getUsageLimit(tier: string, type: string): number {
  const limits: Record<string, Record<string, number>> = {
    free: {
      documents: 3,
      aiQueries: 10,
      storage: 1024 * 1024 * 1024, // 1GB
      teamMembers: 1
    },
    basic_individual: {
      documents: 25,
      aiQueries: 100,
      storage: 10 * 1024 * 1024 * 1024, // 10GB
      teamMembers: 1
    },
    premium_individual: {
      documents: -1, // unlimited
      aiQueries: 500,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
      teamMembers: 3
    },
    professional: {
      documents: -1, // unlimited
      aiQueries: -1, // unlimited
      storage: 200 * 1024 * 1024 * 1024, // 200GB
      teamMembers: 10
    },
    enterprise: {
      documents: -1, // unlimited
      aiQueries: -1, // unlimited
      storage: -1, // unlimited
      teamMembers: -1 // unlimited
    }
  }

  return limits[tier]?.[type] || 0
}
