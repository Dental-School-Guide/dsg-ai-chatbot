import { createClient } from '@/lib/supabase/client'

/**
 * Fetch wrapper that automatically adds Authorization header in iframe context
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  if (isInIframe) {
    // Get access token from Supabase session
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.access_token) {
      // Add Authorization header
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`,
      }
      console.log('[API Client] Adding auth token to request:', url)
    }
  }
  
  return fetch(url, options)
}
