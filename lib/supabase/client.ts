import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  // Check if we're in an iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  if (isInIframe) {
    console.log('[Supabase] Running in iframe context - using localStorage')
    
    const client = createSupabaseClient(
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
    
    // Log auth state changes for debugging
    client.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase] Auth state changed:', event, session?.user?.email)
    })
    
    return client
  }
  
  // Default SSR client with cookies for normal context
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
