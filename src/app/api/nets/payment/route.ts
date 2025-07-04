import { NextRequest, NextResponse } from 'next/server'
import { createNETSSubscriptionPayment } from '@/lib/nets'
import { getSupabaseAdmin } from '@/lib/supabase'
import { PRICING_PLANS } from '@/lib/stripe'

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
    
    // Create NETS payment
    const paymentResponse = await createNETSSubscriptionPayment(
      planId,
      userId,
      profile.email,
      profile.full_name || profile.email
    )

    // Log the payment attempt
    await getSupabaseAdmin()
      .from('payment_transactions')
      .insert({
        user_id: userId,
        nets_transaction_id: paymentResponse.transactionId,
        amount: plan.amount,
        currency: plan.currency.toUpperCase(),
        payment_method: 'nets',
        status: 'pending',
        metadata: {
          plan_id: planId,
          transaction_id: paymentResponse.transactionId,
        },
      })

    return NextResponse.json({
      transactionId: paymentResponse.transactionId,
      paymentUrl: paymentResponse.paymentUrl,
      status: paymentResponse.status,
    })

  } catch (error: any) {
    console.error('NETS payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create NETS payment' },
      { status: 500 }
    )
  }
}
