import { useAuth } from '../context/AuthContext'

// Shown when the backend answers 403: signed in, but not given WhatsApp Admin.
export default function NoAccess() {
  const { logout } = useAuth()
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
      <div className="card" style={{ padding: 32, maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, color: 'var(--navy)', marginBottom: 10 }}>
          You don't have access to WhatsApp Admin.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
          Ask your manager to give you access to this app.
        </p>
        <a
          href="https://ceo.infinite-fusion.com/"
          className="btn btn-primary"
          style={{ justifyContent: 'center', padding: '10px 16px', fontSize: 14, textDecoration: 'none' }}
        >
          Back to the dashboard
        </a>
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={logout}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
