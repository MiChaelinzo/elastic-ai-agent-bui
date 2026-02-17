import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChatCircle,
  ThumbsUp,
  Users,
  TrendUp
} from '@phosphor-icons/react'
import {
  Comment,
  getMostActiveUsers,
  getTotalReactionCount
} from '@/lib/incident-collaboration'

interface CollaborationStatsProps {
  comments: Comment[]
  incidentId?: string
}

export function CollaborationStats({ comments, incidentId }: CollaborationStatsProps) {
  const filteredComments = incidentId
    ? comments.filter(c => c.incidentId === incidentId)
    : comments

  const totalComments = filteredComments.length
  const totalReactions = getTotalReactionCount(filteredComments)
  const uniqueUsers = new Set(filteredComments.map(c => c.userId)).size
  const mostActiveUsers = getMostActiveUsers(filteredComments, 5)

  const internalComments = filteredComments.filter(c => c.isInternal).length
  const publicComments = filteredComments.filter(c => !c.isInternal).length
  const commentsWithReplies = filteredComments.filter(c => c.replies && c.replies.length > 0).length
  const averageRepliesPerComment = commentsWithReplies > 0
    ? filteredComments.reduce((sum, c) => sum + (c.replies?.length || 0), 0) / commentsWithReplies
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ChatCircle size={18} weight="duotone" className="text-primary" />
            Total Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalComments}</div>
          <div className="text-xs text-muted-foreground mt-2 flex gap-2">
            <Badge variant="outline" className="text-xs">
              {publicComments} public
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {internalComments} internal
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ThumbsUp size={18} weight="duotone" className="text-accent" />
            Total Reactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalReactions}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalComments > 0 ? (totalReactions / totalComments).toFixed(1) : 0} per comment
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users size={18} weight="duotone" className="text-primary" />
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{uniqueUsers}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalComments > 0 ? (totalComments / uniqueUsers).toFixed(1) : 0} comments per user
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendUp size={18} weight="duotone" className="text-accent" />
            Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {commentsWithReplies > 0 ? Math.round(averageRepliesPerComment * 10) / 10 : 0}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            avg replies per thread
          </p>
        </CardContent>
      </Card>

      {mostActiveUsers.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users size={20} weight="duotone" className="text-primary" />
              Most Active Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mostActiveUsers.map((user, index) => {
                const percentage = (user.commentCount / totalComments) * 100
                const userComments = filteredComments.filter(c => c.userId === user.userId)
                const userAvatar = userComments[0]?.userAvatar

                return (
                  <div key={user.userId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userAvatar} />
                          <AvatarFallback>
                            {user.userName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.commentCount} comment{user.commentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {Math.round(percentage)}%
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
