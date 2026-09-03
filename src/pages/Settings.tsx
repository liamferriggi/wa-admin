import { useEffect, useState } from 'react'
import { getBrief, sendBrief, getWebhooks, createWebhook, deleteWebhook, getAgentTemplates, installAgentTemplate, getWaitlist, getSettings, saveSettings, getDeliveries, retryDelivery } from '../api'
import type { Delivery } from '../api'
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
      <BusinessSettingsCard />
      <BriefCard />
      <TemplatesCard />
      <WebhooksCard />
      <DeliveriesCard />
      <WaitlistCard />
    </div>
  )
}

const SETTING_FIELDS: Array<{ key: string; label: string; hint: string; placeholder: string }> = [
  { key: 'ownerPhone', label: 'Your WhatsApp number', hint: 'Receives the daily brief, and can use "agent:", "tasks" and "note:" from WhatsApp. Digits only or with spaces — either is fine.', placeholder: '35699123456' },
  { key: 'managerPhones', label: 'Manager numbers', hint: 'Get a message with the photos whenever a fault is filed. Comma separated. Leave empty for none. A manager who reported the fault themselves is not sent their own photos back.', placeholder: '35699123456, 35677123456' },
  { key: 'fusionTaskProperty', label: 'Fallback property (optional)', hint: 'Normally leave this empty. The agent works out the property from the report itself; this is only used when it could not tell. With both empty the fault is filed with no property, and whoever triages it picks one — safer than guessing the wrong building.', placeholder: 'usually left empty' },
  { key: 'conversationWindowMinutes', label: 'How long a report stays open (minutes)', hint: 'A follow-up within this window joins the report in progress; after it, the next message starts a fresh one. 360 = 6 hours.', placeholder: '360' },
  { key: 'briefHour', label: 'Daily brief hour (0–23)', hint: 'Server-local hour the morning brief is sent.', placeholder: '7' },
  { key: 'shareTokenDays', label: 'Photo link lifetime (days)', hint: 'How long a photo or video link stays reachable. Systems you file into download their own copy immediately, so a short life is safe and stops old links living forever.', placeholder: '30' },
]

// These used to live in the server environment, so changing one meant someone with
// shell access. They are editable here so an installation can be set up entirely
// from the portal. Anything left blank falls back to the environment value, which
// is shown underneath as "currently".
function BusinessSettingsCard() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [effective, setEffective] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSettings()
      .then((r) => { setValues(r.settings); setEffective(r.effective) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const r = await saveSettings(values)
      setValues(r.settings); setEffective(r.effective as Record<string, string>)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>⚙️ Business settings</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        Leave a field empty to use the server default. WhatsApp credentials are deliberately not editable here.
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SETTING_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="form-label" style={{ display: 'block', marginBottom: 2 }}>{f.label}</label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.hint}</div>
              <input
                value={values[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                style={{ width: '100%' }}
              />
              {!values[f.key] && effective[f.key] && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  currently <code>{effective[f.key]}</code> (from the server)
                </div>
              )}
            </div>
          ))}
          <div>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : saved ? 'Saved ✅' : 'Save settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// A delivery that failed used to be invisible — the event was simply gone. This
// makes every outbound attempt inspectable and replayable.
function DeliveriesCard() {
  const [rows, setRows] = useState<Delivery[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => getDeliveries().then(setRows).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])

  const replay = async (id: string) => {
    setBusy(id)
    try { await retryDelivery(id); await load() }
    catch (e) { setError((e as Error).message) } finally { setBusy(null) }
  }

  const colour = (s: Delivery['status']) =>
    s === 'delivered' ? { c: '#1B7F4C', b: '#E4F6EC' } : s === 'failed' ? { c: '#A33B2E', b: '#F6E4E0' } : { c: '#2B35FF', b: '#EEF0FF' }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontWeight: 600 }}>📤 Outbound deliveries</div>
        <button className="btn btn-sm" onClick={load}>Refresh</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Every webhook and filed fault sent to an outside system. Failures are retried with backoff and kept here, so nothing is lost quietly.
      </div>
      {error && <div className="error-banner">{error}</div>}
      {rows.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nothing sent yet.</div>
      ) : rows.slice(0, 25).map((d) => {
        const col = colour(d.status)
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, color: col.c, background: col.b }}>
              {d.status}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5 }}>{d.event} → <code style={{ fontSize: 11 }}>{d.target}</code></div>
              {d.lastError && <div style={{ fontSize: 11, color: '#A33B2E' }}>{d.lastError.slice(0, 120)}</div>}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.attempts} {d.attempts === 1 ? 'try' : 'tries'}</span>
            {d.status !== 'delivered' && (
              <button className="btn btn-sm" onClick={() => replay(d.id)} disabled={busy === d.id}>
                {busy === d.id ? '…' : 'Retry now'}
              </button>
            )}
          </div>
        )
      })}
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
