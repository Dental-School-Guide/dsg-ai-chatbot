'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we're in an iframe
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top

    // Only do client-side auth check in iframe context
    if (isInIframe) {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log('[AuthGuard] No session found, redirecting to login')
          router.push('/login')
        } else {
          console.log('[AuthGuard] Session found:', session.user.email)
          setIsAuthenticated(true)
        }
      }

      checkAuth()

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AuthGuard] Auth state changed:', event)
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (event === 'SIGNED_IN') {
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
  }, [router, supabase])

  // Show loading state while checking auth in iframe
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  if (isInIframe && isAuthenticated === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[--bg]">
        <div className="text-[--text]">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
