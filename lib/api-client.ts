import { createClient } from '@/lib/supabase/client'

/**
 * Fetch wrapper that automatically adds Authorization header in iframe context
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  if (isInIframe) {
    // Get access token from Supabase session
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[API Client] Error getting session:', error)
    }
    
    if (session?.access_token) {
      // Add Authorization header
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`,
      }
      console.log('[API Client] Adding auth token to request:', url)
    } else {
      console.warn('[API Client] No session found for iframe request:', url)
    }
  }
  
  const response = await fetch(url, options)
  
  // Log errors for debugging
  if (!response.ok) {
    console.error('[API Client] Request failed:', {
      url,
      status: response.status,
      statusText: response.statusText
    })
  }
  
  return response
}
