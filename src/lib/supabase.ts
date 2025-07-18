import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClientComponentClient<Database>()

// Export typed client for components
export type SupabaseClient = typeof supabase

// Server-side client with service role key (server-only) - for backward compatibility
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey)
}

// Lazy-loaded admin client - only create when needed and on server-side
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseAdmin = () => {
  // Only create admin client on server-side
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin client should not be used on client-side')
  }

  if (!_supabaseAdmin) {
    _supabaseAdmin = createSupabaseAdmin()
  }

  return _supabaseAdmin
}
