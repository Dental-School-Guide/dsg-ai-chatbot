'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Triggers Supabase recovery email. With the email template set to
      // include {{ .Token }}, the user receives a 6-digit OTP they enter on
      // the next screen.
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Carry the email to the reset page so the user only has to type the OTP.
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[--text]">Forgot Password?</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            No worries! Enter your email and we'll send you a 6-digit code to reset your password.
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
            {loading ? 'Sending code...' : 'Send reset code'}
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
