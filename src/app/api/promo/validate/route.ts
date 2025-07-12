// =====================================================
// Phase 6A: Promotional Code Validation API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { SubscriptionTier, BillingCycle } from '@/lib/subscription-config';

export async function POST(request: NextRequest) {
  try {
    const { code, userId, tier, billingCycle, amount } = await request.json();

    // Validate required fields
    if (!code || !userId || !tier || !billingCycle || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: code, userId, tier, billingCycle, amount' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find promotional code
    const { data: promoCode, error: promoError } = await supabase
      .from('promotional_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (promoError || !promoCode) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid promotional code',
          message: 'The promotional code you entered is not valid or has expired.'
        },
        { status: 404 }
      );
    }

    // Check date validity
    const now = new Date();
    const validFrom = new Date(promoCode.valid_from);
    const validUntil = new Date(promoCode.valid_until);

    if (now < validFrom) {
      return NextResponse.json({
        valid: false,
        error: 'Code not yet active',
        message: `This promotional code will be active from ${validFrom.toLocaleDateString()}.`
      });
    }

    if (now > validUntil) {
      return NextResponse.json({
        valid: false,
        error: 'Code expired',
        message: `This promotional code expired on ${validUntil.toLocaleDateString()}.`
      });
    }

    // Check tier applicability
    if (promoCode.applicable_tiers.length > 0 && !promoCode.applicable_tiers.includes(tier)) {
      return NextResponse.json({
        valid: false,
        error: 'Code not applicable to tier',
        message: `This promotional code is not valid for the ${tier} subscription tier.`
      });
    }

    // Check billing cycle applicability
    if (promoCode.applicable_billing_cycles.length > 0 && !promoCode.applicable_billing_cycles.includes(billingCycle)) {
      return NextResponse.json({
        valid: false,
        error: 'Code not applicable to billing cycle',
        message: `This promotional code is not valid for ${billingCycle} billing.`
      });
    }

    // Check minimum amount
    if (amount < promoCode.minimum_amount_sgd) {
      return NextResponse.json({
        valid: false,
        error: 'Minimum amount not met',
        message: `This promotional code requires a minimum purchase of S$${promoCode.minimum_amount_sgd}.`
      });
    }

    // Check global usage limits
    if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'Usage limit exceeded',
        message: 'This promotional code has reached its usage limit.'
      });
    }

    // Check per-user usage limits
    const { data: userUsage } = await supabase
      .from('promotional_code_usage')
      .select('id')
      .eq('promotional_code_id', promoCode.id)
      .eq('user_id', userId);

    if (userUsage && userUsage.length >= promoCode.max_uses_per_user) {
      return NextResponse.json({
        valid: false,
        error: 'User usage limit exceeded',
        message: 'You have already used this promotional code the maximum number of times.'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discount_type === 'percentage') {
      discountAmount = (amount * promoCode.discount_value) / 100;
      
      // Apply maximum discount limit if set
      if (promoCode.max_discount_amount_sgd && discountAmount > promoCode.max_discount_amount_sgd) {
        discountAmount = promoCode.max_discount_amount_sgd;
      }
    } else {
      discountAmount = promoCode.discount_value;
    }

    // Ensure discount doesn't exceed the total amount
    discountAmount = Math.min(discountAmount, amount);

    const finalAmount = Math.max(0, amount - discountAmount);

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        name: promoCode.name,
        description: promoCode.description,
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value,
      },
      discount: {
        amount: discountAmount,
        percentage: (discountAmount / amount) * 100,
        original_amount: amount,
        final_amount: finalAmount,
        savings: discountAmount,
      },
      message: `Promotional code applied! You save S$${discountAmount.toFixed(2)}.`
    });

  } catch (error: any) {
    console.error('Promotional code validation error:', error);
    
    return NextResponse.json(
      { 
        valid: false,
        error: 'Validation failed',
        message: 'Failed to validate promotional code. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list available promotional codes (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('active') === 'true';
    const tier = searchParams.get('tier') as SubscriptionTier;

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('promotional_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (isActive) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now);
    }

    if (tier) {
      query = query.contains('applicable_tiers', [tier]);
    }

    const { data: promoCodes, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      promoCodes: promoCodes || [],
    });

  } catch (error: any) {
    console.error('Failed to fetch promotional codes:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch promotional codes',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
