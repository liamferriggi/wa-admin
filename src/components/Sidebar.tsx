import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⬛' },
  { to: '/agents', label: 'Agents', icon: '🤖' },
  { to: '/conversations', label: 'Conversations', icon: '💬' },
  { to: '/api-keys', label: 'API Keys', icon: '🔑' },
]

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          ✉
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>WA Admin</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>WhatsApp Agents</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 6,
              marginBottom: 2,
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'var(--accent)' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              fontSize: 14,
              transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        wa.infinite-fusion.com
      </div>
    </aside>
  )
}
