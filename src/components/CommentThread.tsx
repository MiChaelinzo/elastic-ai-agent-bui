import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
  Lock,
  Paperclip,
} from '
  Comment,
  Reactio
  extrac
  getReactionSumma
import 
  Lock,
  Globe,
  Paperclip,
  X
} from '@phosphor-icons/react'
import {
  Comment,
  ReactionType,
  reactionTypes,
  extractMentions,
  formatCommentTime,
  getReactionSummary
} from '@/lib/incident-collaboration'
import { toast } from 'sonner'

interface CommentThreadProps {
  incidentId: string
  comments: Comment[]
  currentUser: {
    id: string
    name: string
    avatar: string
  o
  onAddComment: (content: string, mentions: string[], parentId?: string, isInternal?: boolean) => void
  onUpdateComment: (commentId: string, content: string, mentions: string[]) => void
  onDeleteComment: (commentId: string) => void
  onAddReaction: (commentId: string, reactionType: ReactionType) => void
  teamMembers?: Array<{ id: string; name: string; avatar: string }>
  allowInternal?: boolean
}

export function CommentThread({
    if (!edit
  comments,

  onAddComment,
    setEditContent
  onDeleteComment,
  const handleCa
  teamMembers = [],

}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')

  const handleSubmit = () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
  con

    const mentions = extractMentions(newComment)
    onAddComment(newComment, mentions, replyTo || undefined, isInternal)
    setNewComment('')
    setReplyTo(null)
    setIsInternal(false)
    

      toast.success(`Mentioned ${mentions.length} team member${mentions.length > 1 ? 's' : ''}`)
     
  }

  const handleEdit = (comment: Comment) => {
            <span className="font
    setEditContent(comment.content)
   

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
   

  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
   

  const handleDelete = (commentId: string) => {
    onDeleteComment(commentId)
    toast.success('Comment deleted')
  }

  const handleReply = (comment: Comment) => {
    setReplyTo(comment.id)
    setNewComment(`@${comment.userName} `)
  }

                        <Button
    setNewComment(text)
    
    const lastAtSymbol = text.lastIndexOf('@')
                        </Butt
      const textAfterAt = text.substring(lastAtSymbol + 1)
                </Popover>
        setMentionQuery(textAfterAt)
                    variant="ghost"
      } else {
                  >
      }
            
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
                        size="sm"
    const isOwner = comment.userId === currentUser.id
    const reactionSummary = getReactionSummary(comment.reactions)

            
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : ''}`}>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={comment.userAvatar} />
          <AvatarFallback>
            {comment.userName.substring(0, 2).toUpperCase()}
      </div>
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
          <Alert>
            )}
            {!comment.isInternal && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Globe size={12} weight="duotone" />
                Public
              </Badge>
            )}
              >

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                placeholder="Edit your comment..."
              />
              className="min-h-[100px] res
                <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                }
            />
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
              </Card>

              <File
                on
              />

              <div className="flex items-center gap-2">
                  variant="ghost"
                  onClick={() => setShowAttachments(!showA
                >
                  {showAttachments ? 'Hide' :
                    <Badge variant="sec
                    </Badge>
                </But
                  Pres
              </

              </Button>
          </div>

          <div className="text-center py-12 text-muted-foreground">
            <p>No comments yet</p>
          </div>
          <ScrollArea className="h-
              {comments.map(comment => (
                  {renderComment(comment)}
                </div>
            </div>
        )}
    </Card>
}






















                {isOwner && (









                    </Button>

                      variant="ghost"



                    >







              {reactionSummary.size > 0 && (







                        key={type}

                        size="sm"



                        <span className="text-base">{type}</span>





              )}

          )}





          )}

      </div>

  }



      <CardHeader>

          <span>Team Discussion ({comments.length})</span>

            <Button

              size="sm"

            >

                <>

                  Internal Only

              ) : (



                </>

            </Button>

        </CardTitle>



          <Alert>



                Replying to{' '}

                  {comments.find(c => c.id === replyTo)?.userName}

              </span>







              >



          </Alert>





            <AvatarFallback>

            </AvatarFallback>



            <Textarea





                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {

                }

            />

            {showMentionSuggestions && filteredTeamMembers.length > 0 && (















                        </Avatar>

                      </Button>

                  </div>

              </Card>





              </p>





          </div>





            <p>No comments yet</p>

          </div>







                </div>





    </Card>

}
