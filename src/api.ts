import type { Agent, AgentTemplate, ChatState, Conversation, ApiKey, Note, Task, Webhook } from './types'

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

// Requests (approve/reject)
export const approveRequest = (id: string) =>
  request<void>(`/api/requests/${id}/approve`, { method: 'POST' })
export const rejectRequest = (id: string, reason?: string) =>
  request<void>(`/api/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })

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
