import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { At, Bell, Check, X } from '@phosphor-icons/react'
import { Comment, formatCommentTime } from '@/lib/incident-collaboration'

interface MentionNotification {
  id: string
  comment: Comment
  isRead: boolean
}

interface MentionsNotificationProps {
  mentions: Comment[]
  onMarkAsRead: (commentId: string) => void
  onViewComment: (comment: Comment) => void
  currentUserName: string
}

export function MentionsNotification({
  mentions,
  onMarkAsRead,
  onViewComment,
  currentUserName
}: MentionsNotificationProps) {
  const [notifications, setNotifications] = useState<MentionNotification[]>(
    mentions.map(comment => ({
      id: comment.id,
      comment,
      isRead: false
    }))
  )

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = (commentId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.comment.id === commentId ? { ...n, isRead: true } : n
      )
    )
    onMarkAsRead(commentId)
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    notifications.forEach(n => onMarkAsRead(n.comment.id))
  }

  const handleViewComment = (notification: MentionNotification) => {
    handleMarkAsRead(notification.comment.id)
    onViewComment(notification.comment)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg" className="relative">
          <Bell size={20} className="mr-2" weight="duotone" />
          Mentions
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 min-w-5 px-1 animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <At size={24} weight="duotone" className="text-primary" />
            Your Mentions
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `You have ${unreadCount} unread mention${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleMarkAllAsRead}
            >
              <Check size={16} className="mr-2" />
              Mark All as Read
            </Button>
          )}

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <At size={48} className="mx-auto mb-3 opacity-50 text-muted-foreground" weight="duotone" />
                <p className="text-muted-foreground">No mentions yet</p>
                <p className="text-sm text-muted-foreground">
                  You'll see mentions when team members use @{currentUserName}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 pr-4">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        !notification.isRead
                          ? 'border-primary bg-primary/5'
                          : 'bg-card'
                      }`}
                      onClick={() => handleViewComment(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={notification.comment.userAvatar} />
                            <AvatarFallback>
                              {notification.comment.userName
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {notification.comment.userName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCommentTime(notification.comment.timestamp)}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <Badge variant="default" className="shrink-0">
                                  New
                                </Badge>
                              )}
                            </div>

                            <p
                              className="text-sm leading-relaxed line-clamp-3"
                              dangerouslySetInnerHTML={{
                                __html: notification.comment.content.replace(
                                  new RegExp(`@${currentUserName}`, 'g'),
                                  `<span class="text-primary font-semibold bg-primary/10 px-1 rounded">@${currentUserName}</span>`
                                )
                              }}
                            />

                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.comment.id)
                                }}
                              >
                                <Check size={14} className="mr-1" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
