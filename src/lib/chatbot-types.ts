export type MessageRole = 'user' | 'assistant' | 'system'
export type AttachmentType = 'image' | 'file' | 'video' | 'audio'

export interface ChatAttachment {
  id: string
  type: AttachmentType
  name: string
  size: number
  url: string
  mimeType: string
  uploadedAt: number
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  attachments?: ChatAttachment[]
  isVoice?: boolean
}

export interface ChatRecommendation {
  id: string
  title: string
  description: string
  action: string
  category: 'incident' | 'workflow' | 'query' | 'analysis'
  icon?: string
}

export interface VoiceChatSession {
  id: string
  startTime: number
  endTime?: number
  duration?: number
  transcript?: string
}
