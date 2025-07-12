// =====================================================
// Phase 6A: Subscription Cancellation API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { stripeSubscriptionService } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, cancelAtPeriodEnd = true, cancellationReason } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Get current subscription
    const supabase = getSupabaseAdmin();
    const { data: currentSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Handle free tier cancellation
    if (currentSubscription.tier === 'free') {
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          canceled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentSubscription.id);

      return NextResponse.json({
        success: true,
        message: 'Free subscription cancelled successfully',
        subscription: {
          ...currentSubscription,
          status: 'cancelled',
          canceled_at: new Date().toISOString(),
        },
      });
    }

    // Handle paid subscription cancellation through Stripe
    const cancelledSubscription = await stripeSubscriptionService.cancelSubscription(
      userId,
      cancelAtPeriodEnd
    );

    // Update cancellation reason in database
    await supabase
      .from('user_subscriptions')
      .update({
        cancellation_reason: cancellationReason,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', cancelledSubscription.id);

    // Log cancellation for analytics
    await supabase
      .from('subscription_changes')
      .insert({
        user_id: userId,
        subscription_id: currentSubscription.id,
        change_type: 'cancelled',
        from_tier: currentSubscription.tier,
        to_tier: null,
        reason: cancellationReason,
        initiated_by: userId,
      });

    const message = cancelAtPeriodEnd 
      ? 'Subscription will be cancelled at the end of the current billing period'
      : 'Subscription cancelled immediately';

    return NextResponse.json({
      success: true,
      message,
      subscription: cancelledSubscription,
      accessUntil: cancelAtPeriodEnd ? currentSubscription.current_period_end : new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview cancellation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get current subscription
    const supabase = getSupabaseAdmin();
    const { data: currentSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Calculate what happens on cancellation
    const now = new Date();
    const periodEnd = new Date(currentSubscription.current_period_end);
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate potential refund (if applicable)
    let refundAmount = 0;
    if (currentSubscription.tier !== 'free') {
      const totalDaysInPeriod = currentSubscription.billing_cycle === 'monthly' ? 30 : 365;
      const unusedDays = Math.max(0, daysRemaining);
      refundAmount = (currentSubscription.final_amount_sgd * unusedDays) / totalDaysInPeriod;
    }

    // Get usage data for the current period
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('resource_type, quantity')
      .eq('user_id', userId)
      .gte('tracked_at', currentSubscription.current_period_start)
      .lte('tracked_at', currentSubscription.current_period_end);

    // Aggregate usage
    const usage = usageData?.reduce((acc, record) => {
      acc[record.resource_type] = (acc[record.resource_type] || 0) + record.quantity;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      cancellationPreview: {
        currentTier: currentSubscription.tier,
        billingCycle: currentSubscription.billing_cycle,
        currentPeriodEnd: currentSubscription.current_period_end,
        daysRemaining,
        paidAmount: currentSubscription.final_amount_sgd,
        potentialRefund: refundAmount,
        accessUntilCancellation: periodEnd.toISOString(),
        downgradeToFree: true,
        currentPeriodUsage: usage,
      },
      recommendations: {
        cancelAtPeriodEnd: daysRemaining > 7,
        reason: daysRemaining > 7 
          ? 'You have significant time remaining in your billing period'
          : 'Your billing period ends soon, immediate cancellation may be appropriate',
      },
    });

  } catch (error: any) {
    console.error('Failed to preview cancellation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to preview cancellation',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
