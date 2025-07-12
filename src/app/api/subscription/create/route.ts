// =====================================================
// Phase 6A: Subscription Creation API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { stripeSubscriptionService } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SUBSCRIPTION_TIERS, SubscriptionTier, BillingCycle } from '@/lib/subscription-config';

// Helper function to get subscription price
function getSubscriptionPrice(tier: string): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier as SubscriptionTier];
  return tierConfig ? tierConfig.pricing.monthly_price_sgd : 0;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, tier, billingCycle, paymentMethodId, promotionalCodeId } = await request.json();

    // Validate required fields
    if (!userId || !tier || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tier, billingCycle' },
        { status: 400 }
      );
    }

    // Validate tier and billing cycle
    const validTiers: SubscriptionTier[] = ['free', 'basic_individual', 'premium_individual', 'professional', 'enterprise'];
    const validCycles: BillingCycle[] = ['monthly', 'annual'];

    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    if (!validCycles.includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const supabase = getSupabaseAdmin();
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id, tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 409 }
      );
    }

    // Handle free tier separately (no payment required)
    if (tier === 'free') {
      // Create free subscription record
      const { data: freeSubscription } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          billing_cycle: billingCycle,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
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
        message: 'Free subscription activated successfully',
      });
    }

    // Create paid subscription through Stripe
    const result = await stripeSubscriptionService.createSubscription(
      userId,
      tier,
      billingCycle,
      paymentMethodId,
      promotionalCodeId
    );

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      clientSecret: result.clientSecret,
      message: 'Subscription created successfully',
    });

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create subscription',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve subscription options
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

    // Get user's current subscription from profiles table
    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, subscription_status, user_type, created_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    // Map profile subscription_status to subscription object format
    const currentSubscription = {
      id: profile.id,
      tier: profile.subscription_status || 'free',
      billing_cycle: 'monthly',
      status: 'active',
      current_period_start: profile.created_at,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      base_amount_sgd: getSubscriptionPrice(profile.subscription_status || 'free'),
      final_amount_sgd: getSubscriptionPrice(profile.subscription_status || 'free'),
      cancel_at_period_end: false,
    };

    // Get available subscription tiers from config
    const availableTiers = Object.values(SUBSCRIPTION_TIERS).map(tier => ({
      tier: tier.id,
      name: tier.name,
      description: tier.description,
      monthly_price_sgd: tier.pricing.monthly_price_sgd,
      annual_price_sgd: tier.pricing.annual_price_sgd,
      features: tier.features,
    }));

    return NextResponse.json({
      success: true,
      currentSubscription,
      availableTiers,
    });

  } catch (error: any) {
    console.error('Failed to get subscription options:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve subscription options',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
