// =====================================================
// Phase 6A: Enterprise API Keys Management
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, permissions = [], expiresAt } = await request.json();

    // Validate required fields
    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, name' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user has enterprise subscription with API access
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        status,
        subscription_tier_features!inner(api_access)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || !(subscription as any).subscription_tier_features?.api_access) {
      return NextResponse.json(
        { error: 'Enterprise subscription with API access required' },
        { status: 403 }
      );
    }

    // Generate API key
    const apiKey = `slh_${randomBytes(32).toString('hex')}`;
    const keyHash = randomBytes(16).toString('hex'); // For display purposes

    // Create API key record
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('enterprise_api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        api_key: apiKey, // In production, store hashed version
        permissions,
        expires_at: expiresAt,
        is_active: true,
        last_used_at: null,
        usage_count: 0,
      })
      .select()
      .single();

    if (keyError) {
      throw keyError;
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        key: apiKey, // Only returned once during creation
        keyHash,
        permissions: apiKeyRecord.permissions,
        expiresAt: apiKeyRecord.expires_at,
        createdAt: apiKeyRecord.created_at,
      },
      message: 'API key created successfully. Please save it securely as it will not be shown again.',
    });

  } catch (error: any) {
    console.error('API key creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create API key',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list API keys
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

    // Verify user has enterprise subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        tier,
        status,
        subscription_tier_features!inner(api_access)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || !(subscription as any).subscription_tier_features?.api_access) {
      return NextResponse.json(
        { error: 'Enterprise subscription with API access required' },
        { status: 403 }
      );
    }

    const { data: apiKeys, error } = await supabase
      .from('enterprise_api_keys')
      .select('id, name, key_hash, permissions, expires_at, is_active, last_used_at, usage_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys || [],
    });

  } catch (error: any) {
    console.error('Failed to fetch API keys:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch API keys',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const keyId = searchParams.get('keyId');

    if (!userId || !keyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, keyId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify ownership and deactivate key
    const { data: updatedKey, error } = await supabase
      .from('enterprise_api_keys')
      .update({ 
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', keyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });

  } catch (error: any) {
    console.error('API key revocation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to revoke API key',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
