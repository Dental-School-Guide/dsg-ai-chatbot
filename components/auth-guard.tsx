'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isInIframe, setIsInIframe] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if we're in an iframe - only on client side
    const inIframe = window.self !== window.top
    setIsInIframe(inIframe)

    // Only do client-side auth check in iframe context
    if (inIframe) {
      const supabase = createClient()
      
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('[AuthGuard] No session found, redirecting to login')
          window.location.href = '/login'
        } else {
          console.log('[AuthGuard] Session found:', session.user.email)
          setIsAuthenticated(true)
        }
      }

      checkAuth()

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthGuard] Auth state changed:', event, session?.user?.email)
        
        // Only redirect on actual sign out, not on initial session events
        if (event === 'SIGNED_OUT' && !session) {
          console.log('[AuthGuard] User signed out, redirecting to login')
          window.location.href = '/login'
        } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          console.log('[AuthGuard] User authenticated, session valid')
          setIsAuthenticated(true)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Not in iframe, server-side auth is handling it
      setIsAuthenticated(true)
    }
  }, []) // Empty dependency array - only run once on mount

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null
  }

  // Show loading state while checking auth in iframe
  if (isInIframe && isAuthenticated === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[--bg]">
        <div className="text-[--text]">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
