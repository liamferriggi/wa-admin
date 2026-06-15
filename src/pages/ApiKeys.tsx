import { useEffect, useState } from 'react'
import { getApiKeys, createApiKey, deleteApiKey } from '../api'
import type { ApiKey } from '../types'

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  const load = () =>
    getApiKeys()
      .then(setKeys)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const created = await createApiKey({ name: newName.trim() })
      setNewKey(created)
      setNewName('')
      setModalOpen(false)
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create key')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete API key "${name}"?`)) return
    try {
      await deleteApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete key')
    }
  }

  const handleCopy = () => {
    if (newKey?.key) {
      navigator.clipboard.writeText(newKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">API Keys</div>
          <div className="page-subtitle">{keys.length} key{keys.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + New API Key
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* New key reveal */}
      {newKey && (
        <div
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
            API Key Created — copy it now, it won't be shown again
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="key-preview" style={{ flex: 1 }}>{newKey.key}</div>
            <button className="btn btn-primary btn-sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setNewKey(null)}
              style={{ color: 'var(--text-muted)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {keys.length === 0 ? (
          <div className="empty-state">No API keys yet.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key Preview</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 500 }}>{k.name}</td>
                    <td>
                      <span className="key-preview" style={{ display: 'inline' }}>
                        {k.keyPreview || '••••••••'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(k.id, k.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-title">Create API Key</div>
            <div className="form-group">
              <label className="form-label">Key Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Production, Mobile App"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !newName.trim()}>
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
