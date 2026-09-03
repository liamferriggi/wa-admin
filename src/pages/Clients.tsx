import { useEffect, useState } from 'react'
import { getTenants, createTenant, updateTenant, deleteTenant, getConnectionPack } from '../api'
import type { Tenant, ConnectionPack } from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'

// Onboarding a client used to mean a code change and a deploy. It is now this
// page: add their WhatsApp number and token, hand them the connection pack.
export default function ClientsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState<Tenant | null>(null)
  const [pack, setPack] = useState<ConnectionPack | null>(null)

  const load = () => getTenants().then(setTenants).catch((e) => setError(e.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const toggle = async (t: Tenant) => {
    try {
      await updateTenant(t.id, { active: !t.active })
      setTenants((prev) => prev.map((x) => x.id === t.id ? { ...x, active: !x.active } : x))
      setToast(t.active ? `${t.name} paused` : `${t.name} active`)
    } catch (e) { setError((e as Error).message) }
  }

  const remove = async () => {
    if (!pending) return
    try {
      await deleteTenant(pending.id)
      setTenants((prev) => prev.filter((x) => x.id !== pending.id))
      setToast(`${pending.name} removed`)
    } catch (e) { setError((e as Error).message) } finally { setPending(null) }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Clients</div>
          <div className="page-subtitle">Each client has their own WhatsApp number and their own separate data</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add client</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        {tenants.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {t.name}
                {t.usesEnvCredentials && (
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 8 }}>
                    · original installation
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                number {t.phoneNumberId}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
              color: t.active ? '#1B7F4C' : '#8A8A8A', background: t.active ? '#E4F6EC' : '#EFEFEF',
            }}>{t.active ? 'active' : 'paused'}</span>
            <button className="btn btn-sm" onClick={() => getConnectionPack(t.id).then(setPack).catch((e) => setError(e.message))}>
              Connection details
            </button>
            <button className="btn btn-sm" onClick={() => toggle(t)}>{t.active ? 'Pause' : 'Activate'}</button>
            {!t.usesEnvCredentials && (
              <button className="btn btn-sm" onClick={() => setPending(t)} title="Remove client">🗑</button>
            )}
          </div>
        ))}
      </div>

      {adding && <AddClient onClose={() => setAdding(false)} onAdded={(t) => { setAdding(false); load(); setToast(`${t.name} added`); getConnectionPack(t.id).then(setPack).catch(() => {}) }} />}
      {pack && <ConnectionDetails pack={pack} onClose={() => setPack(null)} />}

      {pending && (
        <ConfirmDialog
          title={`Remove ${pending.name}?`}
          body="They stop receiving messages on their number immediately. Their fault history is kept on disk rather than deleted, so this can be undone by re-adding them."
          onConfirm={remove}
          onCancel={() => setPending(null)}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function AddClient({ onClose, onAdded }: { onClose: () => void; onAdded: (t: Tenant) => void }) {
  const [name, setName] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [wabaId, setWabaId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setErr(null)
    try { onAdded(await createTenant({ name, phoneNumberId, wabaId: wabaId || undefined, accessToken })) }
    catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,26,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Add a client</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          From their own Meta WhatsApp app. Their token is encrypted before it is stored, and their
          messages and photos live in a database of their own.
        </div>
        {err && <div className="error-banner">{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-label">Client name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Hotels" />
          </div>
          <div>
            <label className="form-label">WhatsApp phone number ID</label>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              The numeric ID from Meta, not the phone number itself. This is what routes their messages.
            </div>
            <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="1271865859345425" />
          </div>
          <div>
            <label className="form-label">WABA ID (optional)</label>
            <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="2054079535491697" />
          </div>
          <div>
            <label className="form-label">Permanent access token</label>
            <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAAG…" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy || !name.trim() || !phoneNumberId.trim() || !accessToken.trim()}>
              {busy ? 'Adding…' : 'Add client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConnectionDetails({ pack, onClose }: { pack: ConnectionPack; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (label: string, value: string) => {
    void navigator.clipboard?.writeText(value).then(() => { setCopied(label); setTimeout(() => setCopied(null), 1500) })
  }
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 130, fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      <code style={{ flex: 1, fontSize: 12, wordBreak: 'break-all' }}>{value}</code>
      <button className="btn btn-sm" onClick={() => copy(label, value)}>{copied === label ? '✓' : 'Copy'}</button>
    </div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,26,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, overflow: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 640, width: '100%' }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Connection details — {pack.tenant.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Everything the client needs. Nothing further is required on our side.
        </div>
        <Row label="Callback URL" value={pack.webhook.callbackUrl} />
        <Row label="Verify token" value={pack.webhook.verifyToken} />
        <Row label="Subscribe to" value={pack.webhook.subscribeTo.join(', ')} />
        <Row label="API base URL" value={pack.api.baseUrl} />
        <Row label="Auth header" value={pack.api.authHeader} />
        <Row label="Webhook events" value={pack.api.events.join(', ')} />
        <Row label="Signature" value={`${pack.api.signatureHeader}: ${pack.api.signature}`} />
        <ol style={{ fontSize: 13, lineHeight: 1.7, marginTop: 14, paddingLeft: 20 }}>
          {pack.instructions.map((line, i) => <li key={i}>{line}</li>)}
        </ol>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}
