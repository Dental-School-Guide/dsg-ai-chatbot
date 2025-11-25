'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    
    // Check if we're in an iframe - only on client side
    const inIframe = window.self !== window.top

    // Only do client-side auth check in iframe context
    if (inIframe) {
      const supabase = createClient()
      
      // Do ONE auth check on mount
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('[AuthGuard] No session found, redirecting to login')
          window.location.href = '/login'
        } else {
          console.log('[AuthGuard] Session found:', session.user.email)
          setIsChecking(false)
        }
      }

      checkAuth()

      // ONLY listen for SIGNED_OUT events - ignore all others
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Only care about actual sign out
        if (event === 'SIGNED_OUT') {
          console.log('[AuthGuard] User signed out, redirecting to login')
          window.location.href = '/login'
        }
        // Ignore SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED, etc.
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Not in iframe, server-side auth is handling it
      setIsChecking(false)
    }
  }, []) // Empty dependency array - only run once on mount

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null
  }

  // Show loading state while checking auth in iframe
  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[--bg]">
        <div className="text-[--text]">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
