import { NextRequest, NextResponse } from 'next/server'
import { netsPaymentService } from '@/lib/nets'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-nets-signature') || ''

    // Parse and verify webhook
    const webhookData = await netsPaymentService.parseWebhook(body, signature)

    // Handle different webhook events
    switch (webhookData.event_type) {
      case 'payment.completed':
        await handlePaymentCompleted(webhookData.data)
        break
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData.data)
        break
      
      case 'payment.refunded':
        await handlePaymentRefunded(webhookData.data)
        break
      
      default:
        console.log(`Unhandled NETS webhook event: ${webhookData.event_type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('NETS webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentCompleted(paymentData: any) {
  console.log('NETS payment completed:', paymentData.transaction_id)
  
  // Update payment transaction status
  const { error } = await getSupabaseAdmin()
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      metadata: {
        ...paymentData,
        completed_at: new Date().toISOString(),
      },
    })
    .eq('nets_transaction_id', paymentData.transaction_id)

  if (error) {
    console.error('Failed to update payment transaction:', error)
    return
  }

  // Get the transaction to find the user and plan
  const { data: transaction } = await getSupabaseAdmin()
    .from('payment_transactions')
    .select('user_id, metadata')
    .eq('nets_transaction_id', paymentData.transaction_id)
    .single()

  if (transaction && transaction.metadata) {
    const planId = (transaction.metadata as any).plan_id
    
    // Update user subscription status
    let subscriptionStatus: 'free' | 'basic' | 'premium' | 'enterprise' = 'free'
    
    switch (planId) {
      case 'basic':
        subscriptionStatus = 'basic'
        break
      case 'premium':
        subscriptionStatus = 'premium'
        break
      case 'enterprise':
        subscriptionStatus = 'enterprise'
        break
    }

    await getSupabaseAdmin()
      .from('profiles')
      .update({ subscription_status: subscriptionStatus })
      .eq('id', transaction.user_id)
  }
}

async function handlePaymentFailed(paymentData: any) {
  console.log('NETS payment failed:', paymentData.transaction_id)
  
  // Update payment transaction status
  await getSupabaseAdmin()
    .from('payment_transactions')
    .update({
      status: 'failed',
      metadata: {
        ...paymentData,
        failed_at: new Date().toISOString(),
      },
    })
    .eq('nets_transaction_id', paymentData.transaction_id)
}

async function handlePaymentRefunded(paymentData: any) {
  console.log('NETS payment refunded:', paymentData.transaction_id)
  
  // Update payment transaction status
  await getSupabaseAdmin()
    .from('payment_transactions')
    .update({
      status: 'refunded',
      metadata: {
        ...paymentData,
        refunded_at: new Date().toISOString(),
      },
    })
    .eq('nets_transaction_id', paymentData.transaction_id)

  // Get the transaction to find the user
  const { data: transaction } = await getSupabaseAdmin()
    .from('payment_transactions')
    .select('user_id')
    .eq('nets_transaction_id', paymentData.transaction_id)
    .single()

  if (transaction) {
    // Reset user to free plan
    await getSupabaseAdmin()
      .from('profiles')
      .update({ subscription_status: 'free' })
      .eq('id', transaction.user_id)
  }
}
