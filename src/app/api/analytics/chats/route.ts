// =====================================================
// Analytics Chats API - Replace Direct Database Queries
// Singapore Legal Help Platform
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch chat sessions
    const { data: chats, error: chatsError } = await supabase
      .from('user_chat_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (chatsError) {
      console.error('Chats fetch error:', chatsError);
      return NextResponse.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chats: chats ?? [],
    });

  } catch (error: any) {
    console.error('Analytics chats error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics chats',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
