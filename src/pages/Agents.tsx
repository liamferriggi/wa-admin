import { useEffect, useState } from 'react'
import { getAgents, createAgent, updateAgent, deleteAgent } from '../api'
import type { Agent } from '../types'

const EMPTY_FORM = {
  name: '',
  description: '',
  triggerKeywords: '',
  systemPrompt: '',
  fields: '',
  active: true,
  isDefault: false,
}

type FormState = typeof EMPTY_FORM

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = () =>
    getAgents()
      .then(setAgents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (a: Agent) => {
    setEditingId(a.id)
    setForm({
      name: a.name,
      description: a.description ?? '',
      triggerKeywords: a.triggerKeywords.join(', '),
      systemPrompt: a.systemPrompt,
      fields: a.fields ? JSON.stringify(a.fields, null, 2) : '',
      active: a.active,
      isDefault: a.isDefault,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormError(null)
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    try {
      let parsedFields = undefined
      if (form.fields.trim()) {
        parsedFields = JSON.parse(form.fields)
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        triggerKeywords: form.triggerKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        systemPrompt: form.systemPrompt.trim(),
        fields: parsedFields,
        active: form.active,
        isDefault: form.isDefault,
      }
      if (editingId) {
        await updateAgent(editingId, payload)
      } else {
        await createAgent(payload)
      }
      setModalOpen(false)
      setLoading(true)
      load()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete agent "${name}"?`)) return
    try {
      await deleteAgent(id)
      setAgents((prev) => prev.filter((a) => a.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Agents</div>
          <div className="page-subtitle">{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + New Agent
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {agents.length === 0 ? (
          <div className="empty-state">No agents yet. Create your first agent to get started.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Keywords</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      {a.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.description}</div>
                      )}
                    </td>
                    <td>
                      {a.triggerKeywords.map((k) => (
                        <span className="chip" key={k}>{k}</span>
                      ))}
                    </td>
                    <td>
                      <span style={{
                        color: a.active ? 'var(--green)' : 'var(--text-muted)',
                        fontSize: 12,
                        fontWeight: 500,
                      }}>
                        {a.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: a.isDefault ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12 }}>
                      {a.isDefault ? 'Yes' : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id, a.name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-title">{editingId ? 'Edit Agent' : 'Create Agent'}</div>

            {formError && <div className="error-banner">{formError}</div>}

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Intake Agent" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            </div>

            <div className="form-group">
              <label className="form-label">Trigger Keywords (comma separated)</label>
              <input value={form.triggerKeywords} onChange={(e) => setForm({ ...form, triggerKeywords: e.target.value })} placeholder="hello, start, apply" />
            </div>

            <div className="form-group">
              <label className="form-label">System Prompt</label>
              <textarea
                rows={5}
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder="You are a helpful assistant..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fields Config (JSON array)</label>
              <textarea
                rows={4}
                value={form.fields}
                onChange={(e) => setForm({ ...form, fields: e.target.value })}
                placeholder={'[\n  { "name": "fullName", "label": "Full Name", "type": "text", "required": true }\n]'}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>

            <div className="toggle-row">
              <span style={{ fontSize: 13 }}>Active</span>
              <label className="toggle">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-row">
              <span style={{ fontSize: 13 }}>Default Agent</span>
              <label className="toggle">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
