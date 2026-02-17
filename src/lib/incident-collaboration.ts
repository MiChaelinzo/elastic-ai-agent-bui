import { getSimulatedCurrentTime } from './utils'

export type ReactionType = '👍' | '👎' | '❤️' | '🎉' | '🚀' | '👀' | '⚠️' | '✅'

export interface Reaction {
  id: string
  userId: string
  userName: string
  userAvatar: string
  type: ReactionType
  timestamp: number
}

export interface Comment {
  id: string
  incidentId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  mentions: string[]
  timestamp: number
  updatedAt?: number
  isEdited: boolean
  reactions: Reaction[]
  parentCommentId?: string
  replies?: Comment[]
  attachments?: CommentAttachment[]
  isInternal: boolean
}

export interface CommentAttachment {
  id: string
  name: string
  type: 'image' | 'file' | 'link'
  url: string
  size?: number
  mimeType?: string
}

export interface Mention {
  userId: string
  userName: string
  position: number
}

export interface IncidentActivity {
  id: string
  incidentId: string
  userId: string
  userName: string
  userAvatar: string
  type: 'comment' | 'status_change' | 'severity_change' | 'assignment' | 'resolution' | 'mention'
  timestamp: number
  description: string
  metadata?: Record<string, any>
}

export interface CollaborationSettings {
  enableComments: boolean
  enableReactions: boolean
  enableMentions: boolean
  enableRealTimeUpdates: boolean
  notifyOnMention: boolean
  notifyOnReply: boolean
  notifyOnReaction: boolean
  allowExternalComments: boolean
}

export const defaultCollaborationSettings: CollaborationSettings = {
  enableComments: true,
  enableReactions: true,
  enableMentions: true,
  enableRealTimeUpdates: true,
  notifyOnMention: true,
  notifyOnReply: true,
  notifyOnReaction: false,
  allowExternalComments: false
}

export const reactionTypes: ReactionType[] = ['👍', '👎', '❤️', '🎉', '🚀', '👀', '⚠️', '✅']

export function createComment(
  incidentId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  content: string,
  mentions: string[] = [],
  parentCommentId?: string,
  attachments?: CommentAttachment[],
  isInternal: boolean = false
): Comment {
  return {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    incidentId,
    userId,
    userName,
    userAvatar,
    content,
    mentions,
    timestamp: getSimulatedCurrentTime(),
    isEdited: false,
    reactions: [],
    parentCommentId,
    replies: [],
    attachments,
    isInternal
  }
}

export function addReaction(
  comment: Comment,
  userId: string,
  userName: string,
  userAvatar: string,
  type: ReactionType
): Comment {
  const existingReaction = comment.reactions.find(
    r => r.userId === userId && r.type === type
  )

  if (existingReaction) {
    return {
      ...comment,
      reactions: comment.reactions.filter(r => r.id !== existingReaction.id)
    }
  }

  const reaction: Reaction = {
    id: `reaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    userAvatar,
    type,
    timestamp: getSimulatedCurrentTime()
  }

  return {
    ...comment,
    reactions: [...comment.reactions, reaction]
  }
}

export function updateComment(
  comment: Comment,
  content: string,
  mentions: string[] = []
): Comment {
  return {
    ...comment,
    content,
    mentions,
    updatedAt: getSimulatedCurrentTime(),
    isEdited: true
  }
}

export function deleteComment(comments: Comment[], commentId: string): Comment[] {
  return comments.filter(c => c.id !== commentId && c.parentCommentId !== commentId)
}

export function getCommentsForIncident(
  comments: Comment[],
  incidentId: string
): Comment[] {
  const incidentComments = comments.filter(
    c => c.incidentId === incidentId && !c.parentCommentId
  )

  return incidentComments.map(comment => ({
    ...comment,
    replies: comments
      .filter(c => c.parentCommentId === comment.id)
      .sort((a, b) => a.timestamp - b.timestamp)
  })).sort((a, b) => b.timestamp - a.timestamp)
}

export function getReactionSummary(reactions: Reaction[]): Map<ReactionType, number> {
  const summary = new Map<ReactionType, number>()
  reactions.forEach(reaction => {
    summary.set(reaction.type, (summary.get(reaction.type) || 0) + 1)
  })
  return summary
}

export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)]
}

export function createActivity(
  incidentId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  type: IncidentActivity['type'],
  description: string,
  metadata?: Record<string, any>
): IncidentActivity {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    incidentId,
    userId,
    userName,
    userAvatar,
    type,
    timestamp: getSimulatedCurrentTime(),
    description,
    metadata
  }
}

export function getActivitiesForIncident(
  activities: IncidentActivity[],
  incidentId: string
): IncidentActivity[] {
  return activities
    .filter(a => a.incidentId === incidentId)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export function getUserMentions(
  comments: Comment[],
  userName: string
): Comment[] {
  return comments.filter(c => c.mentions.includes(userName))
}

export function formatCommentTime(timestamp: number): string {
  const now = getSimulatedCurrentTime()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else if (seconds > 10) {
    return `${seconds}s ago`
  } else {
    return 'just now'
  }
}

export function highlightMentions(content: string): string {
  return content.replace(
    /@(\w+)/g,
    '<span class="text-primary font-semibold">@$1</span>'
  )
}

export function getCommentCount(comments: Comment[], incidentId: string): number {
  return comments.filter(c => c.incidentId === incidentId).length
}

export function getTotalReactionCount(comments: Comment[]): number {
  return comments.reduce((total, comment) => total + comment.reactions.length, 0)
}

export function getMostActiveUsers(
  comments: Comment[],
  limit: number = 5
): Array<{ userId: string; userName: string; commentCount: number }> {
  const userCounts = new Map<string, { userId: string; userName: string; count: number }>()

  comments.forEach(comment => {
    const existing = userCounts.get(comment.userId) || {
      userId: comment.userId,
      userName: comment.userName,
      count: 0
    }
    userCounts.set(comment.userId, { ...existing, count: existing.count + 1 })
  })

  return Array.from(userCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ userId, userName, count }) => ({
      userId,
      userName,
      commentCount: count
    }))
}
