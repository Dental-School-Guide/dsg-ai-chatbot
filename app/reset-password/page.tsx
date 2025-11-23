'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if user has a valid recovery session or verify the code
    const checkSession = async () => {
      const code = searchParams.get('code')
      
      // If there's a code in the URL, verify it
      if (code) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'recovery'
          })
          
          if (verifyError) {
            setError('Invalid or expired reset link. Please request a new one.')
            setVerifying(false)
            return
          }
          
          setValidSession(true)
          setVerifying(false)
        } catch (err) {
          setError('Failed to verify reset link. Please request a new one.')
          setVerifying(false)
        }
      } else {
        // No code, check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setValidSession(true)
        } else {
          setError('Invalid or expired reset link. Please request a new one.')
        }
        setVerifying(false)
      }
    }
    checkSession()
  }, [supabase.auth, searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[--dsg-edge] border-t-[--dsg-gold]"></div>
            </div>
            <h1 className="text-2xl font-bold text-[--text]">Verifying...</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              Please wait while we verify your reset link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[--text]">Password Reset!</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              Your password has been successfully reset. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!validSession && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[--text]">Invalid Link</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              {error}
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/forgot-password"
                className="block w-full rounded-lg bg-[#f6d43f] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f6d43f]/90 transition-colors"
              >
                Request new reset link
              </Link>
              <Link
                href="/login"
                className="block text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[--text]">Reset Password</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          {error && !success && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[--text]">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[--edge] bg-[--bg] px-3 py-2 pr-10 text-[--text] placeholder-[--text-secondary] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-[--text-secondary]">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[--text]">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[--edge] bg-[--bg] px-3 py-2 pr-10 text-[--text] placeholder-[--text-secondary] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !validSession}
            className="w-full rounded-lg bg-[#f6d43f] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f6d43f]/90 focus:outline-none focus:ring-2 focus:ring-[#f6d43f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Resetting password...' : 'Reset password'}
          </button>

          <div className="text-center text-sm">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
