import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  PaperPlaneRight,
  Pencil,
  Trash,
  ArrowBendUpLeft,
  User,
  Lock,
  Globe,
  Paperclip,
  X
} from '@phosphor-icons/react'
import {
  Comment,
  CommentAttachment,
  ReactionType,
  reactionTypes,
  extractMentions,
  formatCommentTime,
  getReactionSummary
} from '@/lib/incident-collaboration'
import { FileUploadZone } from '@/components/FileUploadZone'
import { AttachmentDisplay } from '@/components/AttachmentDisplay'
import { toast } from 'sonner'

interface CommentThreadProps {
  incidentId: string
  comments: Comment[]
  currentUser: {
    id: string
    name: string
    avatar: string
  }
  onAddComment: (content: string, mentions: string[], parentId?: string, isInternal?: boolean, attachments?: CommentAttachment[]) => void
  onUpdateComment: (commentId: string, content: string, mentions: string[]) => void
  onDeleteComment: (commentId: string) => void
  onAddReaction: (commentId: string, reactionType: ReactionType) => void
  teamMembers?: Array<{ id: string; name: string; avatar: string }>
  allowInternal?: boolean
}

export function CommentThread({
  incidentId,
  comments,
  currentUser,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onAddReaction,
  teamMembers = [],
  allowInternal = true
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [attachments, setAttachments] = useState<CommentAttachment[]>([])
  const [showAttachments, setShowAttachments] = useState(false)

  const handleSubmit = () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    const mentions = extractMentions(newComment)
    onAddComment(newComment, mentions, replyTo || undefined, isInternal, attachments.length > 0 ? attachments : undefined)
    setNewComment('')
    setReplyTo(null)
    setIsInternal(false)
    setAttachments([])
    setShowAttachments(false)
    
    if (mentions.length > 0) {
      toast.success(`Mentioned ${mentions.length} team member${mentions.length > 1 ? 's' : ''}`)
    }
  }

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    const mentions = extractMentions(editContent)
    onUpdateComment(commentId, editContent, mentions)
    setEditingComment(null)
    setEditContent('')
    toast.success('Comment updated')
  }

  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const handleDelete = (commentId: string) => {
    onDeleteComment(commentId)
    toast.success('Comment deleted')
  }

  const handleReply = (comment: Comment) => {
    setReplyTo(comment.id)
    setNewComment(`@${comment.userName} `)
  }

  const handleTextChange = (text: string) => {
    setNewComment(text)
    
    const lastAtSymbol = text.lastIndexOf('@')
    if (lastAtSymbol !== -1) {
      const textAfterAt = text.substring(lastAtSymbol + 1)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt)
        setShowMentionSuggestions(true)
      } else {
        setShowMentionSuggestions(false)
      }
    } else {
      setShowMentionSuggestions(false)
    }
  }

  const insertMention = (userName: string) => {
    const lastAtSymbol = newComment.lastIndexOf('@')
    const beforeMention = newComment.substring(0, lastAtSymbol)
    setNewComment(`${beforeMention}@${userName} `)
    setShowMentionSuggestions(false)
    setMentionQuery('')
  }

  const filteredTeamMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isEditing = editingComment === comment.id
    const isOwner = comment.userId === currentUser.id
    const reactionSummary = getReactionSummary(comment.reactions)

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>
            {comment.userName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{comment.userName}</span>
            <span className="text-xs text-muted-foreground">
              {formatCommentTime(comment.timestamp)}
            </span>
            {comment.isEdited && (
              <Badge variant="outline" className="text-xs">Edited</Badge>
            )}
            {comment.isInternal && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Lock size={12} weight="fill" />
                Internal
              </Badge>
            )}
            {!comment.isInternal && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Globe size={12} weight="duotone" />
                Public
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                placeholder="Edit your comment..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: comment.content.replace(
                    /@(\w+)/g,
                    '<span class="text-primary font-semibold cursor-pointer hover:underline">@$1</span>'
                  )
                }}
              />

              {comment.attachments && comment.attachments.length > 0 && (
                <AttachmentDisplay attachments={comment.attachments} compact />
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Add Reaction
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                      {reactionTypes.map(type => (
                        <Button
                          key={type}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                          onClick={() => onAddReaction(comment.id, type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {!isReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleReply(comment)}
                  >
                    <ArrowBendUpLeft size={14} className="mr-1" />
                    Reply
                  </Button>
                )}

                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleEdit(comment)}
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash size={14} className="mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>

              {reactionSummary.size > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {Array.from(reactionSummary.entries()).map(([type, count]) => {
                    const userReacted = comment.reactions.some(
                      r => r.type === type && r.userId === currentUser.id
                    )
                    return (
                      <Button
                        key={type}
                        variant={userReacted ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => onAddReaction(comment.id, type)}
                      >
                        <span className="text-base">{type}</span>
                        <span>{count}</span>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-3 pt-2">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Team Discussion ({comments.length})</span>
          {allowInternal && (
            <Button
              variant={isInternal ? "default" : "outline"}
              size="sm"
              onClick={() => setIsInternal(!isInternal)}
            >
              {isInternal ? (
                <>
                  <Lock size={16} className="mr-2" weight="fill" />
                  Internal Only
                </>
              ) : (
                <>
                  <Globe size={16} className="mr-2" weight="duotone" />
                  Public
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {replyTo && (
          <Alert>
            <ArrowBendUpLeft size={20} />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Replying to{' '}
                <strong>
                  {comments.find(c => c.id === replyTo)?.userName}
                </strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyTo(null)
                  setNewComment('')
                }}
              >
                <X size={16} />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2 relative">
            <Textarea
              value={newComment}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Add a comment... Use @ to mention team members"
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleSubmit()
                }
              }}
            />

            {showMentionSuggestions && filteredTeamMembers.length > 0 && (
              <Card className="absolute z-50 w-full max-w-xs shadow-lg">
                <ScrollArea className="max-h-48">
                  <div className="p-2 space-y-1">
                    {filteredTeamMembers.map(member => (
                      <Button
                        key={member.id}
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => insertMention(member.name)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {showAttachments && (
              <FileUploadZone
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                maxFiles={5}
              />
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="h-8"
                >
                  <Paperclip size={16} className="mr-2" weight="duotone" />
                  {showAttachments ? 'Hide' : 'Add'} Attachments
                  {attachments.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {attachments.length}
                    </Badge>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+Enter to post • Use @username to mention
                </p>
              </div>
              <Button onClick={handleSubmit} size="sm">
                <PaperPlaneRight size={16} className="mr-2" weight="fill" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User size={48} className="mx-auto mb-3 opacity-50" weight="duotone" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to start the discussion</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id}>
                  {renderComment(comment)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
