'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, ArrowRight, Loader2, Mail, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'

export default function SignupPage() {
  const router = useRouter()
  const { sendSignupOtp, verifySignupOtp, resendSignupOtp } = useAuth()

  // Step state: 'DETAILS' (Step 1) -> 'OTP' (Step 2)
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const otpInputRef = useRef<HTMLInputElement>(null)

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Focus OTP input when transitioning to Step 2
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => otpInputRef.current?.focus(), 150)
    }
  }, [step])

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMsg(`Sending verification code to ${email}...`)
    setStep('OTP')
    setResendCooldown(30)
    setIsSubmitting(true)

    try {
      await sendSignupOtp(name, email, password)
      setInfoMsg(`Verification code sent to ${email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: Verify OTP & Create Account ────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await verifySignupOtp(email, otp)
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return
    setError(null)
    setInfoMsg(null)
    setIsSubmitting(true)

    try {
      await resendSignupOtp(email)
      setResendCooldown(30)
      setInfoMsg(`New code sent to ${email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="flex items-center gap-2 font-semibold text-sm mb-8">
        <Brain className="w-5 h-5 text-primary" />
        EconoMind
      </Link>

      <Card className="w-full max-w-sm border-border/60 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {step === 'DETAILS' ? 'Create an account' : 'Verify your email'}
            </CardTitle>
            {step === 'OTP' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Step 2 of 2
              </span>
            )}
          </div>
          <CardDescription>
            {step === 'DETAILS'
              ? 'Enter your details to receive an email verification code'
              : `We sent a 6-digit code to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── STEP 1: Details Form ──────────────────────────────────────── */}
          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={64}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6–64 characters"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* ── STEP 2: OTP Verification Form ────────────────────────────── */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-muted/40 border border-border/80 rounded-lg p-3 flex items-center gap-2 text-xs">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate font-mono">{email}</span>
              </div>

              {infoMsg && (
                <p className="text-xs text-green-500 font-medium bg-green-500/10 border border-green-500/20 rounded-md p-2">
                  {infoMsg}
                </p>
              )}

              <div>
                <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  6-Digit Verification Code
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                    if (error) setError(null)
                  }}
                  placeholder="123456"
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSubmitting || otp.length !== 6}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify & Create Account
                  </>
                )}
              </Button>

              <div className="flex items-center justify-end text-xs text-muted-foreground pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className={`flex items-center gap-1 font-medium ${
                    resendCooldown > 0
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'text-primary hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
