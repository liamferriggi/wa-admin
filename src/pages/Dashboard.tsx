import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAgents, getConversations } from '../api'
import type { Conversation, Agent } from '../types'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAgents(), getConversations()])
      .then(([a, c]) => {
        setAgents(a)
        setConversations(c)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toDateString()
  const stats = {
    totalAgents: agents.length,
    activeConversations: conversations.filter((c) => c.status === 'collecting').length,
    pendingRequests: conversations.filter((c) => c.status === 'ready_for_review').length,
    approvedToday: conversations.filter(
      (c) => c.status === 'approved' && new Date(c.updatedAt).toDateString() === today
    ).length,
  }

  const recent = [...conversations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Overview of your WhatsApp agent platform</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Total Agents" value={stats.totalAgents} accent="#6366f1" />
        <StatCard label="Active Conversations" value={stats.activeConversations} accent="#3b82f6" />
        <StatCard label="Pending Review" value={stats.pendingRequests} accent="#f59e0b" />
        <StatCard label="Approved Today" value={stats.approvedToday} accent="#10b981" />
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600 }}>Recent Conversations</div>
          <Link to="/conversations" style={{ color: 'var(--accent)', fontSize: 13 }}>
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">No conversations yet</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <Link
                        to={`/conversations/${c.id}`}
                        style={{ color: 'var(--text)', fontFamily: 'monospace' }}
                      >
                        {c.phoneNumber}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.agentName || c.agentId}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(c.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="stat-card">
      <div
        style={{
          width: 36,
          height: 4,
          background: accent,
          borderRadius: 2,
          marginBottom: 14,
        }}
      />
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: accent }}>
        {value}
      </div>
    </div>
  )
}
