// =====================================================
// Phase 6A: Promotional Code Application API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      promoCodeId, 
      userId, 
      subscriptionId, 
      originalAmount, 
      discountAmount, 
      finalAmount 
    } = await request.json();

    // Validate required fields
    if (!promoCodeId || !userId || !originalAmount || !discountAmount || !finalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Start a transaction-like operation
    try {
      // Record promotional code usage
      const { data: usage, error: usageError } = await supabase
        .from('promotional_code_usage')
        .insert({
          promotional_code_id: promoCodeId,
          user_id: userId,
          subscription_id: subscriptionId,
          discount_amount_sgd: discountAmount,
          original_amount_sgd: originalAmount,
          final_amount_sgd: finalAmount,
        })
        .select()
        .single();

      if (usageError) {
        throw usageError;
      }

      // Increment usage count on promotional code
      const { error: updateError } = await supabase
        .rpc('increment_promo_usage', { promo_id: promoCodeId });

      if (updateError) {
        // Rollback usage record if increment fails
        await supabase
          .from('promotional_code_usage')
          .delete()
          .eq('id', usage.id);
        
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: 'Promotional code applied successfully',
        usage: {
          id: usage.id,
          discount_amount: discountAmount,
          original_amount: originalAmount,
          final_amount: finalAmount,
          applied_at: usage.used_at,
        },
      });

    } catch (dbError: any) {
      console.error('Database error applying promotional code:', dbError);
      throw new Error('Failed to apply promotional code');
    }

  } catch (error: any) {
    console.error('Promotional code application error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to apply promotional code',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's promotional code usage history
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

    const supabase = getSupabaseAdmin();

    const { data: usageHistory, error } = await supabase
      .from('promotional_code_usage')
      .select(`
        *,
        promotional_codes (
          code,
          name,
          description,
          discount_type,
          discount_value
        )
      `)
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      usageHistory: usageHistory || [],
    });

  } catch (error: any) {
    console.error('Failed to fetch promotional code usage history:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch usage history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
