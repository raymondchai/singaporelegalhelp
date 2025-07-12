// src/app/api/admin/analytics/revenue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admin_roles')
      .select('role, permissions, is_active')
      .eq('user_id', (
        await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
      ).data?.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck || !['super_admin', 'admin'].includes(adminCheck.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Calculate current month metrics
    const currentDate = new Date();
    const firstDayThisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Get subscription counts by tier
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier, final_amount_sgd, status, created_at')
      .eq('status', 'active');

    // Calculate tier breakdown
    const tierBreakdown = {
      free: 0,
      basic_individual: 0,
      premium_individual: 0,
      professional: 0,
      enterprise: 0
    };

    let totalMRR = 0;
    let totalCustomers = 0;

    subscriptions?.forEach(sub => {
      if (tierBreakdown.hasOwnProperty(sub.tier)) {
        (tierBreakdown as any)[sub.tier]++;
        totalCustomers++;
        
        // Calculate MRR based on subscription
        if (sub.final_amount_sgd && sub.tier !== 'free') {
          totalMRR += parseFloat(sub.final_amount_sgd.toString());
        }
      }
    });

    // Get new customers this month
    const { data: newCustomersData } = await supabase
      .from('user_subscriptions')
      .select('id')
      .gte('created_at', firstDayThisMonth.toISOString())
      .neq('tier', 'free');

    const newCustomers = newCustomersData?.length || 0;

    // Get last month's customer count for growth calculation
    const { data: lastMonthCustomers } = await supabase
      .from('user_subscriptions')
      .select('id')
      .lt('created_at', firstDayThisMonth.toISOString())
      .eq('status', 'active')
      .neq('tier', 'free');

    const lastMonthCount = lastMonthCustomers?.length || 0;
    const customerGrowthRate = lastMonthCount > 0 ? 
      ((totalCustomers - lastMonthCount) / lastMonthCount) * 100 : 0;

    // Calculate other metrics
    const avgRevenuePerUser = totalCustomers > 0 ? totalMRR / totalCustomers : 0;
    const customerLifetimeValue = avgRevenuePerUser * 24; // 24 months average
    const churnRate = 4.0; // Placeholder - would need churn tracking

    const metrics = {
      mrr_sgd: totalMRR,
      arr_sgd: totalMRR * 12,
      total_revenue_sgd: totalMRR * 2, // Simplified calculation
      total_customers: totalCustomers,
      new_customers: newCustomers,
      churned_customers: 1, // Placeholder
      customer_growth_rate: customerGrowthRate,
      avg_revenue_per_user: avgRevenuePerUser,
      customer_lifetime_value: customerLifetimeValue,
      churn_rate: churnRate,
      tier_breakdown: tierBreakdown
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}