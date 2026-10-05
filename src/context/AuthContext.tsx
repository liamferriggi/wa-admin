import { createContext, useContext, useState, useEffect } from 'react'

const AUTH_URL = 'https://auth.infinite-fusion.com'
const API_URL = import.meta.env.VITE_API_URL || 'https://wa.infinite-fusion.com'

// Single sign-on (docs/SSO_INTEGRATION.md). The dashboard login sets the shared
// ift_token cookie on .infinite-fusion.com; it is HttpOnly, so the backend reads it
// and answers GET /api/session. Signing out of this app signs out of every app.
export const SSO_START_URL = `${AUTH_URL}/api/auth/sso/start?app=wa-admin`
export const SSO_LOGOUT_URL = `${AUTH_URL}/api/auth/sso/logout`

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
  noAccess: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

type Session = { kind: 'ok'; user: AuthUser } | { kind: 'denied' } | { kind: 'none' }

// Asks the backend who we are. Sends the SSO cookie, plus the legacy token from the
// app's own login if there is one, so sessions from before SSO keep working.
async function fetchSession(token: string | null): Promise<Session> {
  const res = await fetch(`${API_URL}/api/session`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (res.status === 403) return { kind: 'denied' }
  if (!res.ok) return { kind: 'none' }
  const u = (await res.json()).user
  if (!u) return { kind: 'none' }
  return {
    kind: 'ok',
    user: { userId: u.userId, email: u.email ?? '', name: u.name ?? u.email ?? '', role: u.role ?? '', tenantId: u.tenantId ?? '' },
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ift_token'))
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState(false)

  const apply = (s: Session) => {
    setUser(s.kind === 'ok' ? s.user : null)
    setNoAccess(s.kind === 'denied')
  }

  useEffect(() => {
    // Always ask: with no legacy token the SSO cookie may still sign us in. No
    // session simply shows the login page — never an automatic redirect.
    fetchSession(token)
      .then((s) => {
        if (s.kind === 'none' && token) {
          localStorage.removeItem('ift_token')
          setToken(null)
        }
        apply(s)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // The backend applies the same access check as for SSO.
    const s = await fetchSession(data.token)
    if (s.kind === 'none') throw new Error('Login failed')
    apply(s)
  }

  const logout = () => {
    localStorage.removeItem('ift_token')
    setToken(null)
    setUser(null)
    window.location.href = SSO_LOGOUT_URL
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, noAccess, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
