// =====================================================
// Phase 6A: Usage Tracking API
// Singapore Legal Help Platform - Monetization System
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { usageTracker, UsageResourceType } from '@/lib/usage-tracking';

export async function POST(request: NextRequest) {
  try {
    const { userId, resourceType, quantity = 1, metadata } = await request.json();

    // Validate required fields
    if (!userId || !resourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, resourceType' },
        { status: 400 }
      );
    }

    // Validate resource type
    const validResourceTypes: UsageResourceType[] = [
      'document_generation',
      'ai_query',
      'storage_gb',
      'team_member',
      'api_call',
      'template_access'
    ];

    if (!validResourceTypes.includes(resourceType)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    // Check usage limit before tracking
    const usageCheck = await usageTracker.checkUsageLimit(userId, resourceType, quantity);
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Usage limit exceeded',
          usageCheck,
          message: `You have reached your ${resourceType.replace('_', ' ')} limit for this billing period`
        },
        { status: 429 }
      );
    }

    // Track the usage
    await usageTracker.trackUsage(userId, resourceType, quantity, metadata);

    // Get updated usage check after tracking
    const updatedUsageCheck = await usageTracker.checkUsageLimit(userId, resourceType, 0);

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully',
      resourceType,
      quantity,
      usageStatus: updatedUsageCheck,
    });

  } catch (error: any) {
    console.error('Usage tracking error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to track usage',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check usage limits
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resourceType = searchParams.get('resourceType') as UsageResourceType;
    const quantity = parseInt(searchParams.get('quantity') || '1');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // If specific resource type is requested, check that limit
    if (resourceType) {
      const usageCheck = await usageTracker.checkUsageLimit(userId, resourceType, quantity);
      
      return NextResponse.json({
        success: true,
        resourceType,
        usageCheck,
      });
    }

    // Otherwise, get comprehensive usage summary
    const usageSummary = await usageTracker.getUserUsageSummary(userId);

    return NextResponse.json({
      success: true,
      usageSummary,
    });

  } catch (error: any) {
    console.error('Failed to check usage:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check usage',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
