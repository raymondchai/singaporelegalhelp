// =====================================================
// Phase 6A: Revenue Analytics API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = getSupabaseAdmin();

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Monthly Recurring Revenue (MRR)
    const { data: mrrData } = await supabase
      .from('user_subscriptions')
      .select('tier, billing_cycle, final_amount_sgd, created_at')
      .eq('status', 'active')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Calculate MRR
    let totalMRR = 0;
    const tierMRR: Record<string, number> = {};

    mrrData?.forEach(sub => {
      let monthlyAmount = sub.final_amount_sgd;
      if (sub.billing_cycle === 'annual') {
        monthlyAmount = sub.final_amount_sgd / 12;
      }
      
      totalMRR += monthlyAmount;
      tierMRR[sub.tier] = (tierMRR[sub.tier] || 0) + monthlyAmount;
    });

    // Revenue by payment transactions
    const { data: revenueData } = await supabase
      .from('payment_transactions')
      .select('amount_sgd, currency, status, created_at, billing_reason')
      .eq('status', 'succeeded')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    // Calculate total revenue and daily breakdown
    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount_sgd, 0) || 0;
    
    const dailyRevenue: Record<string, number> = {};
    revenueData?.forEach(payment => {
      const date = new Date(payment.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount_sgd;
    });

    // Subscription metrics
    const { data: subscriptionMetrics } = await supabase
      .from('user_subscriptions')
      .select('tier, status, created_at, canceled_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const newSubscriptions = subscriptionMetrics?.filter(sub => sub.status === 'active').length || 0;
    const canceledSubscriptions = subscriptionMetrics?.filter(sub => sub.canceled_at).length || 0;
    const churnRate = newSubscriptions > 0 ? (canceledSubscriptions / newSubscriptions) * 100 : 0;

    // Tier distribution
    const { data: activeSubs } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('status', 'active');

    const tierDistribution: Record<string, number> = {};
    activeSubs?.forEach(sub => {
      tierDistribution[sub.tier] = (tierDistribution[sub.tier] || 0) + 1;
    });

    // Average Revenue Per User (ARPU)
    const totalActiveUsers = activeSubs?.length || 0;
    const arpu = totalActiveUsers > 0 ? totalMRR / totalActiveUsers : 0;

    // Customer Lifetime Value (CLV) estimation
    const averageChurnRate = churnRate > 0 ? churnRate / 100 : 0.05; // Default 5% if no data
    const averageLifetimeMonths = averageChurnRate > 0 ? 1 / averageChurnRate : 20;
    const clv = arpu * averageLifetimeMonths;

    // Growth metrics
    const previousPeriodStart = new Date(start.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);
    const { data: previousRevenue } = await supabase
      .from('payment_transactions')
      .select('amount_sgd')
      .eq('status', 'succeeded')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', start.toISOString());

    const previousPeriodRevenue = previousRevenue?.reduce((sum, payment) => sum + payment.amount_sgd, 0) || 0;
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: parseInt(period),
        },
        revenue: {
          total: totalRevenue,
          mrr: totalMRR,
          arpu,
          clv,
          growth_percentage: revenueGrowth,
          daily_breakdown: dailyRevenue,
          by_tier: tierMRR,
        },
        subscriptions: {
          total_active: totalActiveUsers,
          new_subscriptions: newSubscriptions,
          canceled_subscriptions: canceledSubscriptions,
          churn_rate: churnRate,
          tier_distribution: tierDistribution,
        },
        metrics: {
          conversion_rate: 0, // TODO: Calculate from user registrations
          customer_acquisition_cost: 0, // TODO: Calculate from marketing spend
          lifetime_value: clv,
          payback_period: 0, // TODO: Calculate CAC payback period
        },
      },
    });

  } catch (error: any) {
    console.error('Revenue analytics error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch revenue analytics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
