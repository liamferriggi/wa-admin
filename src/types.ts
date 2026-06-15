export interface Agent {
  id: string
  name: string
  description?: string
  triggerKeywords: string[]
  systemPrompt: string
  fields?: FieldConfig[]
  active: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'select'
  required?: boolean
  options?: string[]
}

export interface Conversation {
  id: string
  agentId: string
  agentName?: string
  phoneNumber: string
  status: ConversationStatus
  collectedData?: Record<string, unknown>
  messages?: Message[]
  createdAt: string
  updatedAt: string
}

export type ConversationStatus =
  | 'collecting'
  | 'ready_for_review'
  | 'approved'
  | 'submitted'
  | 'cancelled'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ApiKey {
  id: string
  name: string
  key?: string
  keyPreview?: string
  createdAt: string
  lastUsedAt?: string
}

export interface DashboardStats {
  totalAgents: number
  activeConversations: number
  pendingRequests: number
  approvedToday: number
}
