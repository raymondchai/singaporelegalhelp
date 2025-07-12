import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, ApiContext, validateSubscriptionTier } from '@/lib/api-middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import crypto from 'crypto'

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  url: z.string().url('Invalid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret_key: z.string().optional(),
  max_retries: z.number().min(0).max(10).default(3),
  retry_delay_seconds: z.number().min(1).max(3600).default(60),
  timeout_seconds: z.number().min(1).max(300).default(30),
})

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  is_active: z.boolean().optional(),
  max_retries: z.number().min(0).max(10).optional(),
  retry_delay_seconds: z.number().min(1).max(3600).optional(),
  timeout_seconds: z.number().min(1).max(300).optional(),
})

// GET /api/v1/webhooks - List user's webhooks
async function getWebhooks(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  // Validate subscription tier for webhook access
  validateSubscriptionTier(context, ['premium', 'enterprise'])

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const isActive = searchParams.get('active')

  try {
    let query = supabase
      .from('webhook_configurations')
      .select(`
        id,
        name,
        url,
        events,
        is_active,
        max_retries,
        retry_delay_seconds,
        timeout_seconds,
        last_triggered_at,
        success_count,
        failure_count,
        created_at,
        updated_at
      `)
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: webhooks, error } = await query

    if (error) {
      console.error('Webhooks fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch webhooks' },
        { status: 500 }
      )
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('webhook_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', context.user.id)

    return NextResponse.json({
      success: true,
      data: {
        webhooks: webhooks || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: (count || 0) > page * limit,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Webhooks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/webhooks - Create a new webhook
async function createWebhook(
  request: NextRequest,
  context: ApiContext
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'User context required' }, { status: 401 })
  }

  validateSubscriptionTier(context, ['premium', 'enterprise'])

  try {
    const body = await request.json()
    const validatedData = createWebhookSchema.parse(body)

    // Check webhook limits based on subscription
    const { count } = await supabase
      .from('webhook_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', context.user.id)

    const maxWebhooks = context.user.subscription_tier === 'enterprise' ? 50 : 10
    if ((count || 0) >= maxWebhooks) {
      return NextResponse.json(
        { error: `Webhook limit reached. Maximum: ${maxWebhooks}` },
        { status: 402 }
      )
    }

    // Generate secret key if not provided
    const secretKey = validatedData.secret_key || crypto.randomBytes(32).toString('hex')

    // Validate webhook URL by sending a test request
    const isValidUrl = await validateWebhookUrl(validatedData.url, secretKey)
    if (!isValidUrl) {
      return NextResponse.json(
        { error: 'Webhook URL validation failed. Please ensure the endpoint is accessible and returns a 200 status.' },
        { status: 400 }
      )
    }

    // Create the webhook
    const { data: webhook, error } = await supabase
      .from('webhook_configurations')
      .insert({
        user_id: context.user.id,
        name: validatedData.name,
        url: validatedData.url,
        events: validatedData.events,
        secret_key: secretKey,
        max_retries: validatedData.max_retries,
        retry_delay_seconds: validatedData.retry_delay_seconds,
        timeout_seconds: validatedData.timeout_seconds,
        is_active: true
      })
      .select(`
        id,
        name,
        url,
        events,
        is_active,
        max_retries,
        retry_delay_seconds,
        timeout_seconds,
        created_at
      `)
      .single()

    if (error) {
      console.error('Webhook creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create webhook' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        webhook: {
          ...webhook,
          secret_key: secretKey // Only return secret key on creation
        },
        message: 'Webhook created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Webhook creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate webhook URL
async function validateWebhookUrl(url: string, secretKey: string): Promise<boolean> {
  try {
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook' }
    }

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(testPayload))
      .digest('hex')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'User-Agent': 'Singapore-Legal-Help-Webhook/1.0'
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    return response.ok
  } catch (error) {
    console.error('Webhook validation error:', error)
    return false
  }
}

// Export the handlers with middleware
export const GET = withApiMiddleware(getWebhooks, {
  requiredPermissions: ['read'],
  rateLimit: 100
})

export const POST = withApiMiddleware(createWebhook, {
  requiredPermissions: ['write'],
  rateLimit: 10
})
