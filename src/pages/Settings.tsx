import { useEffect, useState } from 'react'
import { getBrief, sendBrief, getWebhooks, createWebhook, deleteWebhook, getAgentTemplates, installAgentTemplate, getWaitlist } from '../api'
import type { AgentTemplate, Webhook } from '../types'
import type { WaitlistEntry } from '../api'

export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Settings & Integrations</div>
          <div className="page-subtitle">Daily brief, outbound webhooks, agent templates, and waitlist</div>
        </div>
      </div>
      <BriefCard />
      <TemplatesCard />
      <WebhooksCard />
      <WaitlistCard />
    </div>
  )
}

function BriefCard() {
  const [brief, setBrief] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { getBrief().then(setBrief).catch((e) => setError(e.message)) }, [])
  const send = async () => {
    try { await sendBrief(); setSent(true); setTimeout(() => setSent(false), 3000) }
    catch (e) { setError((e as Error).message) }
  }
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>☀️ Daily brief</div>
        <button className="btn btn-primary" onClick={send}>{sent ? 'Sent ✅' : 'Send to owner now'}</button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontFamily: 'inherit', margin: 0 }}>{brief || 'Loading preview…'}</pre>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Sends automatically every morning to the configured owner number. In WhatsApp the owner can reply: <code>brief</code>, <code>tasks</code>, <code>done 2</code>, <code>snooze &lt;phone&gt; 3d</code>, <code>ignore &lt;phone&gt;</code>.</div>
    </div>
  )
}

function TemplatesCard() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [installed, setInstalled] = useState<string | null>(null)
  useEffect(() => { getAgentTemplates().then(setTemplates).catch(() => {}) }, [])
  const install = async (key: string) => {
    await installAgentTemplate(key)
    setInstalled(key)
    setTimeout(() => setInstalled(null), 3000)
  }
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>🤖 Agent templates</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {templates.map((t) => (
          <div key={t.key} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 10px' }}>{t.description}</div>
            <button className="btn" onClick={() => install(t.key)}>{installed === t.key ? 'Installed ✅' : 'Install as agent'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function WebhooksCard() {
  const [hooks, setHooks] = useState<Webhook[]>([])
  const [url, setUrl] = useState('')
  const load = () => getWebhooks().then(setHooks).catch(() => {})
  useEffect(() => { load() }, [])
  const add = async () => {
    if (!url.trim()) return
    await createWebhook({ url })
    setUrl(''); load()
  }
  const remove = async (id: string) => { await deleteWebhook(id); load() }
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>🔗 Outbound webhooks</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        POSTs events (task.created, task.updated, chat.state_changed, request.ready_for_review) to your systems — Sheets, Zapier, ERP.
      </div>
      {hooks.map((h) => (
        <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          <code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.url}</code>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.events.join(', ')}</span>
          <button className="btn" onClick={() => remove(h.id)}>🗑</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-system.example/webhook" style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={add}>Add webhook</button>
      </div>
    </div>
  )
}

function WaitlistCard() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  useEffect(() => { getWaitlist().then(setEntries).catch(() => {}) }, [])
  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 8 }}>📬 Landing-page waitlist ({entries.length})</div>
      {entries.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No signups yet — the landing page is at wa.infinite-fusion.com</div>
      ) : (
        <div className="table-wrapper"><table>
          <thead><tr><th>Email</th><th>Joined</th></tr></thead>
          <tbody>{entries.map((e) => (
            <tr key={e.id}><td>{e.email}</td><td style={{ color: 'var(--text-muted)' }}>{new Date(e.createdAt).toLocaleString()}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}
