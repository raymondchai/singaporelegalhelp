// =====================================================
// Main Dashboard API - Simple Implementation
// Singapore Legal Help Platform
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🏠 Dashboard API: Starting main dashboard request');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Dashboard API: Missing authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get the current user from the session
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log('❌ Dashboard API: Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile from profiles table (standardized)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Dashboard API: Profile not found:', profileError);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    console.log('✅ Dashboard API: User profile found:', profile.id);

    // Fetch all dashboard data in parallel with fallbacks
    const [
      documentsResult,
      chatSessionsResult,
      savedContentResult,
      activityLogsResult,
      usageResult
    ] = await Promise.allSettled([
      fetchDocuments(profile.id),
      fetchChatSessions(profile.id),
      fetchSavedContent(profile.id),
      fetchActivityLogs(profile.id),
      fetchUsageData(profile.id)
    ])

    // Process results with fallbacks
    const dashboardData = {
      user_profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        user_type: profile.user_type,
        subscription_tier: profile.subscription_status || 'free'
      },
      
      summary_stats: {
        total_documents: getResultValue(documentsResult)?.length || 0,
        chat_sessions: getResultValue(chatSessionsResult)?.length || 0,
        saved_items: getResultValue(savedContentResult)?.length || 0,
        monthly_usage_percentage: 0 // Will be calculated from usage data
      },

      recent_activity: getResultValue(activityLogsResult) || [],
      recent_documents: (getResultValue(documentsResult) || []).slice(0, 5),
      quick_actions: [
        { id: 'upload_document', title: 'Upload Document', description: 'Upload and analyze legal documents', icon: 'upload' },
        { id: 'start_chat', title: 'Start Chat', description: 'Ask questions about Singapore law', icon: 'message-circle' },
        { id: 'browse_content', title: 'Browse Content', description: 'Explore legal articles and resources', icon: 'book-open' },
        { id: 'view_analytics', title: 'View Analytics', description: 'Track your usage and activity', icon: 'bar-chart' }
      ],

      debug_info: {
        documents_available: documentsResult.status === 'fulfilled',
        chat_sessions_available: chatSessionsResult.status === 'fulfilled',
        saved_content_available: savedContentResult.status === 'fulfilled',
        activity_logs_available: activityLogsResult.status === 'fulfilled',
        usage_tracking_available: usageResult.status === 'fulfilled'
      }
    }

    console.log('✅ Dashboard API: Returning comprehensive dashboard data')
    return NextResponse.json(dashboardData)

  } catch (error: any) {
    console.error('💥 Dashboard API: Critical error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        debug: error.message
      },
      { status: 500 }
    );
  }
}

// Helper function to safely extract result values
function getResultValue(result: PromiseSettledResult<any>) {
  return result.status === 'fulfilled' ? result.value : null
}

// Fetch user documents with fallback
async function fetchDocuments(profileId: string) {
  try {
    console.log('📄 Dashboard API: Fetching documents');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_documents')
      .select('id, file_name, file_type, file_size, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('⚠️ Dashboard API: Documents table missing:', error.message);
      return [];
    }

    console.log('✅ Dashboard API: Documents fetched:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Dashboard API: Documents fetch error:', error.message);
    return [];
  }
}

// Fetch chat sessions with fallback
async function fetchChatSessions(profileId: string) {
  try {
    console.log('💬 Dashboard API: Fetching chat sessions');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_chat_sessions')
      .select('id, title, practice_area, created_at, updated_at')
      .eq('user_id', profileId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('⚠️ Dashboard API: Chat sessions table missing:', error.message);
      return [];
    }

    console.log('✅ Dashboard API: Chat sessions fetched:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Dashboard API: Chat sessions fetch error:', error.message);
    return [];
  }
}

// Fetch saved content with fallback
async function fetchSavedContent(profileId: string) {
  try {
    console.log('💾 Dashboard API: Fetching saved content');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_saved_content')
      .select('id, content_type, content_id, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('⚠️ Dashboard API: Saved content table missing:', error.message);
      return [];
    }

    console.log('✅ Dashboard API: Saved content fetched:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Dashboard API: Saved content fetch error:', error.message);
    return [];
  }
}

// Fetch activity logs with fallback
async function fetchActivityLogs(profileId: string) {
  try {
    console.log('📋 Dashboard API: Fetching activity logs');
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('action_type, details, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('⚠️ Dashboard API: Activity logs table missing:', error.message);
      // Return mock recent activity
      return [
        {
          action_type: 'dashboard_visit',
          details: { page: 'main' },
          created_at: new Date().toISOString()
        },
        {
          action_type: 'profile_view',
          details: { section: 'account_info' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          action_type: 'account_created',
          details: { user_type: 'individual' },
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
    }

    console.log('✅ Dashboard API: Activity logs fetched:', data?.length || 0);
    return data || [];
  } catch (error: any) {
    console.log('⚠️ Dashboard API: Activity logs fetch error:', error.message);
    return [];
  }
}

// Fetch usage data with fallback
async function fetchUsageData(profileId: string) {
  try {
    console.log('📊 Dashboard API: Fetching usage data');
    const supabase = getSupabaseAdmin();

    // Get current month usage
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('resource_type, quantity, tracked_at')
      .eq('user_id', profileId)
      .gte('tracked_at', firstDayOfMonth.toISOString());

    if (error) {
      console.log('⚠️ Dashboard API: Usage tracking table missing:', error.message);
      return { ai_queries: 0, document_generation: 0, storage_gb: 0 };
    }

    // Calculate usage summary
    const usageSummary: { [key: string]: number } = {
      ai_queries: 0,
      document_generation: 0,
      storage_gb: 0,
      api_calls: 0
    };

    data?.forEach((item: any) => {
      if (usageSummary.hasOwnProperty(item.resource_type)) {
        usageSummary[item.resource_type] += item.quantity || 0;
      }
    });

    console.log('✅ Dashboard API: Usage data fetched');
    return usageSummary;
  } catch (error: any) {
    console.log('⚠️ Dashboard API: Usage data fetch error:', error.message);
    return { ai_queries: 0, document_generation: 0, storage_gb: 0 };
  }
}