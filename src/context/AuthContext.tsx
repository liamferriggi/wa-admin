import { createContext, useContext, useState, useEffect } from 'react'

const AUTH_URL = 'https://auth.infinite-fusion.com'

export interface AuthUser {
  userId: string
  email: string
  name: string
  role: string
  tenantId: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ift_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    // Verify token validity then fetch full user profile (verify only returns JWT payload, no email/name)
    fetch(`${AUTH_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? fetch(`${AUTH_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.reject()))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const u = data.user ?? data
        setUser({
          userId: u.id ?? u.userId,
          email: u.email,
          name: u.name,
          role: u.role,
          tenantId: u.tenantId ?? '',
        })
      })
      .catch(() => {
        localStorage.removeItem('ift_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await fetch(`${AUTH_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(err.error || 'Login failed')
    }
    const data = await res.json()
    localStorage.setItem('ift_token', data.token)
    setToken(data.token)
    // login returns { id, email, name, role }; normalize to AuthUser shape
    const u = data.user
    setUser({
      userId: u.userId ?? u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      tenantId: u.tenantId ?? '',
    })
  }

  const logout = () => {
    fetch(`${AUTH_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {})
    localStorage.removeItem('ift_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
