import type { ConversationStatus } from '../types'

const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; bg: string; border: string }> = {
  collecting:      { label: 'Collecting',      color: '#2B35FF', bg: '#EEF0FF', border: '#C5C9FF' },
  ready_for_review:{ label: 'Ready for Review',color: '#D97706', bg: '#FEF3C7', border: '#FCD34D' },
  approved:        { label: 'Approved',         color: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
  submitted:       { label: 'Submitted',        color: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
  cancelled:       { label: 'Cancelled',        color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as ConversationStatus] ?? {
    label: status,
    color: '#6B7280',
    bg: '#F3F4F6',
    border: '#D1D5DB',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}
