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
  integration: '',
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

// Rebuilt as a guided flow. Everything here was previously one page of nine
// stacked cards using words like "system prompt" and "intelligence" — fine if you
// already knew the model underneath, unusable if you are a manager setting up an
// agent for your team. Same fields, four plain steps, one decision at a time.

type StepId = 'describe' | 'basics' | 'capture' | 'launch'

const STEPS: Array<{ id: StepId; label: string; blurb: string }> = [
  { id: 'describe', label: 'Describe the job', blurb: 'Tell it what this agent is for, in your own words' },
  { id: 'basics',   label: 'Check the details', blurb: 'We filled these in — correct anything that looks wrong' },
  { id: 'capture',  label: 'What to collect',  blurb: 'The information that must end up in the dashboard' },
  { id: 'launch',   label: 'Try it and turn on', blurb: 'Send it a test message before it goes live' },
]

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
  const [showAdvanced, setShowAdvanced] = useState(false)
  // An existing agent opens on the details, not the description box — you came to
  // change something, not to describe it again from scratch.
  const [step, setStep] = useState<StepId>(initial.id ? 'basics' : 'describe')

  const set = (patch: Partial<Agent>) => setA((prev) => ({ ...prev, ...patch }))
  const stepIndex = STEPS.findIndex((s) => s.id === step)

  const save = async () => {
    if (!a.name?.trim()) { setErr('Give the agent a name first'); setStep('basics'); return }
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
      setStep('basics')
    } catch (e) { setErr((e as Error).message) } finally { setDrafting(false) }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <button className="btn" onClick={onClose} style={{ marginBottom: 8 }}>← All agents</button>
          <div className="page-title">{a.id ? (a.name || 'Agent') : 'New agent'}</div>
          <div className="page-subtitle">{STEPS[stepIndex]?.blurb}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          {(a.id || step !== 'describe') && (
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save agent'}
            </button>
          )}
        </div>
      </div>

      <StepBar current={step} onGo={(id) => setStep(id)} unlocked={!!a.id || !!a.name?.trim()} />

      {err && <div className="error-banner">{err}</div>}

      {step === 'describe' && (
        <div className="card" style={{ background: 'var(--blue-light, #EEF0FF)', borderColor: 'var(--blue-mid, #C5C9FF)' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>What should this agent do?</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            Write it the way you would explain it to a new member of staff — what they handle, who messages
            them, what they need to find out, and anything they must never get wrong. One paragraph is enough
            to start, and a full written procedure works just as well. We turn it into a working agent that
            you can correct on the next step.
          </div>
          <textarea
            rows={12}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={'Example:\n\nYou take fault reports from staff in the Mythos WhatsApp group.\n\nPeople send a photo with a short note, sometimes just a photo, sometimes only text, and often across several messages. Work out what is broken and exactly where it is, and ask only for what is genuinely missing.\n\nNever guess a location. If something is a safety risk — exposed wiring, a gas smell, a major leak — say the area should not be used until it is made safe, and treat it as urgent.'}
            style={{ width: '100%', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={runDraft} disabled={drafting || !idea.trim()}>
              {drafting ? 'Setting it up…' : 'Set up my agent'}
            </button>
            <button className="btn" onClick={() => setStep('basics')} disabled={drafting}>
              I'll fill it in myself
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {drafting ? 'This can take up to a minute for a long description' : 'However long you like'}
            </span>
          </div>
        </div>
      )}

      {step === 'basics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Section title="Name and role" hint="How you recognise it, and who it becomes in the conversation">
              <Field label="Agent name">
                <input value={a.name ?? ''} onChange={(e) => set({ name: e.target.value })} placeholder="Faults Agent" />
              </Field>
              <Field label="Its role">
                <input value={a.role ?? ''} onChange={(e) => set({ role: e.target.value })} placeholder="Maintenance coordinator" />
              </Field>
              <Field label="One-line summary">
                <input value={a.description ?? ''} onChange={(e) => set({ description: e.target.value })} placeholder="Takes fault reports from staff and turns them into repair jobs" />
              </Field>
            </Section>

            <Section title="What it handles" hint="Who messages it and what they need from it">
              <textarea rows={6} value={a.jobContext ?? ''} onChange={(e) => set({ jobContext: e.target.value })} />
            </Section>

            <Section title="How it should work" hint="The steps you expect it to follow. Guidance, not a script — it adapts to how people actually write.">
              <textarea rows={7} value={a.workflow ?? ''} onChange={(e) => set({ workflow: e.target.value })} />
            </Section>

            <Section title="What it can rely on" hint="Facts it may state as true — opening hours, policies, who to contact. It will offer to check rather than invent anything not written here.">
              <textarea rows={5} value={a.knowledge ?? ''} onChange={(e) => set({ knowledge: e.target.value })} />
            </Section>

            <Section title="How it should sound">
              <input value={a.tone ?? ''} onChange={(e) => set({ tone: e.target.value })} placeholder="Short, friendly, professional — WhatsApp style" />
            </Section>
          </div>
          <TestPanel agent={a} />
        </div>
      )}

      {step === 'capture' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Section title="Information to collect" hint="It gathers these through normal conversation rather than asking them as a list. Mark something required and it will keep asking until it has it.">
              <FieldEditor fields={a.fields ?? []} onChange={(fields) => set({ fields })} />
            </Section>

            <Section title="When is the job finished?" hint="What has to be true before it stops asking questions and files the work">
              <textarea rows={3} value={a.completionCriteria ?? ''} onChange={(e) => set({ completionCriteria: e.target.value })}
                placeholder="Once we know what is broken, exactly where it is, and there is at least one clear photo." />
            </Section>

            <Section title="When should a person take over?" hint="Flags the chat for you instead of handling it alone">
              <textarea rows={3} value={a.escalationRule ?? ''} onChange={(e) => set({ escalationRule: e.target.value })}
                placeholder="Anything that could injure someone — exposed wiring, a gas smell, flooding, broken glass." />
            </Section>

            <Section title="Anything else it must know" hint="House rules, edge cases and worked examples. Passed to the agent word for word — worth checking here first if it ever behaves oddly.">
              <textarea rows={7} value={a.systemPrompt ?? ''} onChange={(e) => set({ systemPrompt: e.target.value })}
                placeholder={'Treat several unrelated faults in one message as separate jobs.\nCombine messages that clearly describe the same fault.\nNever guess a location — ask.'} />
            </Section>
          </div>
          <TestPanel agent={a} />
        </div>
      )}

      {step === 'launch' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Section title="Ready to go live?" hint="Try it on the right first — the test is a real conversation and nothing is sent to WhatsApp.">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={a.active ?? true} onChange={(e) => set({ active: e.target.checked })} />
                <span><strong>Answer real messages</strong> — turn this off to park the agent without deleting it</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={a.isDefault ?? false} onChange={(e) => set({ isDefault: e.target.checked })} />
                <span><strong>Handle anything unrecognised</strong> — messages no other agent claims come here</span>
              </label>
            </Section>

            <Section title="Where its tasks go" hint="Off keeps everything inside Wapilot. Switch it on and every fault this agent files also lands in FusionTask's triage inbox, with its photos.">
              <select
                value={a.integration ?? ''}
                onChange={(e) => set({ integration: e.target.value })}
              >
                <option value="">Wapilot only — tasks stay in this dashboard</option>
                <option value="fusiontask">FusionTask — file each job into the triage inbox</option>
                <option value="webhook">Your own system — send each job to a URL</option>
              </select>
              {a.integration === 'webhook' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  <Field label="Endpoint URL" hint="Each filed fault is POSTed here as JSON. Retried with backoff if your endpoint is down, and never dropped — see the delivery log in Settings.">
                    <input value={a.integrationUrl ?? ''} onChange={(e) => set({ integrationUrl: e.target.value })}
                      placeholder="https://your-system.example.com/faults" />
                  </Field>
                  <Field label="Secret or bearer token" hint="Starts with 'Bearer ' and it is sent as an Authorization header. Anything else is used to sign the body as X-Wapilot-Signature (HMAC-SHA256, hex).">
                    <input type="password" value={a.integrationApiKey ?? ''} onChange={(e) => set({ integrationApiKey: e.target.value })}
                      placeholder="Bearer …  or  a shared secret" />
                  </Field>
                </div>
              )}
            </Section>

            <Section title="Its code" hint="Start a WhatsApp message with this word and a colon to go straight to this agent — no guessing. For example: fix: the pool light is out. A short word, letters and numbers only. note, task, reminder and idea are taken.">
              <input
                value={a.code ?? ''}
                onChange={(e) => set({ code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) })}
                placeholder="fix"
                style={{ maxWidth: 160 }}
              />
            </Section>

            <Section title="Which messages reach it" hint="Only matters when more than one agent is switched on. Words someone would naturally use — it also judges by meaning, so this is a hint rather than a filter.">
              <input
                value={(a.triggerKeywords ?? []).join(', ')}
                onChange={(e) => set({ triggerKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })}
                placeholder="broken, leak, not working, damaged, repair"
              />
            </Section>

            <div className="card">
              <button
                className="btn"
                onClick={() => setShowAdvanced((v) => !v)}
                style={{ width: '100%', textAlign: 'left' }}
              >
                {showAdvanced ? '▾' : '▸'} Advanced settings
              </button>
              {showAdvanced && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                  <Field label="How much thinking it does" hint="Balanced suits almost everything. Smart is slower and costs more — worth it only for genuinely difficult judgement calls.">
                    <select value={a.intelligence ?? 'balanced'} onChange={(e) => set({ intelligence: e.target.value as Agent['intelligence'] })}>
                      <option value="fast">Quick — short, simple exchanges</option>
                      <option value="balanced">Balanced — recommended</option>
                      <option value="smart">Smart — difficult judgement, reads photos</option>
                    </select>
                  </Field>
                  <Field label="Conversation style" hint="Fixed questions ignores everything above and simply asks each field in order.">
                    <select value={a.mode ?? 'ai'} onChange={(e) => set({ mode: e.target.value as Agent['mode'] })}>
                      <option value="ai">Natural conversation — understands and adapts</option>
                      <option value="form">Fixed questions — asks each field in order</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          </div>
          <TestPanel agent={a} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 8 }}>
        <button className="btn" onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)].id)} disabled={stepIndex === 0}>
          ← Back
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(STEPS[stepIndex + 1].id)}>
            Next: {STEPS[stepIndex + 1].label} →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : a.id ? 'Save changes' : 'Create agent'}
          </button>
        )}
      </div>
    </div>
  )
}

function StepBar({ current, onGo, unlocked }: { current: StepId; onGo: (id: StepId) => void; unlocked: boolean }) {
  const idx = STEPS.findIndex((s) => s.id === current)
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {STEPS.map((s, i) => {
        const done = i < idx
        const active = i === idx
        // Jumping ahead before the agent has a name would land you on a test panel
        // with nothing to test, so hold those steps until there is something there.
        const reachable = i === 0 || unlocked
        return (
          <button
            key={s.id}
            onClick={() => reachable && onGo(s.id)}
            disabled={!reachable}
            style={{
              flex: '1 1 150px', textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: reachable ? 'pointer' : 'not-allowed',
              border: `1px solid ${active ? 'var(--primary, #2B35FF)' : 'var(--border)'}`,
              background: active ? 'var(--blue-light, #EEF0FF)' : 'transparent',
              opacity: reachable ? 1 : 0.5,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {done ? '✓' : `Step ${i + 1}`}
            </div>
            <div style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{s.label}</div>
          </button>
        )
      })}
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
