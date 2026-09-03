import type { Agent, AgentTemplate, AgentTurn, ChatState, Conversation, ApiKey, Note, Task, Webhook } from './types'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://wa.infinite-fusion.com'

function getToken(): string | null {
  return localStorage.getItem('ift_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('ift_token')
    window.location.href = '/login'
    throw new Error('Session expired — please sign in again')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  // A 204 has no body. Calling res.json() on it throws, which used to reject the
  // delete call and skip the caller's refresh — the row vanished only on a manual
  // reload, so deleting looked like it had done nothing.
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json()
}

// Agents
export const getAgents = () =>
  request<{ agents: Agent[] }>('/api/agents').then((r) => r.agents)
export const getAgent = (id: string) => request<Agent>(`/api/agents/${id}`)
export const createAgent = (data: Partial<Agent>) =>
  request<Agent>('/api/agents', { method: 'POST', body: JSON.stringify(data) })
export const updateAgent = (id: string, data: Partial<Agent>) =>
  request<Agent>(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAgent = (id: string) =>
  request<void>(`/api/agents/${id}`, { method: 'DELETE' })

// Conversations
export const getConversations = (params?: { agentId?: string; status?: string }) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
  return request<{ conversations: Conversation[] }>(`/api/conversations${qs}`).then((r) => r.conversations)
}
export const getConversation = (id: string) => request<Conversation>(`/api/conversations/${id}`)
export const deleteConversation = (id: string) =>
  request<void>(`/api/conversations/${id}`, { method: 'DELETE' })

// Requests (approve/reject)
export const approveRequest = (id: string) =>
  request<void>(`/api/requests/${id}/approve`, { method: 'POST' })
export const rejectRequest = (id: string, reason?: string) =>
  request<void>(`/api/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })

// Agent builder
export const testAgent = (id: string, body: {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  collected?: Record<string, unknown>
  overrides?: Partial<Agent>
}) => request<AgentTurn>(`/api/agents/${id}/test`, { method: 'POST', body: JSON.stringify(body) })

export const draftAgent = (description: string) =>
  request<Partial<Agent>>('/api/agents/draft', { method: 'POST', body: JSON.stringify({ description }) })

// Chats (chief-of-staff)
export const getChats = (state?: string) =>
  request<{ chats: ChatState[] }>(`/api/chats${state ? `?state=${state}` : ''}`).then((r) => r.chats)
export const updateChat = (chatId: string, data: { state?: string; snoozedUntil?: string; assignee?: string }) =>
  request<ChatState>(`/api/chats/${chatId}`, { method: 'PUT', body: JSON.stringify(data) })

// Tasks
export const getTasks = (params?: { status?: string; chatId?: string }) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
  return request<{ tasks: Task[] }>(`/api/tasks${qs}`).then((r) => r.tasks)
}
export const createTask = (data: Partial<Task>) =>
  request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(data) })
export const updateTask = (id: string, data: Partial<Task>) =>
  request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTask = (id: string) =>
  request<void>(`/api/tasks/${id}`, { method: 'DELETE' })

// Notes
export const getNotes = (chatId: string) =>
  request<{ notes: Note[] }>(`/api/chats/${chatId}/notes`).then((r) => r.notes)
export const createNote = (chatId: string, data: { author?: string; text: string }) =>
  request<Note>(`/api/chats/${chatId}/notes`, { method: 'POST', body: JSON.stringify(data) })

// Brief
export const getBrief = () => request<{ brief: string }>('/api/brief').then((r) => r.brief)
export const sendBrief = () => request<{ sent: boolean }>('/api/brief/send', { method: 'POST' })

// Outbound delivery log
export type Delivery = {
  id: string; kind: string; target: string; event: string; status: 'pending' | 'delivered' | 'failed'
  attempts: number; lastError?: string; nextAttemptAt: string; createdAt: string; deliveredAt?: string
}
export const getDeliveries = (status?: string) =>
  request<{ deliveries: Delivery[] }>(`/api/deliveries${status ? `?status=${status}` : ''}`).then((r) => r.deliveries)
export const retryDelivery = (id: string) => request<void>(`/api/deliveries/${id}/retry`, { method: 'POST' })

// Tenants — one client, one WhatsApp number, one database
export type Tenant = {
  id: string; name: string; phoneNumberId: string; wabaId?: string
  databasePath: string; mediaDir: string; active: boolean; createdAt: string
  usesEnvCredentials: boolean
}
export type ConnectionPack = {
  tenant: { id: string; name: string; phoneNumberId: string }
  webhook: { callbackUrl: string; verifyToken: string; subscribeTo: string[] }
  api: { baseUrl: string; authHeader: string; scopes: string[]; events: string[]; signatureHeader: string; signature: string }
  instructions: string[]
}
export const getTenants = () => request<{ tenants: Tenant[] }>('/api/tenants').then((r) => r.tenants)
export const createTenant = (data: { name: string; phoneNumberId: string; wabaId?: string; accessToken: string }) =>
  request<Tenant>('/api/tenants', { method: 'POST', body: JSON.stringify(data) })
export const updateTenant = (id: string, data: { name?: string; active?: boolean; accessToken?: string; wabaId?: string }) =>
  request<Tenant>(`/api/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTenant = (id: string) => request<void>(`/api/tenants/${id}`, { method: 'DELETE' })
export const getConnectionPack = (id: string) => request<ConnectionPack>(`/api/tenants/${id}/connection`)

// Business settings — portal-managed, falling back to the server environment
export type SettingsPayload = { settings: Record<string, string>; effective: Record<string, string> }
export const getSettings = () => request<SettingsPayload>('/api/settings')
export const saveSettings = (patch: Record<string, string>) =>
  request<SettingsPayload>('/api/settings', { method: 'PUT', body: JSON.stringify(patch) })

// Webhooks
export const getWebhooks = () =>
  request<{ webhooks: Webhook[] }>('/api/webhooks').then((r) => r.webhooks)
export const createWebhook = (data: { url: string; events?: string[]; secret?: string }) =>
  request<Webhook>('/api/webhooks', { method: 'POST', body: JSON.stringify(data) })
export const deleteWebhook = (id: string) =>
  request<void>(`/api/webhooks/${id}`, { method: 'DELETE' })

// Waitlist
export interface WaitlistEntry { id: string; email: string; name?: string; company?: string; createdAt: string }
export const getWaitlist = () =>
  request<{ waitlist: WaitlistEntry[] }>('/api/waitlist').then((r) => r.waitlist)

// Agent templates
export const getAgentTemplates = () =>
  request<{ templates: AgentTemplate[] }>('/api/agent-templates').then((r) => r.templates)
export const installAgentTemplate = (key: string) =>
  request<Agent>(`/api/agent-templates/${key}/install`, { method: 'POST' })

// API Keys
export const getApiKeys = () =>
  request<{ apiKeys: ApiKey[] }>('/api/api-keys').then((r) => r.apiKeys)
export const createApiKey = (data: { name: string }) =>
  request<ApiKey & { key: string }>('/api/api-keys', { method: 'POST', body: JSON.stringify(data) })
export const deleteApiKey = (id: string) =>
  request<void>(`/api/api-keys/${id}`, { method: 'DELETE' })
