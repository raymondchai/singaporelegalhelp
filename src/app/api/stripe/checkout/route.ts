import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, PRICING_PLANS } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate plan exists
    if (!(planId in PRICING_PLANS)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS]
    
    // Create Stripe checkout session
    const session = await createCheckoutSession(
      plan.priceId,
      undefined, // Customer ID - would be created/retrieved in production
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&plan=${planId}`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`
    )

    // Log the payment attempt
    await getSupabaseAdmin()
      .from('payment_transactions')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: session.id,
        amount: plan.amount,
        currency: plan.currency.toUpperCase(),
        payment_method: 'stripe',
        status: 'pending',
        metadata: {
          plan_id: planId,
          session_id: session.id,
        },
      })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
