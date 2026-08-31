import { useEffect } from 'react'

// Confirmation that something actually happened. Without this, a successful
// delete and a silently failed one looked identical.
export default function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [message, onDone])

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        background: '#0F111A', color: '#fff', padding: '10px 18px', borderRadius: 8,
        fontSize: 13, zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
      role="status"
    >
      {message}
    </div>
  )
}
