import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getConversations, getConversation, approveRequest, rejectRequest } from '../api'
import type { Conversation, ConversationStatus } from '../types'
import StatusBadge from '../components/StatusBadge'

const STATUSES: ConversationStatus[] = [
  'collecting',
  'ready_for_review',
  'approved',
  'submitted',
  'cancelled',
]

export default function Conversations() {
  const { id } = useParams<{ id?: string }>()
  if (id) return <ConversationDetail id={id} />
  return <ConversationList />
}

function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')

  const load = () => {
    setLoading(true)
    getConversations({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(agentFilter ? { agentId: agentFilter } : {}),
    })
      .then(setConversations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter, agentFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const agentIds = [...new Set(conversations.map((c) => c.agentId))]

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Conversations</div>
          <div className="page-subtitle">{conversations.length} total</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="filters-row">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
        >
          <option value="">All Agents</option>
          {agentIds.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {conversations.length === 0 ? (
          <div className="empty-state">No conversations found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'monospace' }}>{c.phoneNumber}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.agentName || c.agentId}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(c.updatedAt).toLocaleString()}
                    </td>
                    <td>
                      <Link
                        to={`/conversations/${c.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        View
                      </Link>
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

function ConversationDetail({ id }: { id: string }) {
  const navigate = useNavigate()
  const [conv, setConv] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioning, setActioning] = useState(false)

  useEffect(() => {
    getConversation(id)
      .then(setConv)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleApprove = async () => {
    setActioning(true)
    try {
      await approveRequest(id)
      setConv((c) => c ? { ...c, status: 'approved' } : c)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setActioning(false)
    }
  }

  const handleReject = async () => {
    setActioning(true)
    try {
      await rejectRequest(id)
      setConv((c) => c ? { ...c, status: 'cancelled' } : c)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed')
    } finally {
      setActioning(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error-banner">{error}</div>
  if (!conv) return <div className="empty-state">Not found.</div>

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/conversations')}>
            ← Back
          </button>
          <div>
            <div className="page-title" style={{ fontFamily: 'monospace' }}>{conv.phoneNumber}</div>
            <div className="page-subtitle">{conv.agentName || conv.agentId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={conv.status} />
          {conv.status === 'ready_for_review' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={actioning}>
                Approve
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actioning}>
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Messages */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Messages</div>
          {conv.messages && conv.messages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conv.messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      background: m.role === 'user' ? 'var(--surface2)' : 'var(--accent)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                    }}
                  >
                    {m.content}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {m.role} · {new Date(m.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages recorded.</div>
          )}
        </div>

        {/* Collected Data */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Collected Data</div>
          {conv.collectedData && Object.keys(conv.collectedData).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(conv.collectedData).map(([key, value]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {key}
                  </div>
                  <div style={{ fontSize: 13 }}>{String(value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data collected yet.</div>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Conversation ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{conv.id}</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Created</div>
            <div style={{ fontSize: 13 }}>{new Date(conv.createdAt).toLocaleString()}</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Last Updated</div>
            <div style={{ fontSize: 13 }}>{new Date(conv.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
