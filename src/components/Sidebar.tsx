import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bot, MessageSquare, Key } from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/api-keys', label: 'API Keys', icon: Key },
]

const NAVY = '#0B0C2A'
const BLUE = '#2B35FF'

export default function Sidebar() {
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

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.25)',
        }}
      >
        wa.infinite-fusion.com
      </div>
    </aside>
  )
}
