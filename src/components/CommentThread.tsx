import React, { useState } from 'react'
import { 
  PaperPlaneRight, 
  PencilSimple, 
  Trash, 
  ArrowBendUpLeft, 
  Smiley, 
  Lock, 
  Globe, 
  X
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Comment, ReactionType, CommentAttachment } from '@/lib/incident-collaboration'

interface CommentThreadProps {
  incidentId: string
  comments: Comment[]
  currentUser: {
    id: string
    name: string
    avatar: string
  }
  onAddComment: (content: string, mentions: string[], parentId?: string, isInternal?: boolean) => void
  onUpdateComment: (commentId: string, content: string, mentions: string[]) => void
  onDeleteComment: (commentId: string) => void
  onAddReaction: (commentId: string, reactionType: ReactionType) => void
  teamMembers?: Array<{ id: string; name: string; avatar: string }>
  allowInternal?: boolean
}

const reactionTypes: ReactionType[] = ['👍', '👎', '❤️', '🎉', '🚀', '👀', '⚠️', '✅']

export function CommentThread({
  incidentId,
  comments,
  currentUser,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddReaction,
  teamMembers = [],
  allowInternal = false
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')

  // --- Handlers ---

  const handleCommentChange = (text: string) => {
    setNewComment(text)
    
    // Simple mention detection logic
    const lastAtSymbol = text.lastIndexOf('@')
    if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || text[lastAtSymbol - 1] === ' ')) {
      const textAfterAt = text.slice(lastAtSymbol + 1)
      if (!textAfterAt.includes(' ')) {
        setShowMentionSuggestions(true)
        setMentionQuery(textAfterAt)
        return
      }
    }
    setShowMentionSuggestions(false)
  }

  const insertMention = (userName: string) => {
    const lastAtSymbol = newComment.lastIndexOf('@')
    const textBeforeAt = newComment.slice(0, lastAtSymbol)
    const newText = `${textBeforeAt}@${userName} `
    setNewComment(newText)
    setShowMentionSuggestions(false)
  }

  const handleSubmit = () => {
    if (!newComment.trim()) return
    
    // Extract mentions (simple regex)
    const mentions = (newComment.match(/@(\w+)/g) || []).map(m => m.substring(1))
    
    onAddComment(
      newComment, 
      mentions, 
      replyTo?.id, 
      allowInternal ? isInternal : false
    )
    
    setNewComment('')
    setReplyTo(null)
    setIsInternal(false)
  }

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = (commentId: string) => {
    // Extract mentions
    const mentions = (editContent.match(/@(\w+)/g) || []).map(m => m.substring(1))
    onUpdateComment(commentId, editContent, mentions)
    setEditingComment(null)
    setEditContent('')
  }

  const handleReply = (comment: Comment) => {
    setReplyTo(comment)
    // Optional: Focus textarea logic here
  }

  const formatCommentTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const filteredTeamMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // --- Render Single Comment ---

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingComment === comment.id
    const replies = comments.filter(c => c.parentCommentId === comment.id)
    const reactionSummary = comment.reactions || []

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-2' : 'border-b pb-4 last:border-0'}`}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>{comment.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{comment.userName}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.timestamp, { addSuffix: true })}</span>
              {comment.isInternal && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  <Lock size={10} className="mr-1" /> Internal
                </Badge>
              )}
            </div>
            
            {!isEditing && currentUser.id === comment.userId && (
              <div className="flex items-center">
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(comment)}>
                    <PencilSimple size={14} />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDeleteComment(comment.id)}>
                    <Trash size={14} />
                 </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>Cancel</Button>
                <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>Save</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Content with basic mention highlighting */}
              <div 
                className="text-sm text-foreground/90 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: comment.content.replace(
                    /@(\w+)/g,
                    '<span class="text-primary font-semibold">@$1</span>'
                  )
                }}
              />

              {/* Attachments Placeholder */}
              {comment.attachments && comment.attachments.length > 0 && (
                 <div className="mt-2 text-xs text-muted-foreground italic">
                    {comment.attachments.length} attachment(s)
                 </div>
              )}

              {/* Reactions & Reply Actions */}
              <div className="flex items-center gap-3 mt-2">
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground">
                      <Smiley size={14} className="mr-1" /> React
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="flex gap-1">
                      {reactionTypes.map(type => (
                        <Button
                          key={type}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onAddReaction(comment.id, type)}
                        >
                          <span className="text-lg">{type}</span>
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => handleReply(comment)}
                >
                  <ArrowBendUpLeft size={14} className="mr-1" /> Reply
                </Button>

                <div className="flex gap-1 ml-2">
                  {reactionSummary.length > 0 && (() => {
                    const grouped = reactionSummary.reduce((acc, reaction) => {
                      acc[reaction.type] = (acc[reaction.type] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    return Object.entries(grouped).map(([type, count]) => (
                      <Badge 
                        key={type} 
                        variant="secondary" 
                        className="px-1 py-0 h-5 cursor-pointer" 
                        onClick={() => onAddReaction(comment.id, type as ReactionType)}
                      >
                        {type} <span className="ml-1 text-[10px]">{count}</span>
                      </Badge>
                    ))
                  })()}
                </div>
              </div>
            </>
          )}

          {replies.length > 0 && (
            <div className="mt-2 pt-2 border-l-2 border-muted pl-2">
              {replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const topLevelComments = comments.filter(c => !c.parentCommentId)

  // --- Main Render Returns ---

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center justify-between text-base font-medium">
          Comments
          {allowInternal && (
            <Button
              size="sm"
              variant={isInternal ? "default" : "outline"}
              onClick={() => setIsInternal(!isInternal)}
              className="h-7 text-xs"
            >
              {isInternal ? (
                <>
                  <Lock size={14} className="mr-1.5" weight="fill" /> Internal Note
                </>
              ) : (
                <>
                  <Globe size={14} className="mr-1.5" weight="duotone" /> Public
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <Separator />

      <CardContent className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        
        {/* Scrollable Comments List */}
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4">
            {topLevelComments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs mt-1 opacity-70">Be the first to share your thoughts</p>
                </div>
            ) : (
                topLevelComments.map(comment => renderComment(comment))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="mt-auto space-y-3 pt-2">
          {replyTo && (
            <Alert className="py-2">
              <AlertDescription className="flex items-center justify-between text-xs">
                <span>
                   Replying to <span className="font-semibold">{replyTo.userName}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setReplyTo(null)
                    setNewComment('')
                  }}
                >
                  <X size={14} />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 relative">
                <Textarea
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder={replyTo ? "Write a reply..." : "Add a comment... (Use @ to mention)"}
                    className="min-h-[80px] resize-none text-sm"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
                    }}
                />
                
                {/* Mention Suggestion Popover */}
                {showMentionSuggestions && (
                    <Card className="absolute bottom-full mb-2 left-0 w-64 z-50 shadow-lg">
                        <CardContent className="p-1">
                            {filteredTeamMembers.length > 0 ? (
                                filteredTeamMembers.map(member => (
                                    <Button
                                        key={member.id}
                                        variant="ghost"
                                        className="w-full justify-start h-8 px-2"
                                        onClick={() => insertMention(member.name)}
                                    >
                                        <Avatar className="h-5 w-5 mr-2">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback className="text-[10px]">{member.name.substring(0,1)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm truncate">{member.name}</span>
                                    </Button>
                                ))
                            ) : (
                                <div className="p-2 text-xs text-muted-foreground text-center">No members found</div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Ctrl + Enter to send</span>
                    <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()}>
                        <PaperPlaneRight size={16} className="mr-2" weight="fill" />
                        {replyTo ? 'Reply' : 'Comment'}
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}