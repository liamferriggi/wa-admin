import { useEffect, useState } from 'react'
import { getAgents, createAgent, updateAgent, deleteAgent, testAgent, draftAgent } from '../api'
import type { Agent, FieldConfig } from '../types'

const BLANK: Partial<Agent> = {
  name: '',
  role: '',
  description: '',
  jobContext: '',
  workflow: '',
  knowledge: '',
  tone: 'Warm, direct and professional. Short WhatsApp-style replies.',
  completionCriteria: '',
  escalationRule: '',
  triggerKeywords: [],
  fields: [],
  mode: 'ai',
  intelligence: 'balanced',
  active: true,
  isDefault: false,
  systemPrompt: '',
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<Agent> | null>(null)

  const load = () =>
    getAgents().then(setAgents).catch((e) => setError(e.message)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  if (loading) return <div className="loading">Loading...</div>

  if (editing) {
    return (
      <AgentBuilder
        initial={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load() }}
      />
    )
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Agents</div>
          <div className="page-subtitle">AI agents that handle conversations on your WhatsApp number</div>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...BLANK })}>+ New agent</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {agents.length === 0 ? (
        <div className="card empty-state" style={{ padding: 40 }}>
          No agents yet. Create one, or install a ready-made agent from Settings.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {agents.map((a) => (
            <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.role || a.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {a.isDefault && <Pill text="default" color="#2B35FF" bg="#EEF0FF" />}
                  <Pill text={a.active ? 'active' : 'off'} color={a.active ? '#059669' : '#6B7280'} bg={a.active ? '#D1FAE5' : '#F3F4F6'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>{a.mode === 'form' ? '📋 Fixed questions' : '🤖 AI conversation'}</span>
                <span>·</span>
                <span>{a.intelligence}</span>
                <span>·</span>
                <span>{a.fields?.length ?? 0} fields</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setEditing(a)}>Open</button>
                <button
                  className="btn"
                  onClick={async () => {
                    if (!confirm(`Delete "${a.name}"?`)) return
                    await deleteAgent(a.id).catch((e) => setError(e.message))
                    load()
                  }}
                >🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, color, background: bg, whiteSpace: 'nowrap' }}>{text}</span>
}

// ── Builder ───────────────────────────────────────────────────────────────────

function AgentBuilder({ initial, onClose, onSaved }: {
  initial: Partial<Agent>
  onClose: () => void
  onSaved: () => void
}) {
  const [a, setA] = useState<Partial<Agent>>(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [drafting, setDrafting] = useState(false)
  const [idea, setIdea] = useState('')

  const set = (patch: Partial<Agent>) => setA((prev) => ({ ...prev, ...patch }))

  const save = async () => {
    if (!a.name?.trim()) { setErr('Give the agent a name'); return }
    setSaving(true); setErr(null)
    try {
      if (a.id) await updateAgent(a.id, a)
      else await createAgent(a)
      onSaved()
    } catch (e) { setErr((e as Error).message) } finally { setSaving(false) }
  }

  const runDraft = async () => {
    if (!idea.trim()) return
    setDrafting(true); setErr(null)
    try {
      const d = await draftAgent(idea)
      set({ ...d, id: a.id, active: a.active ?? true, isDefault: a.isDefault ?? false, mode: 'ai' })
      setIdea('')
    } catch (e) { setErr((e as Error).message) } finally { setDrafting(false) }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <button className="btn" onClick={onClose} style={{ marginBottom: 8 }}>← All agents</button>
          <div className="page-title">{a.id ? a.name : 'New agent'}</div>
          <div className="page-subtitle">Describe the job, give it a workflow, and it handles the rest</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save agent'}</button>
        </div>
      </div>

      {err && <div className="error-banner">{err}</div>}

      {/* AI draft */}
      <div className="card" style={{ marginBottom: 16, background: 'var(--blue-light, #EEF0FF)', borderColor: 'var(--blue-mid, #C5C9FF)' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>✨ Describe it and I'll set it up</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          Write one line, or paste a full specification — role, rules, examples, safety procedures, the lot.
          Everything you write is carried into the fields below; anything that doesn't fit a field lands in
          Additional instructions rather than being dropped.
        </div>
        <textarea
          rows={10}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder={'e.g. You are the Mythos Faults Agent, operating inside the Mythos staff WhatsApp group.\n\nYour purpose is to capture faults, damages and repair requests reported by staff, and turn them into actionable maintenance tasks.\n\nStaff may report faults in different ways — a photo with a short note, several photos, only a photo, only text, or a voice message…'}
          style={{ width: '100%', fontFamily: 'inherit', lineHeight: 1.5 }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={runDraft} disabled={drafting || !idea.trim()}>
            {drafting ? 'Designing your agent…' : 'Draft it'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {idea.trim() ? `${idea.trim().split(/\s+/).length} words` : 'Long specifications welcome'}
            {drafting ? ' · this can take up to a minute for a long spec' : ''}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <Section title="Identity" hint="Who this agent is when someone messages your number">
            <Field label="Agent name" hint="Internal — how you'll recognise it">
              <input value={a.name ?? ''} onChange={(e) => set({ name: e.target.value })} placeholder="Procurement Agent" />
            </Field>
            <Field label="Role" hint="The job title it takes on in the conversation">
              <input value={a.role ?? ''} onChange={(e) => set({ role: e.target.value })} placeholder="Procurement officer" />
            </Field>
            <Field label="Short description">
              <input value={a.description ?? ''} onChange={(e) => set({ description: e.target.value })} placeholder="Handles material requests from site staff" />
            </Field>
          </Section>

          <Section title="The job" hint="What this agent handles, who it talks to, and anything it must know about how you work">
            <textarea
              rows={6}
              value={a.jobContext ?? ''}
              onChange={(e) => set({ jobContext: e.target.value })}
              placeholder={'You handle material and supply requests from site staff.\nRequests come in informally, often mid-job and in a hurry.\nYour goal is to turn a rough request into something the buying team can act on without chasing anyone.'}
            />
          </Section>

          <Section title="Workflow" hint="The steps you expect it to follow — guidance, not a rigid script. It will adapt and use its own judgement around this.">
            <textarea
              rows={7}
              value={a.workflow ?? ''}
              onChange={(e) => set({ workflow: e.target.value })}
              placeholder={'1. Acknowledge the request.\n2. Work out what they need, how many, and by when.\n3. Find out which site and where to deliver.\n4. Establish urgency.\n5. Read it back and confirm.'}
            />
          </Section>

          <Section title="What it knows" hint="Facts it can rely on — prices, hours, policies, suppliers. It will say it needs to check rather than invent anything not written here.">
            <textarea
              rows={6}
              value={a.knowledge ?? ''}
              onChange={(e) => set({ knowledge: e.target.value })}
              placeholder={'Deliveries to site are next-day if ordered before 15:00.\nAnything critical is escalated to the buying team immediately.'}
            />
          </Section>

          <Section title="Information to capture" hint="What should end up in the dashboard. It collects these through natural conversation, not by interrogating.">
            <FieldEditor fields={a.fields ?? []} onChange={(fields) => set({ fields })} />
          </Section>

          <Section title="Behaviour">
            <Field label="Tone">
              <input value={a.tone ?? ''} onChange={(e) => set({ tone: e.target.value })} placeholder="Warm, direct and professional" />
            </Field>
            <Field label="When is it complete?" hint="When the request should move to Ready for review">
              <textarea rows={2} value={a.completionCriteria ?? ''} onChange={(e) => set({ completionCriteria: e.target.value })}
                placeholder="Once item, quantity, date, location and urgency are known and the person has confirmed." />
            </Field>
            <Field label="When should a human step in?" hint="Creates a task and flags the chat for you">
              <textarea rows={2} value={a.escalationRule ?? ''} onChange={(e) => set({ escalationRule: e.target.value })}
                placeholder="Anything over €5,000, hired machinery, or a complaint about an existing order." />
            </Field>
          </Section>

          <Section title="Additional instructions" hint="House rules, edge cases, worked examples — anything that doesn't belong in the fields above. Passed to the agent verbatim.">
            <textarea
              rows={8}
              value={a.systemPrompt ?? ''}
              onChange={(e) => set({ systemPrompt: e.target.value })}
              placeholder={'If a staff member reports several unrelated faults in one message, treat them as separate faults.\nCombine messages that clearly refer to the same fault.\nNever guess the location — ask.'}
            />
          </Section>

          <Section title="Settings">
            <Field label="Intelligence" hint="Higher is smarter and slower; balanced suits most agents">
              <select value={a.intelligence ?? 'balanced'} onChange={(e) => set({ intelligence: e.target.value as Agent['intelligence'] })}>
                <option value="fast">Fast — quick, simple conversations</option>
                <option value="balanced">Balanced — recommended</option>
                <option value="smart">Smart — complex judgement, nuanced replies</option>
              </select>
            </Field>
            <Field label="Trigger words" hint="Used to pick this agent when several are active. Comma separated.">
              <input
                value={(a.triggerKeywords ?? []).join(', ')}
                onChange={(e) => set({ triggerKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                placeholder="order, buy, material, supplier"
              />
            </Field>
            <Field label="Mode">
              <select value={a.mode ?? 'ai'} onChange={(e) => set({ mode: e.target.value as Agent['mode'] })}>
                <option value="ai">AI conversation — understands and adapts</option>
                <option value="form">Fixed questions — asks each field in order</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 18, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={a.active ?? true} onChange={(e) => set({ active: e.target.checked })} /> Active
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <input type="checkbox" checked={a.isDefault ?? false} onChange={(e) => set({ isDefault: e.target.checked })} /> Default agent
              </label>
            </div>
          </Section>
        </div>

        <TestPanel agent={a} />
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: hint ? 2 : 12 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{hint}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label" style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{hint}</div>}
      {children}
    </div>
  )
}

function FieldEditor({ fields, onChange }: { fields: FieldConfig[]; onChange: (f: FieldConfig[]) => void }) {
  const update = (i: number, patch: Partial<FieldConfig>) =>
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fields.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Nothing defined yet — the agent will capture whatever seems relevant.
        </div>
      )}
      {fields.map((f, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ flex: 2, minWidth: 120 }} value={f.label} placeholder="Label (Quantity)"
              onChange={(e) => update(i, { label: e.target.value })} />
            <input style={{ flex: 2, minWidth: 120, fontFamily: 'monospace', fontSize: 12 }} value={f.key} placeholder="key (quantity)"
              onChange={(e) => update(i, { key: e.target.value })} />
            <select style={{ flex: 1, minWidth: 96 }} value={f.type} onChange={(e) => update(i, { type: e.target.value as FieldConfig['type'] })}>
              <option value="text">text</option>
              <option value="number">number</option>
              <option value="date">date</option>
              <option value="select">select</option>
            </select>
            <button className="btn" onClick={() => onChange(fields.filter((_, idx) => idx !== i))}>🗑</button>
          </div>
          <input value={f.question ?? ''} placeholder="How it might ask: How many units do you need?"
            onChange={(e) => update(i, { question: e.target.value })} />
          {f.type === 'select' && (
            <input value={(f.options ?? []).join(', ')} placeholder="Options, comma separated: normal, urgent, critical"
              onChange={(e) => update(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })} />
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input type="checkbox" checked={f.required !== false} onChange={(e) => update(i, { required: e.target.checked })} /> Required
          </label>
        </div>
      ))}
      <button className="btn" onClick={() => onChange([...fields, { key: '', label: '', question: '', type: 'text', required: true }])}>
        + Add field
      </button>
    </div>
  )
}

// ── Live test ─────────────────────────────────────────────────────────────────

function TestPanel({ agent }: { agent: Partial<Agent> }) {
  const [msgs, setMsgs] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [collected, setCollected] = useState<Record<string, unknown>>({})
  const [status, setStatus] = useState<string>('collecting')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const send = async () => {
    if (!input.trim()) return
    if (!agent.id) { setErr('Save the agent once before testing.'); return }
    const text = input
    setInput(''); setErr(null); setBusy(true)
    setMsgs((m) => [...m, { role: 'user', content: text }])
    try {
      const r = await testAgent(agent.id, { message: text, history: msgs, collected, overrides: agent })
      setMsgs((m) => [...m, { role: 'assistant', content: r.reply }])
      setCollected(r.collected ?? {})
      setStatus(r.needsHuman ? 'needs a human' : r.status)
    } catch (e) {
      setErr((e as Error).message)
    } finally { setBusy(false) }
  }

  const reset = () => { setMsgs([]); setCollected({}); setStatus('collecting'); setErr(null) }

  return (
    <div className="card" style={{ position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>💬 Try it</div>
        <button className="btn" onClick={reset}>Reset</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -6 }}>
        Talks to your unsaved changes — no WhatsApp needed.
      </div>

      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
        padding: 10, minHeight: 220, maxHeight: 400, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: 'auto', textAlign: 'center' }}>
            Send a message the way a customer would.
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#2B35FF' : 'var(--surface, #fff)',
            color: m.role === 'user' ? '#fff' : 'var(--text)',
            border: m.role === 'user' ? 'none' : '1px solid var(--border)',
            borderRadius: 10, padding: '7px 11px', fontSize: 13, maxWidth: '85%', whiteSpace: 'pre-wrap',
          }}>{m.content}</div>
        ))}
        {busy && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>typing…</div>}
      </div>

      {err && <div className="error-banner" style={{ fontSize: 12 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 6 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…"
          style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter' && !busy) send() }} />
        <button className="btn btn-primary" onClick={send} disabled={busy}>Send</button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
          Captured so far · {status}
        </div>
        {Object.keys(collected).length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nothing yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(collected).map(([k, v]) => (
              <div key={k} style={{ fontSize: 12, display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
