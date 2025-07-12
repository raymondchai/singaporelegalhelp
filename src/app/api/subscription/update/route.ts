// =====================================================
// Phase 6A: Subscription Update API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { stripeSubscriptionService } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SubscriptionTier, BillingCycle } from '@/lib/subscription-config';

export async function POST(request: NextRequest) {
  try {
    const { userId, newTier, newBillingCycle } = await request.json();

    // Validate required fields
    if (!userId || !newTier || !newBillingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, newTier, newBillingCycle' },
        { status: 400 }
      );
    }

    // Validate tier and billing cycle
    const validTiers: SubscriptionTier[] = ['free', 'basic_individual', 'premium_individual', 'professional', 'enterprise'];
    const validCycles: BillingCycle[] = ['monthly', 'annual'];

    if (!validTiers.includes(newTier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    if (!validCycles.includes(newBillingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
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

    // Check if this is actually a change
    if (currentSubscription.tier === newTier && currentSubscription.billing_cycle === newBillingCycle) {
      return NextResponse.json(
        { error: 'New subscription settings are the same as current settings' },
        { status: 400 }
      );
    }

    // Handle downgrade to free tier
    if (newTier === 'free') {
      // Cancel current subscription
      if (currentSubscription.stripe_subscription_id) {
        await stripeSubscriptionService.cancelSubscription(userId, true);
      }

      // Create free subscription
      const { data: freeSubscription } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          billing_cycle: newBillingCycle,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          base_amount_sgd: 0,
          final_amount_sgd: 0,
        })
        .select()
        .single();

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', userId);

      return NextResponse.json({
        success: true,
        subscription: freeSubscription,
        message: 'Subscription downgraded to free tier',
      });
    }

    // Handle upgrade from free tier
    if (currentSubscription.tier === 'free') {
      // Mark current free subscription as cancelled
      await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          canceled_at: new Date().toISOString() 
        })
        .eq('id', currentSubscription.id);

      // Create new paid subscription
      const result = await stripeSubscriptionService.createSubscription(
        userId,
        newTier,
        newBillingCycle
      );

      return NextResponse.json({
        success: true,
        subscription: result.subscription,
        clientSecret: result.clientSecret,
        message: 'Subscription upgraded successfully',
      });
    }

    // Handle paid tier changes (upgrade/downgrade between paid tiers)
    const updatedSubscription = await stripeSubscriptionService.updateSubscription(
      userId,
      newTier,
      newBillingCycle
    );

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: 'Subscription updated successfully',
    });

  } catch (error: any) {
    console.error('Subscription update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview subscription changes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const newTier = searchParams.get('newTier') as SubscriptionTier;
    const newBillingCycle = searchParams.get('newBillingCycle') as BillingCycle;

    if (!userId || !newTier || !newBillingCycle) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, newTier, newBillingCycle' },
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

    // Get tier features for comparison
    const { data: currentTierFeatures } = await supabase
      .from('subscription_tier_features')
      .select('*')
      .eq('tier', currentSubscription.tier)
      .single();

    const { data: newTierFeatures } = await supabase
      .from('subscription_tier_features')
      .select('*')
      .eq('tier', newTier)
      .single();

    // Calculate pricing changes
    const currentPrice = currentSubscription.billing_cycle === 'monthly' 
      ? currentTierFeatures?.monthly_price_sgd || 0
      : currentTierFeatures?.annual_price_sgd || 0;

    const newPrice = newBillingCycle === 'monthly'
      ? newTierFeatures?.monthly_price_sgd || 0
      : newTierFeatures?.annual_price_sgd || 0;

    const priceDifference = newPrice - currentPrice;

    // Calculate prorated amount (simplified calculation)
    const daysRemaining = Math.ceil(
      (new Date(currentSubscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const totalDaysInPeriod = currentSubscription.billing_cycle === 'monthly' ? 30 : 365;
    const prorationFactor = daysRemaining / totalDaysInPeriod;
    const proratedAmount = priceDifference * prorationFactor;

    return NextResponse.json({
      success: true,
      preview: {
        currentTier: currentSubscription.tier,
        newTier,
        currentBillingCycle: currentSubscription.billing_cycle,
        newBillingCycle,
        currentPrice,
        newPrice,
        priceDifference,
        proratedAmount,
        daysRemaining,
        effectiveDate: new Date().toISOString(),
        nextBillingDate: currentSubscription.current_period_end,
      },
      currentFeatures: currentTierFeatures,
      newFeatures: newTierFeatures,
    });

  } catch (error: any) {
    console.error('Failed to preview subscription changes:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to preview subscription changes',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
