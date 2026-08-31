import { useEffect } from 'react'

// Deleting used to happen the moment you clicked the bin, with no warning and no
// visible result. This asks first and stays put until the work is finished, so a
// slow request cannot look like nothing happened.
export type ConfirmProps = {
  title: string
  body?: string
  confirmLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title, body, confirmLabel = 'Delete', destructive = true, busy = false, onConfirm, onCancel,
}: ConfirmProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
      if (e.key === 'Enter' && !busy) onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onConfirm, onCancel])

  return (
    <div
      onClick={() => !busy && onCancel()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,17,26,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--surface, #fff)', borderRadius: 12, padding: 24,
          maxWidth: 420, width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        {body && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>{body}</div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            className="btn"
            onClick={onConfirm}
            disabled={busy}
            style={{
              background: destructive ? '#C0392B' : 'var(--primary, #2B35FF)',
              color: '#fff', opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
