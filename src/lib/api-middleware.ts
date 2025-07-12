import { NextRequest, NextResponse } from 'next/server'
import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client for API key validation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface ApiKeyInfo {
  id: string
  user_id: string
  name: string
  permissions: string[]
  rate_limit_per_hour: number
  is_active: boolean
  expires_at?: string
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitInfo>()

export class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiContext {
  user?: {
    id: string
    email: string
    subscription_tier: string
  }
  apiKey?: ApiKeyInfo
  isApiKeyAuth: boolean
  permissions: string[]
}

/**
 * Authenticate API request using Bearer token or API key
 */
export async function authenticateApiRequest(request: NextRequest): Promise<ApiContext> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    throw new ApiError('Missing authorization header', 401)
  }

  if (authHeader.startsWith('Bearer ')) {
    // JWT token authentication
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new ApiError('Invalid or expired token', 401)
    }

    // Get user profile and subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    return {
      user: {
        id: user.id,
        email: user.email!,
        subscription_tier: profile?.subscription_status || 'free'
      },
      isApiKeyAuth: false,
      permissions: ['read', 'write'] // Default permissions for authenticated users
    }
  } else if (authHeader.startsWith('slh_')) {
    // API key authentication
    const apiKey = authHeader
    
    const { data: keyInfo, error } = await supabaseAdmin
      .from('enterprise_api_keys')
      .select(`
        id,
        user_id,
        name,
        permissions,
        rate_limit_per_hour,
        is_active,
        expires_at,
        last_used_at,
        usage_count
      `)
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (error || !keyInfo) {
      throw new ApiError('Invalid API key', 401)
    }

    // Check if API key is expired
    if (keyInfo.expires_at && new Date(keyInfo.expires_at) < new Date()) {
      throw new ApiError('API key has expired', 401)
    }

    // Update last used timestamp and usage count
    await supabaseAdmin
      .from('enterprise_api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: (keyInfo.usage_count || 0) + 1
      })
      .eq('id', keyInfo.id)

    // Get user info
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('id, email, subscription_status')
      .eq('id', keyInfo.user_id)
      .single()

    return {
      user: user ? {
        id: user.id,
        email: user.email,
        subscription_tier: user.subscription_status || 'free'
      } : undefined,
      apiKey: keyInfo as ApiKeyInfo,
      isApiKeyAuth: true,
      permissions: keyInfo.permissions || []
    }
  } else {
    throw new ApiError('Invalid authorization format', 401)
  }
}

/**
 * Check rate limiting for API requests
 */
export async function checkRateLimit(
  identifier: string, 
  limit: number = 1000, 
  windowMs: number = 3600000 // 1 hour
): Promise<void> {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const current = rateLimitStore.get(identifier)
  
  if (!current || current.resetTime <= now) {
    // Reset or initialize rate limit
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return
  }
  
  if (current.count >= limit) {
    throw new ApiError(`Rate limit exceeded. Limit: ${limit} requests per hour`, 429)
  }
  
  // Increment count
  rateLimitStore.set(identifier, {
    ...current,
    count: current.count + 1
  })
}

/**
 * Check if user has required permissions
 */
export function checkPermissions(context: ApiContext, requiredPermissions: string[]): void {
  const hasPermission = requiredPermissions.some(permission => 
    context.permissions.includes(permission) || context.permissions.includes('admin')
  )
  
  if (!hasPermission) {
    throw new ApiError(`Insufficient permissions. Required: ${requiredPermissions.join(' or ')}`, 403)
  }
}

/**
 * Log API usage for analytics
 */
export async function logApiUsage(
  context: ApiContext,
  request: NextRequest,
  response: NextResponse,
  endpoint: string,
  method: string,
  responseTime: number
): Promise<void> {
  try {
    const usage = {
      user_id: context.user?.id,
      api_key_id: context.apiKey?.id,
      endpoint,
      method,
      status_code: response.status,
      response_time_ms: responseTime,
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    }

    await supabaseAdmin
      .from('api_usage_logs')
      .insert(usage)
  } catch (error) {
    console.error('Failed to log API usage:', error)
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withApiMiddleware(
  handler: (request: NextRequest, context: ApiContext, params?: any) => Promise<NextResponse>,
  options: {
    requiredPermissions?: string[]
    rateLimit?: number
    requireApiKey?: boolean
  } = {}
) {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      // Authenticate request
      const context = await authenticateApiRequest(request)
      
      // Check if API key is required
      if (options.requireApiKey && !context.isApiKeyAuth) {
        throw new ApiError('API key required for this endpoint', 401)
      }
      
      // Check permissions
      if (options.requiredPermissions) {
        checkPermissions(context, options.requiredPermissions)
      }
      
      // Check rate limiting
      const rateLimitId = context.apiKey?.id || context.user?.id || 'anonymous'
      const rateLimit = options.rateLimit || context.apiKey?.rate_limit_per_hour || 1000
      
      await checkRateLimit(rateLimitId, rateLimit)
      
      // Call the actual handler
      const response = await handler(request, context, params)
      
      // Log API usage
      const responseTime = Date.now() - startTime
      const endpoint = new URL(request.url).pathname
      
      await logApiUsage(context, request, response, endpoint, request.method, responseTime)
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', rateLimit.toString())
      response.headers.set('X-RateLimit-Remaining', '99') // Simplified
      response.headers.set('X-RateLimit-Reset', (Date.now() + 3600000).toString())
      
      return response
      
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        )
      }
      
      console.error('API middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Validate subscription tier for API access
 */
export function validateSubscriptionTier(
  context: ApiContext, 
  requiredTier: string[]
): void {
  if (!context.user) {
    throw new ApiError('User context required', 401)
  }
  
  if (!requiredTier.includes(context.user.subscription_tier)) {
    throw new ApiError(
      `Subscription upgrade required. Current: ${context.user.subscription_tier}, Required: ${requiredTier.join(' or ')}`,
      402
    )
  }
}
