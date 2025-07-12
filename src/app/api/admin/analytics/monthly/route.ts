// src/app/api/admin/analytics/monthly/route.ts
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

    // Generate last 6 months of data
    const monthlyData = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Get subscriptions for this month
      const { data: monthSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('tier, final_amount_sgd, created_at')
        .gte('created_at', targetDate.toISOString())
        .lt('created_at', nextMonth.toISOString())
        .eq('status', 'active');

      // Calculate metrics for this month
      let monthlyRevenue = 0;
      let customerCount = 0;

      monthSubscriptions?.forEach(sub => {
        if (sub.tier !== 'free') {
          customerCount++;
          if (sub.final_amount_sgd) {
            monthlyRevenue += parseFloat(sub.final_amount_sgd.toString());
          }
        }
      });

      // Get total active customers by end of month
      const { data: totalCustomers } = await supabase
        .from('user_subscriptions')
        .select('id')
        .lt('created_at', nextMonth.toISOString())
        .eq('status', 'active')
        .neq('tier', 'free');

      monthlyData.push({
        month: monthName,
        revenue: monthlyRevenue,
        customers: totalCustomers?.length || 0,
        mrr: monthlyRevenue
      });
    }

    return NextResponse.json(monthlyData);

  } catch (error) {
    console.error('Monthly analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}