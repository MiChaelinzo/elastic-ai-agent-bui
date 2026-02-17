import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, Warning, CheckCircle, XCircle, Sparkle, ShieldWarning } from '@phosphor-icons/react'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/lib/types'
import { getTemplateById } from '@/lib/workflow-templates'
import { cn, formatDate } from '@/lib/utils'

const severityColors: Record<IncidentSeverity, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-blue-500 text-white',
  low: 'bg-muted text-muted-foreground'
}

const statusColors: Record<IncidentStatus, string> = {
  'new': 'bg-foreground/10 text-foreground',
  'in-progress': 'bg-primary text-primary-foreground',
  'resolved': 'bg-success text-success-foreground',
  'failed': 'bg-destructive text-destructive-foreground',
  'pending-approval': 'bg-warning text-warning-foreground'
}

const statusIcons: Record<IncidentStatus, React.ElementType> = {
  'new': Clock,
  'in-progress': Clock,
  'resolved': CheckCircle,
  'failed': XCircle,
  'pending-approval': Warning
}

interface IncidentCardProps {
  incident: Incident
  onClick?: () => void
  selected?: boolean
  onSelect?: (selected: boolean) => void
  selectionMode?: boolean
  metricCorrelationBadge?: React.ReactNode
  similarArticlesBadge?: React.ReactNode
}

export function IncidentCard({ incident, onClick, selected = false, onSelect, selectionMode = false, metricCorrelationBadge, similarArticlesBadge }: IncidentCardProps) {
  const StatusIcon = statusIcons[incident.status]
  const template = incident.templateId ? getTemplateById(incident.templateId) : null
  
  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.stopPropagation()
      onSelect(!selected)
    } else if (onClick) {
      onClick()
    }
  }
  
  return (
    <Card
      className={cn(
        'p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg border-l-4',
        incident.severity === 'critical' && 'border-l-destructive',
        incident.severity === 'high' && 'border-l-warning',
        incident.severity === 'medium' && 'border-l-blue-500',
        incident.severity === 'low' && 'border-l-muted-foreground',
        incident.status === 'in-progress' && 'animate-pulse-glow',
        selected && 'ring-2 ring-primary'
      )}
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {selectionMode && onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => {
                  onSelect(checked === true)
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{incident.title}</h3>
                {template && (
                  <Sparkle size={16} className="text-primary flex-shrink-0" weight="duotone" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {incident.description}
              </p>
            </div>
          </div>
          
          <Badge className={severityColors[incident.severity]}>
            {incident.severity}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusColors[incident.status]}>
            <StatusIcon size={14} className="mr-1" weight="bold" />
            {incident.status.replace('-', ' ')}
          </Badge>
          
          {incident.status === 'pending-approval' && incident.lowestConfidence !== undefined && (
            <Badge variant="outline" className="text-xs bg-warning/10 border-warning">
              <ShieldWarning size={12} className="mr-1" />
              {incident.lowestConfidence}% confidence
            </Badge>
          )}
          
          {template && (
            <Badge variant="outline" className="text-xs bg-primary/10">
              <Sparkle size={12} className="mr-1" />
              {template.name}
            </Badge>
          )}
          
          {incident.assignedAgents.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {incident.assignedAgents.length} agents active
            </Badge>
          )}
          
          {metricCorrelationBadge && metricCorrelationBadge}
          
          {similarArticlesBadge && similarArticlesBadge}
          
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDate(incident.createdAt)}
          </span>
        </div>
        
        {incident.metricsImpact && (
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Detected</div>
              <div className="text-sm font-mono font-semibold">
                {incident.metricsImpact.timeToDetect}s
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Resolved</div>
              <div className="text-sm font-mono font-semibold">
                {incident.metricsImpact.timeToResolve}s
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Steps</div>
              <div className="text-sm font-mono font-semibold">
                {incident.metricsImpact.stepsAutomated}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
