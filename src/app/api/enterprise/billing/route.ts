// =====================================================
// Phase 6A: Enterprise Billing API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      subscriptionId, 
      invoiceData,
      paymentTerms = 30,
      customPricing 
    } = await request.json();

    // Validate required fields
    if (!userId || !subscriptionId || !invoiceData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subscriptionId, invoiceData' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user has enterprise subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (!subscription || subscription.tier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Enterprise subscription required for custom billing' },
        { status: 403 }
      );
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate dates
    const invoiceDate = new Date();
    const dueDate = new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000);

    // Create custom invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal_sgd: invoiceData.subtotal,
        tax_amount_sgd: invoiceData.tax || 0,
        discount_amount_sgd: invoiceData.discount || 0,
        total_amount_sgd: invoiceData.total,
        payment_terms: paymentTerms,
        payment_method: 'corporate_invoice',
        status: 'sent',
        notes: invoiceData.notes,
        metadata: {
          custom_pricing: customPricing,
          line_items: invoiceData.lineItems,
        },
      })
      .select()
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // TODO: Generate PDF invoice
    // TODO: Send invoice email

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Enterprise invoice created successfully',
    });

  } catch (error: any) {
    console.error('Enterprise billing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create enterprise invoice',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve enterprise invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user has enterprise subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.tier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Enterprise subscription required' },
        { status: 403 }
      );
    }

    let query = supabase
      .from('customer_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      invoices: invoices || [],
    });

  } catch (error: any) {
    console.error('Failed to fetch enterprise invoices:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoices',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
