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

export type ChatStateValue = 'needs_reply' | 'waiting' | 'task_open' | 'snoozed' | 'done'

export interface ChatState {
  chatId: string
  state: ChatStateValue
  snoozedUntil?: string
  assignee?: string
  contactName?: string
  lastInboundAt?: string
  lastOutboundAt?: string
  lastMessagePreview?: string
  updatedAt: string
}

export interface Task {
  id: string
  chatId?: string
  conversationId?: string
  title: string
  type: 'task' | 'order' | 'promise' | 'appointment' | 'followup'
  dueDate?: string
  status: 'open' | 'done' | 'cancelled'
  assignee?: string
  sourceText?: string
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  chatId: string
  author: string
  text: string
  createdAt: string
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  hasSecret?: boolean
  active: boolean
  createdAt: string
}

export interface AgentTemplate {
  key: string
  name: string
  description: string
  triggerKeywords: string[]
  systemPrompt: string
  fields: FieldConfig[]
}

export interface DashboardStats {
  totalAgents: number
  activeConversations: number
  pendingRequests: number
  approvedToday: number
}
