import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ChatCircle,
  TrendUp,
  TrendDown,
  UserCircleGear,
  CheckCircle,
  At,
  Pulse
} from '@phosphor-icons/react'
import { IncidentActivity, formatCommentTime } from '@/lib/incident-collaboration'

interface ActivityFeedProps {
  activities: IncidentActivity[]
  maxItems?: number
}

export function ActivityFeed({ activities, maxItems }: ActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities

  const getActivityIcon = (type: IncidentActivity['type']) => {
    switch (type) {
      case 'comment':
        return <ChatCircle size={20} weight="duotone" className="text-primary" />
      case 'status_change':
        return <Pulse size={20} weight="duotone" className="text-accent" />
      case 'severity_change':
        return <TrendUp size={20} weight="duotone" className="text-warning" />
      case 'assignment':
        return <UserCircleGear size={20} weight="duotone" className="text-primary" />
      case 'resolution':
        return <CheckCircle size={20} weight="duotone" className="text-success" />
      case 'mention':
        return <At size={20} weight="duotone" className="text-accent" />
      default:
        return <Pulse size={20} weight="duotone" className="text-muted-foreground" />
    }
  }

  const getActivityColor = (type: IncidentActivity['type']) => {
    switch (type) {
      case 'comment':
        return 'border-l-primary'
      case 'status_change':
        return 'border-l-accent'
      case 'severity_change':
        return 'border-l-warning'
      case 'assignment':
        return 'border-l-primary'
      case 'resolution':
        return 'border-l-success'
      case 'mention':
        return 'border-l-accent'
      default:
        return 'border-l-muted'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pulse size={24} weight="duotone" className="text-primary" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Pulse size={48} className="mx-auto mb-3 opacity-50" weight="duotone" />
            <p>No activity yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {displayActivities.map((activity, index) => (
                <div key={activity.id}>
                  <div className={`flex gap-3 border-l-4 pl-4 ${getActivityColor(activity.type)}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={activity.userAvatar} />
                      <AvatarFallback>
                        {activity.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getActivityIcon(activity.type)}
                        <span className="font-semibold text-sm">{activity.userName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCommentTime(activity.timestamp)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>

                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-1">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < displayActivities.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
