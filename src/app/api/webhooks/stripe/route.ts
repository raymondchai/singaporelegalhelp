// =====================================================
// Phase 6A: Stripe Webhook Handler
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, stripeSubscriptionService } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle the event
    try {
      await stripeSubscriptionService.handleWebhook(event);
      
      // Additional specific handling for important events
      switch (event.type) {
        case 'customer.subscription.created':
          console.log('New subscription created:', event.data.object.id);
          break;
          
        case 'customer.subscription.updated':
          console.log('Subscription updated:', event.data.object.id);
          break;
          
        case 'customer.subscription.deleted':
          console.log('Subscription deleted:', event.data.object.id);
          break;
          
        case 'invoice.payment_succeeded':
          console.log('Payment succeeded for invoice:', event.data.object.id);
          break;
          
        case 'invoice.payment_failed':
          console.log('Payment failed for invoice:', event.data.object.id);
          break;
          
        case 'customer.subscription.trial_will_end':
          console.log('Trial ending soon for subscription:', event.data.object.id);
          // TODO: Send notification to user
          break;
          
        case 'invoice.upcoming':
          console.log('Upcoming invoice for subscription:', event.data.object.subscription);
          // TODO: Send billing reminder to user
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return NextResponse.json({ 
        success: true,
        message: 'Webhook processed successfully' 
      });

    } catch (error: any) {
      console.error('Webhook processing error:', error);
      return NextResponse.json(
        { 
          error: 'Webhook processing failed',
          details: error.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook handler failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks
export const runtime = 'nodejs';
export const preferredRegion = 'auto';
