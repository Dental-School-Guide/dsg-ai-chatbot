'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isInIframe, setIsInIframe] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if we're in an iframe - only on client side
    const inIframe = window.self !== window.top
    setIsInIframe(inIframe)

    // Only do client-side auth check in iframe context
    if (inIframe) {
      const supabase = createClient()
      
      const checkAuth = async () => {
        // Check if we recently verified auth (within last 5 seconds)
        const lastAuthCheck = localStorage.getItem('auth-guard-last-check')
        const now = Date.now()
        
        if (lastAuthCheck && (now - parseInt(lastAuthCheck)) < 5000) {
          console.log('[AuthGuard] Recently checked auth, assuming still valid')
          setIsAuthenticated(true)
          setHasCheckedAuth(true)
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('[AuthGuard] No session found, redirecting to login')
          localStorage.removeItem('auth-guard-last-check')
          window.location.href = '/login'
        } else {
          console.log('[AuthGuard] Session found:', session.user.email)
          localStorage.setItem('auth-guard-last-check', now.toString())
          setIsAuthenticated(true)
          setHasCheckedAuth(true)
        }
      }

      checkAuth()

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthGuard] Auth state changed:', event, session?.user?.email)
        
        // Only redirect on actual sign out, not on initial session events
        if (event === 'SIGNED_OUT' && !session) {
          console.log('[AuthGuard] User signed out, redirecting to login')
          localStorage.removeItem('auth-guard-last-check')
          setHasCheckedAuth(false)
          window.location.href = '/login'
        } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          console.log('[AuthGuard] User authenticated, session valid')
          localStorage.setItem('auth-guard-last-check', Date.now().toString())
          setIsAuthenticated(true)
          setHasCheckedAuth(true)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      // Not in iframe, server-side auth is handling it
      setIsAuthenticated(true)
      setHasCheckedAuth(true)
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
