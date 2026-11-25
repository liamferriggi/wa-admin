import { useEffect, useMemo, useState } from 'react'
import { cancelRsvpBooking, downloadRsvpCsv, getRsvp, removeRsvpGuest, type RsvpData, type RsvpGuest } from '../api'

export default function RsvpPage() {
  const [data, setData] = useState<RsvpData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [showCancelled, setShowCancelled] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = () => getRsvp().then(setData).catch((e) => setError(e.message))
  useEffect(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t) }, [])

  const bookings = useMemo(() => {
    const term = q.trim().toLowerCase()
    return (data?.bookings ?? [])
      .filter((b) => showCancelled || b.status === 'active')
      .filter((b) => !term || b.company.toLowerCase().includes(term) || b.sender.includes(term)
        || b.guests.some((g) => g.name.toLowerCase().includes(term) || g.mobile.replace(/\D/g, '').includes(term.replace(/\D/g, '') || '~')))
  }, [data, q, showCancelled])

  if (error?.includes('rsvp_restricted')) {
    return <div className="card empty-state">The Christmas Party guest list is private. Only Liam and Marina can see it.</div>
  }
  if (error) return <div className="error-banner">{error}</div>
  if (!data) return <div className="loading">Loading…</div>

  const copyTemplate = async () => {
    await navigator.clipboard.writeText(data.template)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{data.event} — RSVP</div>
          <div className="page-subtitle">
            Guests WhatsApp the agent; every booking lands here. {data.open ? 'RSVP is open.' : 'RSVP is closed.'}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => downloadRsvpCsv().catch((e) => setError(e.message))}>Download CSV</button>
      </div>

      <div className="stats-grid">
        <Stat label="People coming" value={data.totals.guests} />
        <Stat label="Bookings" value={data.totals.bookings} />
        <Stat label="Cancelled" value={data.totals.cancelled} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Template for the invitation</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
          Put this on the invitation with the WhatsApp number. Guests copy it, fill it in and send it. Anyone who just says "hi" gets it back automatically.
        </div>
        <pre style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, margin: 0, whiteSpace: 'pre-wrap' }}>{data.template}</pre>
        <button className="btn" style={{ marginTop: 8 }} onClick={copyTemplate}>{copied ? 'Copied' : 'Copy template'}</button>
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Search name, organisation or mobile" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
        <label style={{ fontSize: 13 }}><input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Show cancelled</label>
      </div>

      {bookings.length === 0 ? (
        <div className="card empty-state">No bookings yet.</div>
      ) : bookings.map((b) => (
        <div key={b.id} className="card" style={{ marginBottom: 12, opacity: b.status === 'active' ? 1 : 0.55 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{b.company || 'Organisation not given'}{b.status !== 'active' && ' (cancelled)'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Booked by +{b.sender} · {new Date(b.created_at).toLocaleString()} · {b.guests.length} {b.guests.length === 1 ? 'person' : 'people'}
              </div>
            </div>
            {b.status === 'active' && (
              <button className="btn" onClick={() => { if (confirm('Cancel this whole booking?')) cancelRsvpBooking(b.id).then(load) }}>Cancel booking</button>
            )}
          </div>
          <div className="table-wrapper" style={{ marginTop: 8 }}>
            <table>
              <thead><tr><th>#</th><th>Full name</th><th>Mobile</th>{data.bookingSync && <th>Entry code</th>}<th /></tr></thead>
              <tbody>
                {b.guests.map((g, i) => (
                  <tr key={g.id}>
                    <td>{i + 1}</td>
                    <td>{g.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{g.mobile || '—'}</td>
                    {data.bookingSync && <td><CodeCell g={g} /></td>}
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn" onClick={() => { if (confirm(`Remove ${g.name}?`)) removeRsvpGuest(g.id).then(load) }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// Where the guest's entrance code is: waiting for the booking app, issued, or on their WhatsApp.
function CodeCell({ g }: { g: RsvpGuest }) {
  if (g.sync_status === 'failed') return <span style={{ color: '#b91c1c' }} title={g.sync_error ?? ''}>Booking failed</span>
  if (!g.entry_code) return <span style={{ color: 'var(--text-muted)' }} title={g.sync_error ?? ''}>Waiting for booking app…</span>
  const sent = g.code_sent_at
    ? (g.code_via === 'booker' ? 'sent to booker' : 'sent on WhatsApp')
    : 'not sent yet'
  return <span><strong style={{ fontFamily: 'monospace' }}>{g.entry_code}</strong> <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {sent}</span></span>
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
