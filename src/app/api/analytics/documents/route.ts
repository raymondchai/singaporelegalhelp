// =====================================================
// Analytics Documents API - Replace Direct Database Queries
// Singapore Legal Help Platform
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { retryOperation } from '@/lib/error-handling';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)

  try {
    console.log(`📊 Analytics Documents API [${requestId}]: Starting request`)

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log(`❌ Analytics Documents API [${requestId}]: Missing authorization header`)
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Get the current user from the session with retry logic
    console.log(`🔑 Analytics Documents API [${requestId}]: Authenticating user`)
    const token = authHeader.replace('Bearer ', '')

    const { user } = await retryOperation(async () => {
      const supabase = getSupabaseAdmin();
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`)
      }

      if (!user) {
        throw new Error('No user returned from auth')
      }

      return { user }
    }, 3, 1000)

    console.log(`✅ Analytics Documents API [${requestId}]: User authenticated:`, user.id)

    // Get user profile ID from profiles table with retry
    console.log(`📋 Analytics Documents API [${requestId}]: Fetching profile`)
    const profile = await retryOperation(async () => {
      const supabase = getSupabaseAdmin();
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Profile fetch error: ${profileError.message}`)
      }

      if (!profile) {
        throw new Error('Profile not found')
      }

      return profile
    }, 3, 1000)

    console.log(`✅ Analytics Documents API [${requestId}]: Profile found:`, profile.id)

    // Fetch documents with retry logic
    console.log(`📄 Analytics Documents API [${requestId}]: Fetching documents`)
    const documents = await retryOperation(async () => {
      const supabase = getSupabaseAdmin();
      const { data: documents, error: documentsError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', profile.id)
        .order('upload_date', { ascending: false });

      if (documentsError) {
        throw new Error(`Documents fetch error: ${documentsError.message}`)
      }

      return documents || []
    }, 3, 1000)

    console.log(`✅ Analytics Documents API [${requestId}]: Found ${documents.length} documents`)

    return NextResponse.json({
      success: true,
      documents: documents,
      debug_info: {
        request_id: requestId,
        user_id: user.id,
        profile_id: profile.id,
        document_count: documents.length
      }
    });

  } catch (error: any) {
    console.error(`❌ Analytics Documents API [${requestId}]: Error:`, error);

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics documents',
        details: error.message,
        request_id: requestId
      },
      { status: 500 }
    );
  }
}
