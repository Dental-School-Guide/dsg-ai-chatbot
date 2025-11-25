import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  // Check if we're in an iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  if (isInIframe) {
    console.log('[Supabase] Running in iframe context - using localStorage')
    // Use regular Supabase client with localStorage for iframe context
    // This bypasses the SSR cookie handling which doesn't work in iframes
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'supabase.auth.token',
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )
  }
  
  // Default SSR client with cookies for normal context
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
