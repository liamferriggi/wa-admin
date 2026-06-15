import type { ConversationStatus } from '../types'

const STATUS_CONFIG: Record<ConversationStatus, { label: string; color: string; bg: string }> = {
  collecting: { label: 'Collecting', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  ready_for_review: { label: 'Ready for Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  submitted: { label: 'Submitted', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as ConversationStatus] ?? {
    label: status,
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.12)',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}
