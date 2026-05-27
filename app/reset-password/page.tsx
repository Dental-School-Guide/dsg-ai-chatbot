'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  // Step 1 inputs
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [otp, setOtp] = useState('')

  // Step 2 inputs
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  // After verifying OTP we get a recovery session and can update the password
  const [otpVerified, setOtpVerified] = useState(false)

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Please enter your email')
      return
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the 6-digit code from your email')
      return
    }

    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'recovery',
      })

      if (verifyError) {
        console.error('[ResetPassword] verifyOtp failed:', verifyError)
        setError(verifyError.message || 'Invalid or expired code. Please try again.')
        setLoading(false)
        return
      }

      setOtpVerified(true)
      setLoading(false)
    } catch (err) {
      console.error('[ResetPassword] verifyOtp threw:', err)
      setError('Failed to verify code. Please try again.')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Sign out the recovery session so the user must log in with the new password
      await supabase.auth.signOut()

      setSuccess(true)
      setLoading(false)

      setTimeout(() => {
        router.push('/login')
      }, 2000)
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

  // Step 1: enter email + OTP
  if (!otpVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[--text]">Enter Reset Code</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              We sent a 6-digit code to your email. Enter it below to continue.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
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

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-[--text]">
                6-digit code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-1 block w-full rounded-lg border border-[--edge] bg-[--bg] px-3 py-2 text-center text-2xl tracking-[0.5em] text-[--text] placeholder-[--text-secondary] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#f6d43f] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f6d43f]/90 focus:outline-none focus:ring-2 focus:ring-[#f6d43f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Resend code
              </Link>
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

  // Step 2: enter new password
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
            disabled={loading}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[--bg] p-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-[--edge] bg-[--panel] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.6)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[--dsg-edge] border-t-[--dsg-gold]"></div>
            </div>
            <h1 className="text-2xl font-bold text-[--text]">Loading...</h1>
            <p className="mt-2 text-sm text-[--text-secondary]">
              Please wait while we load the page.
            </p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
