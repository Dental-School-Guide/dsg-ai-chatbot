'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[--text]">Check Your Email</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              We've sent a password reset link to <span className="font-medium text-[--text]">{email}</span>
            </p>
            <p className="mt-4 text-sm text-[--text-secondary]">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                className="block text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                ← Back to login
              </Link>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="text-sm text-[--text-secondary] hover:text-[--text] transition-colors"
              >
                Didn't receive the email? Try again
              </button>
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
          <h1 className="text-3xl font-bold text-[--text]">Forgot Password?</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleResetRequest} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[--text]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[--edge] bg-[--bg] px-3 py-2 text-[--text] placeholder-[--text-secondary] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#f6d43f] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f6d43f]/90 focus:outline-none focus:ring-2 focus:ring-[#f6d43f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending reset link...' : 'Send reset link'}
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
