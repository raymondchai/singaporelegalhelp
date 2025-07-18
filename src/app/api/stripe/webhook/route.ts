import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id)

  // Update payment transaction status
  await getSupabaseAdmin()
    .from('payment_transactions')
    .update({
      status: 'succeeded',
      metadata: {
        checkout_session_id: session.id,
        customer_id: session.customer,
        subscription_id: session.subscription,
      },
    })
    .eq('stripe_payment_intent_id', session.id)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)

  // Update payment transaction status
  await getSupabaseAdmin()
    .from('payment_transactions')
    .update({ status: 'succeeded' })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id)

  // Update payment transaction status
  await getSupabaseAdmin()
    .from('payment_transactions')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log('Subscription changed:', subscription.id)
  
  // Get customer ID and find user
  const customerId = subscription.customer as string
  
  // In production, you would have a customer_id field in profiles table
  // For now, we'll update based on subscription metadata or other identifier
  
  // Determine subscription status
  let subscriptionStatus: 'free' | 'basic' | 'premium' | 'enterprise' = 'free'
  
  if (subscription.status === 'active') {
    // Determine plan based on price ID
    const priceId = subscription.items.data[0]?.price.id
    
    if (priceId === 'price_basic_sgd') {
      subscriptionStatus = 'basic'
    } else if (priceId === 'price_premium_sgd') {
      subscriptionStatus = 'premium'
    } else if (priceId === 'price_enterprise_sgd') {
      subscriptionStatus = 'enterprise'
    }
  }
  
  // Update user subscription status
  // This would need to be implemented based on how you link Stripe customers to users
  console.log(`Would update user subscription to: ${subscriptionStatus}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  // Reset user to free plan
  // This would need to be implemented based on how you link Stripe customers to users
  console.log('Would reset user to free plan')
}
