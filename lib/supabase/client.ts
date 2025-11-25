import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Check if we're in an iframe (widget context)
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Use localStorage instead of cookies when in iframe to avoid third-party cookie issues
      cookieOptions: {
        name: isInIframe ? undefined : 'sb-auth-token',
      },
      auth: {
        // Force localStorage when in iframe
        storage: isInIframe ? (typeof window !== 'undefined' ? window.localStorage : undefined) : undefined,
        storageKey: isInIframe ? 'sb-auth-token' : undefined,
        flowType: 'pkce',
      },
    }
  )
}
