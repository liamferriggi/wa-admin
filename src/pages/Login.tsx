import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: '#fff',
              border: '2px solid var(--border)',
              borderRadius: 14,
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              boxShadow: '0 2px 8px rgba(11,12,42,0.08)',
            }}
          >
            <img
              src="/brand/logo-stacked.png"
              alt="Infinite Fusion"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 4 }}>
            Wapilot
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Sign in to your Infinite Fusion account
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@infinite-fusion.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Infinite Fusion · Wapilot Admin
        </div>
      </div>
    </div>
  )
}
