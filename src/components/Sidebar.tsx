import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bot, MessageSquare, Key, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/api-keys', label: 'API Keys', icon: Key },
]

const NAVY = '#0B0C2A'
const BLUE = '#2B35FF'

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 'var(--sidebar-width)',
        background: NAVY,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: '#fff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 3,
            flexShrink: 0,
          }}
        >
          <img
            src="/brand/logo-stacked.png"
            alt="Infinite Fusion"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>
            Wapilot
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
            Infinite Fusion
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px', flex: 1 }}>
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
              borderRadius: 8,
              marginBottom: 2,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
              background: isActive ? BLUE : 'transparent',
              fontWeight: isActive ? 500 : 400,
              fontSize: 13,
              transition: 'all 0.15s',
              textDecoration: 'none',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.getAttribute('aria-current')) {
                el.style.color = '#fff'
                el.style.background = 'rgba(255,255,255,0.06)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.getAttribute('aria-current')) {
                el.style.color = 'rgba(255,255,255,0.5)'
                el.style.background = 'transparent'
              }
            }}
          >
            {({ isActive }) => (
              <>
                <item.icon size={15} color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: BLUE, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}
            >
              {initials(user.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
                borderRadius: 4, flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', padding: '4px 4px' }}>
            Infinite Fusion
          </div>
        )}
      </div>
    </aside>
  )
}
