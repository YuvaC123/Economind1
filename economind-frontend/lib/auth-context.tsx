'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface SendOtpResponse {
  msg: string
  email: string
  expiresInSeconds?: number
  devOtp?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  sendSignupOtp: (name: string, email: string, password: string) => Promise<SendOtpResponse>
  verifySignupOtp: (email: string, otp: string) => Promise<void>
  resendSignupOtp: (email: string) => Promise<SendOtpResponse>
  signout: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, rehydrate from localStorage so the session survives page refreshes up to 48 hours
  useEffect(() => {
    const storedToken = localStorage.getItem('em_token')
    const storedUser = localStorage.getItem('em_user')
    const loginAt = localStorage.getItem('em_login_at')

    const isExpired = loginAt ? Date.now() - Number(loginAt) > 48 * 60 * 60 * 1000 : false

    if (storedToken && storedUser && !isExpired) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    } else {
      clear()
    }

    setIsLoading(false)
  }, [])

  // Persist to localStorage (client reads) and a cookie (middleware reads) with 48h expiration
  const persist = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('em_token', newToken)
    localStorage.setItem('em_user', JSON.stringify(newUser))
    localStorage.setItem('em_login_at', String(Date.now()))
    document.cookie = `em_token=${newToken}; path=/; max-age=${60 * 60 * 48}; SameSite=Lax`
    setToken(newToken)
    setUser(newUser)
  }

  const clear = () => {
    localStorage.removeItem('em_token')
    localStorage.removeItem('em_user')
    localStorage.removeItem('em_login_at')
    document.cookie = 'em_token=; path=/; max-age=0'
    setToken(null)
    setUser(null)
  }

  // ── signin ─────────────────────────────────────────────────────────────────
  const signin = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.msg ?? 'Signin failed')
    }

    persist(data.token, data.user)
  }

  // ── sendSignupOtp ──────────────────────────────────────────────────────────
  const sendSignupOtp = async (name: string, email: string, password: string): Promise<SendOtpResponse> => {
    const res = await fetch(`${API_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.msg ?? 'Failed to send verification code')
    }

    return data
  }

  // ── verifySignupOtp ────────────────────────────────────────────────────────
  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await fetch(`${API_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.msg ?? 'Verification failed')
    }

    persist(data.token, data.user)
  }

  // ── resendSignupOtp ────────────────────────────────────────────────────────
  const resendSignupOtp = async (email: string): Promise<SendOtpResponse> => {
    const res = await fetch(`${API_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.msg ?? 'Failed to resend code')
    }

    return data
  }

  // ── signup (Direct fallback / legacy support) ──────────────────────────────
  const signup = async (name: string, email: string, password: string) => {
    await sendSignupOtp(name, email, password)
  }

  // ── signout ────────────────────────────────────────────────────────────────
  const signout = () => {
    clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signin,
        signup,
        sendSignupOtp,
        verifySignupOtp,
        resendSignupOtp,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

import { useRouter } from 'next/navigation'

export function useRedirectIfAuthenticated(destination = '/dashboard') {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(destination)
    }
  }, [isLoading, user, destination, router])
}
