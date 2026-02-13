import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ListBullets, 
  Clock, 
  ArrowUp, 
  Warning, 
  Lightning,
  ChartBar,
  Hourglass
} from '@phosphor-icons/react'
import type { PriorityQueueItem } from '@/lib/priority-queue'
import { getEstimatedWaitTime } from '@/lib/priority-queue'
import type { IncidentSeverity } from '@/lib/types'

interface PriorityQueueDisplayProps {
  queue: PriorityQueueItem[]
  onSelectIncident: (incidentId: string) => void
}

const severityColors: Record<IncidentSeverity, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-primary text-primary-foreground',
  low: 'bg-muted text-muted-foreground'
}

function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimeUntil(timestamp: number): string {
  const minutes = Math.floor((timestamp - Date.now()) / (1000 * 60))
  if (minutes < 0) return 'Overdue'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function getSLAProgress(item: PriorityQueueItem): number {
  if (!item.slaDeadline) return 0
  
  const total = item.slaDeadline - item.incident.createdAt
  const elapsed = Date.now() - item.incident.createdAt
  const progress = (elapsed / total) * 100
  
  return Math.min(progress, 100)
}

export function PriorityQueueDisplay({ queue, onSelectIncident }: PriorityQueueDisplayProps) {
  if (queue.length === 0) {
    return (
      <Alert>
        <ListBullets size={20} />
        <AlertDescription>
          Priority queue is empty. All incidents are being processed or resolved.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {queue.map((item, index) => {
        const position = index + 1
        const estimatedWait = getEstimatedWaitTime(position)
        const slaProgress = getSLAProgress(item)
        const slaWarning = slaProgress > 80
        
        return (
          <Card 
            key={item.incident.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary relative ${
              item.isOverdue ? 'border-destructive border-2' : ''
            }`}
            onClick={() => onSelectIncident(item.incident.id)}
          >
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{
              background: item.isOverdue 
                ? 'var(--color-destructive)' 
                : `hsl(${120 - slaProgress * 1.2}, 70%, 50%)`
            }} />
            
            <div className="flex items-start justify-between gap-4 pl-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary font-bold shrink-0">
                    #{position}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-base truncate">
                        {item.incident.title}
                      </h3>
                      <Badge className={severityColors[item.incident.severity]}>
                        {item.incident.severity.toUpperCase()}
                      </Badge>
                      
                      {item.escalationCount > 0 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <ArrowUp size={12} weight="bold" />
                          Escalated {item.escalationCount}x
                        </Badge>
                      )}
                      
                      {item.isOverdue && (
                        <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                          <Warning size={12} weight="fill" />
                          SLA Breach
                        </Badge>
                      )}
                      
                      {item.incident.status === 'pending-approval' && (
                        <Badge variant="outline" className="border-warning text-warning">
                          Awaiting Approval
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.incident.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock size={16} />
                    <span>Queued {formatTimeAgo(item.queuedAt)}</span>
                  </div>
                  
                  {estimatedWait > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Hourglass size={16} />
                      <span>~{estimatedWait}m wait</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5">
                    <Lightning size={16} weight="fill" />
                    <span>Priority: {item.priority}</span>
                  </div>
                </div>

                {item.slaDeadline && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={slaWarning ? 'text-warning font-medium' : 'text-muted-foreground'}>
                        SLA Deadline
                      </span>
                      <span className={`font-mono font-semibold ${
                        item.isOverdue ? 'text-destructive' : slaWarning ? 'text-warning' : 'text-muted-foreground'
                      }`}>
                        {formatTimeUntil(item.slaDeadline)}
                      </span>
                    </div>
                    <Progress 
                      value={slaProgress} 
                      className={`h-1.5 ${
                        item.isOverdue ? '[&>div]:bg-destructive' : slaWarning ? '[&>div]:bg-warning' : ''
                      }`}
                    />
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant={position === 1 ? 'default' : 'outline'}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectIncident(item.incident.id)
                }}
              >
                {position === 1 ? (
                  <>
                    <Lightning size={16} className="mr-1" weight="bold" />
                    Process Now
                  </>
                ) : (
                  'View'
                )}
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
