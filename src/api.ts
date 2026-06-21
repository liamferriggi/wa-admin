import type { Agent, Conversation, ApiKey } from './types'

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

// API Keys
export const getApiKeys = () =>
  request<{ apiKeys: ApiKey[] }>('/api/api-keys').then((r) => r.apiKeys)
export const createApiKey = (data: { name: string }) =>
  request<ApiKey & { key: string }>('/api/api-keys', { method: 'POST', body: JSON.stringify(data) })
export const deleteApiKey = (id: string) =>
  request<void>(`/api/api-keys/${id}`, { method: 'DELETE' })
