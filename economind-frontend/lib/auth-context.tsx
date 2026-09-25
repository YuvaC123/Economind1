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

// >>> START: DIRECT SIGNUP AUTH CONTEXT INTERFACE <<<
interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  signin: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  signout: () => void
}
// <<< END: DIRECT SIGNUP AUTH CONTEXT INTERFACE >>>

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

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
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        clear()
      }
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
    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `em_token=${newToken}; path=/; max-age=${60 * 60 * 48}; SameSite=Lax${secureFlag}`
    setToken(newToken)
    setUser(newUser)
  }

  const clear = () => {
    localStorage.removeItem('em_token')
    localStorage.removeItem('em_user')
    localStorage.removeItem('em_login_at')
    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `em_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`
    setToken(null)
    setUser(null)
  }

  // ── signin ─────────────────────────────────────────────────────────────────
  const signin = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.msg ?? 'Signin failed')
    }

    persist(data.token, data.user)
  }

  // >>> START: DIRECT SIGNUP METHOD (REPLACED OTP METHODS) <<<
  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.msg ?? 'Signup failed')
    }

    persist(data.token, data.user)
  }
  // <<< END: DIRECT SIGNUP METHOD >>>

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

// >>> START: FIX REDIRECT HOOK (REPLACED router.replace WITH window.location.href) <<<
export function useRedirectIfAuthenticated(destination = '/dashboard') {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = destination
    }
  }, [isLoading, user, destination])
}
// <<< END: FIX REDIRECT HOOK >>>
