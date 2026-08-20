import { useEffect, useState } from 'react'
import { getChats, updateChat, getNotes, createNote } from '../api'
import type { ChatState, ChatStateValue, Note } from '../types'

const STATE_META: Record<ChatStateValue, { label: string; color: string; bg: string }> = {
  needs_reply: { label: 'Needs reply', color: '#A33B2E', bg: '#F6E4E0' },
  task_open: { label: 'Task open', color: '#B06A14', bg: '#F7EBD8' },
  waiting: { label: 'Waiting on them', color: '#2B35FF', bg: '#EEF0FF' },
  snoozed: { label: 'Snoozed', color: '#6B7280', bg: '#F3F4F6' },
  done: { label: 'Done', color: '#059669', bg: '#D1FAE5' },
}

const ORDER: ChatStateValue[] = ['needs_reply', 'task_open', 'waiting', 'snoozed', 'done']

export default function InboxPage() {
  const [chats, setChats] = useState<ChatState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ChatStateValue | 'all'>('all')
  const [notesFor, setNotesFor] = useState<string | null>(null)

  const load = () => getChats().then(setChats).catch((e) => setError(e.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const setState = async (chatId: string, state: ChatStateValue, snoozedUntil?: string) => {
    await updateChat(chatId, { state, snoozedUntil })
    load()
  }

  const visible = chats
    .filter((c) => filter === 'all' ? c.state !== 'done' : c.state === filter)
    .sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state))

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inbox</div>
          <div className="page-subtitle">Every chat, triaged — what needs you, what's waiting, what's handled</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterChip active={filter === 'all'} label={`Active (${chats.filter((c) => c.state !== 'done').length})`} onClick={() => setFilter('all')} />
        {ORDER.map((s) => (
          <FilterChip key={s} active={filter === s} label={`${STATE_META[s].label} (${chats.filter((c) => c.state === s).length})`} onClick={() => setFilter(s)} />
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {visible.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>Nothing here — inbox clear ✅</div>
        ) : visible.map((c) => (
          <div key={c.chatId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
              color: STATE_META[c.state].color, background: STATE_META[c.state].bg, whiteSpace: 'nowrap',
            }}>{STATE_META[c.state].label}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {c.contactName ?? c.chatId}
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'monospace', fontSize: 11 }}>{c.chatId}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.lastMessagePreview ?? '—'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {new Date(c.updatedAt).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {c.state !== 'done' && (
                <button className="btn" onClick={() => setState(c.chatId, 'done')} title="Mark done">✓</button>
              )}
              {c.state !== 'snoozed' && c.state !== 'done' && (
                <button className="btn" onClick={() => setState(c.chatId, 'snoozed', new Date(Date.now() + 3 * 86400000).toISOString())} title="Snooze 3 days">💤</button>
              )}
              {c.state === 'done' || c.state === 'snoozed' ? (
                <button className="btn" onClick={() => setState(c.chatId, 'needs_reply')} title="Reopen">↩</button>
              ) : null}
              <button className="btn" onClick={() => setNotesFor(notesFor === c.chatId ? null : c.chatId)} title="Notes">📝</button>
            </div>
          </div>
        ))}
      </div>

      {notesFor && <NotesPanel chatId={notesFor} onClose={() => setNotesFor(null)} />}
    </div>
  )
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
        border: '1px solid var(--border)',
        background: active ? 'var(--blue, #2B35FF)' : 'var(--surface, #fff)',
        color: active ? '#fff' : 'var(--text)',
        fontWeight: active ? 600 : 400,
      }}
    >{label}</button>
  )
}

function NotesPanel({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')

  const load = () => getNotes(chatId).then(setNotes).catch(() => {})
  useEffect(() => { load() }, [chatId])

  const add = async () => {
    if (!text.trim()) return
    await createNote(chatId, { text })
    setText('')
    load()
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Internal notes — {chatId}</div>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      {notes.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>No notes yet.</div>}
      {notes.map((n) => (
        <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
          <div>{n.text}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.author} · {new Date(n.createdAt).toLocaleString()}</div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note for the team…" style={{ flex: 1 }}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
        <button className="btn btn-primary" onClick={add}>Add</button>
      </div>
    </div>
  )
}
