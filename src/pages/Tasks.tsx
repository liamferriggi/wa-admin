import { useEffect, useState } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../api'
import type { Task } from '../types'

const TYPE_ICON: Record<Task['type'], string> = {
  task: '✅', order: '📦', promise: '🤝', appointment: '📅', followup: '🔔',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(false)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')

  const load = () => getTasks().then(setTasks).catch((e) => setError(e.message)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!title.trim()) return
    await createTask({ title, dueDate: due || undefined })
    setTitle(''); setDue('')
    load()
  }

  const complete = async (t: Task) => { await updateTask(t.id, { status: t.status === 'open' ? 'done' : 'open' }); load() }
  const remove = async (t: Task) => { await deleteTask(t.id); load() }

  const visible = tasks.filter((t) => showDone ? true : t.status === 'open')
  const today = new Date().toISOString().slice(0, 10)

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tasks</div>
          <div className="page-subtitle">Extracted from conversations and voice notes — plus anything you add</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task…" style={{ flex: 2, minWidth: 200 }}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
        <button className="btn btn-primary" onClick={add}>Add task</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> show done
        </label>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {visible.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>No open tasks 🎉</div>
        ) : visible.map((t) => {
          const overdue = t.status === 'open' && t.dueDate && t.dueDate <= today
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', opacity: t.status === 'done' ? 0.55 : 1 }}>
              <input type="checkbox" checked={t.status === 'done'} onChange={() => complete(t)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <span title={t.type}>{TYPE_ICON[t.type] ?? '✅'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                {t.sourceText && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    from: "{t.sourceText.slice(0, 90)}"
                  </div>
                )}
              </div>
              {t.chatId && <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{t.chatId}</span>}
              {t.dueDate && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap',
                  color: overdue ? '#A33B2E' : '#2B35FF', background: overdue ? '#F6E4E0' : '#EEF0FF',
                }}>{overdue ? '⚠ ' : ''}{t.dueDate}</span>
              )}
              <button className="btn" onClick={() => remove(t)} title="Delete">🗑</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
