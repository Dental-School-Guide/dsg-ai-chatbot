import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton instances to prevent multiple clients
let browserClient: SupabaseClient | null = null
let iframeClient: SupabaseClient | null = null
let authListenerSetup = false

export function createClient() {
  // Check if we're in an iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  if (isInIframe) {
    // Return existing iframe client if already created
    if (iframeClient) {
      return iframeClient
    }
    
    console.log('[Supabase] Running in iframe context - using localStorage')
    
    iframeClient = createSupabaseClient(
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
    
    // Set up auth state listener only once
    if (!authListenerSetup) {
      iframeClient.auth.onAuthStateChange((event, session) => {
        console.log('[Supabase] Auth state changed:', event, session?.user?.email)
      })
      authListenerSetup = true
    }
    
    return iframeClient
  }
  
  // Return existing browser client if already created
  if (browserClient) {
    return browserClient
  }
  
  // Default SSR client with cookies for normal context
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return browserClient
}
