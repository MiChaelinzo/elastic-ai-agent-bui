export interface Comment {
  id: string
  incidentId: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  createdAt: number
  updatedAt: number
  mentions: string[]
  reactions: CommentReaction[]
  isEdited: boolean
  parentId?: string
  replies: Comment[]
}

export interface CommentReaction {
  emoji: string
  userId: string
  userName: string
}

export interface Mention {
  userId: string
  userName: string
  position: number
  length: number
}

export function createComment(
  incidentId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorAvatar?: string,
  parentId?: string
): Comment {
  const mentions = extractMentions(content)

  return {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    incidentId,
    content,
    authorId,
    authorName,
    authorAvatar,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    mentions,
    reactions: [],
    isEdited: false,
    parentId,
    replies: []
  }
}

export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

export function highlightMentions(content: string): string {
  return content.replace(/@(\w+)/g, '<span class="text-primary font-semibold">@$1</span>')
}

export function addReaction(comments: Comment[], commentId: string, emoji: string, userId: string, userName: string): Comment[] {
  return comments.map(comment => {
    if (comment.id === commentId) {
      const existingReaction = comment.reactions.find(r => r.emoji === emoji && r.userId === userId)
      
      if (existingReaction) {
        return {
          ...comment,
          reactions: comment.reactions.filter(r => !(r.emoji === emoji && r.userId === userId))
        }
      } else {
        return {
          ...comment,
          reactions: [...comment.reactions, { emoji, userId, userName }]
        }
      }
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReaction(comment.replies, commentId, emoji, userId, userName) as Comment[]
      }
    }

    return comment
  })
}

export function editComment(comments: Comment[], commentId: string, newContent: string): Comment[] {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return {
        ...comment,
        content: newContent,
        mentions: extractMentions(newContent),
        updatedAt: Date.now(),
        isEdited: true
      }
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: editComment(comment.replies, commentId, newContent) as Comment[]
      }
    }

    return comment
  })
}

export function deleteComment(comments: Comment[], commentId: string): Comment[] {
  return comments.filter(comment => {
    if (comment.id === commentId) {
      return false
    }

    if (comment.replies.length > 0) {
      comment.replies = deleteComment(comment.replies, commentId) as Comment[]
    }

    return true
  })
}

export function organizeCommentThreads(comments: Comment[]): Comment[] {
  const topLevel = comments.filter(c => !c.parentId)
  const replies = comments.filter(c => c.parentId)

  const organized = topLevel.map(parent => {
    const parentReplies = replies.filter(r => r.parentId === parent.id)
    return {
      ...parent,
      replies: parentReplies.sort((a, b) => a.createdAt - b.createdAt)
    }
  })

  return organized.sort((a, b) => b.createdAt - a.createdAt)
}

export function getCommentCount(comments: Comment[]): number {
  return comments.reduce((count, comment) => {
    return count + 1 + comment.replies.length
  }, 0)
}

export function getReactionSummary(reactions: CommentReaction[]): Array<{ emoji: string; count: number; users: string[] }> {
  const summary = new Map<string, { count: number; users: string[] }>()

  reactions.forEach(reaction => {
    const existing = summary.get(reaction.emoji)
    if (existing) {
      existing.count++
      existing.users.push(reaction.userName)
    } else {
      summary.set(reaction.emoji, { count: 1, users: [reaction.userName] })
    }
  })

  return Array.from(summary.entries())
    .map(([emoji, data]) => ({ emoji, ...data }))
    .sort((a, b) => b.count - a.count)
}
