import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Comment } from '@/lib/collaboration'
import { createComment, organizeCommentThreads, getReactionSummary, highlightMentions } from '@/lib/collaboration'
import { ChatCircle, PaperPlaneRight, Smiley, ArrowBendUpLeft, DotsThree } from '@phosphor-icons/react'
import { formatDate } from '@/lib/utils'

interface CollaborationPanelProps {
  incidentId: string
  comments: Comment[]
  onAddComment: (comment: Comment) => void
  onAddReaction: (commentId: string, emoji: string) => void
  currentUser: { id: string; name: string; avatar?: string }
}

export function CollaborationPanel({ 
  incidentId, 
  comments, 
  onAddComment, 
  onAddReaction,
  currentUser 
}: CollaborationPanelProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const organizedComments = organizeCommentThreads(comments.filter(c => c.incidentId === incidentId))

  const handleSubmit = () => {
    if (!newComment.trim()) return

    const comment = createComment(
      incidentId,
      newComment,
      currentUser.id,
      currentUser.name,
      currentUser.avatar,
      replyingTo || undefined
    )

    onAddComment(comment)
    setNewComment('')
    setReplyingTo(null)
  }

  const handleReaction = (commentId: string, emoji: string) => {
    onAddReaction(commentId, emoji)
  }

  const commonEmojis = ['👍', '❤️', '🎉', '👀', '🚀', '✅']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChatCircle size={24} weight="duotone" className="text-primary" />
          Team Collaboration
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
        <CardDescription>
          Discuss and collaborate on this incident with your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {replyingTo && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">Replying to a comment</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              {currentUser.avatar && <AvatarImage src={currentUser.avatar} />}
              <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Add a comment... Use @username to mention teammates"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit()
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Use @username to mention • Cmd+Enter to submit
                </p>
                <Button 
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <PaperPlaneRight size={16} weight="bold" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          {organizedComments.length === 0 ? (
            <Alert>
              <ChatCircle size={20} />
              <AlertDescription>
                No comments yet. Be the first to start the discussion!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {organizedComments.map(comment => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  onReply={setReplyingTo}
                  onReaction={handleReaction}
                  commonEmojis={commonEmojis}
                  currentUserId={currentUser.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface CommentThreadProps {
  comment: Comment
  onReply: (commentId: string) => void
  onReaction: (commentId: string, emoji: string) => void
  commonEmojis: string[]
  currentUserId: string
}

function CommentThread({ comment, onReply, onReaction, commonEmojis, currentUserId }: CommentThreadProps) {
  const [showReactions, setShowReactions] = useState(false)
  const reactionSummary = getReactionSummary(comment.reactions)

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          {comment.authorAvatar && <AvatarImage src={comment.authorAvatar} />}
          <AvatarFallback>{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                  {comment.isEdited && (
                    <Badge variant="outline" className="text-xs">
                      edited
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <DotsThree size={16} weight="bold" />
              </Button>
            </div>

            <div 
              className="text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
            />

            {comment.mentions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {comment.mentions.map(mention => (
                  <Badge key={mention} variant="secondary" className="text-xs">
                    @{mention}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs flex items-center gap-1"
                onClick={() => setShowReactions(!showReactions)}
              >
                <Smiley size={14} weight="duotone" />
                React
              </Button>
              
              {showReactions && (
                <div className="absolute top-full left-0 mt-1 p-2 rounded-lg border bg-popover shadow-lg z-10 flex gap-1">
                  {commonEmojis.map(emoji => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                      onClick={() => {
                        onReaction(comment.id, emoji)
                        setShowReactions(false)
                      }}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs flex items-center gap-1"
              onClick={() => onReply(comment.id)}
            >
              <ArrowBendUpLeft size={14} weight="duotone" />
              Reply
            </Button>

            {reactionSummary.length > 0 && (
              <div className="flex gap-1 ml-2">
                {reactionSummary.map(reaction => (
                  <Button
                    key={reaction.emoji}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs flex items-center gap-1"
                    onClick={() => onReaction(comment.id, reaction.emoji)}
                    title={reaction.users.join(', ')}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-muted-foreground">{reaction.count}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {comment.replies.length > 0 && (
            <div className="ml-4 space-y-3 border-l-2 border-border pl-4 mt-3">
              {comment.replies.map(reply => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onReaction={onReaction}
                  commonEmojis={commonEmojis}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
