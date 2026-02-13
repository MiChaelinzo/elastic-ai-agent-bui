import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Clock, TrendUp, Warning, ChartLine, CheckCircle, Lightning, Calendar } from '@phosphor-icons/react'
import type { PredictiveInsight, IncidentPattern } from '@/lib/predictive-analytics'
import type { Incident } from '@/lib/types'

interface PredictiveInsightDetailProps {
  insight: PredictiveInsight | null
  pattern?: IncidentPattern
  relatedIncidents?: Incident[]
  isOpen: boolean
  onClose: () => void
  onCreatePreventiveAction?: (insight: PredictiveInsight) => void
}

export function PredictiveInsightDetail({
  insight,
  pattern,
  relatedIncidents = [],
  isOpen,
  onClose,
  onCreatePreventiveAction
}: PredictiveInsightDetailProps) {
  if (!insight) return null

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'forecast':
        return <Clock size={24} weight="duotone" className="text-primary" />
      case 'anomaly':
        return <Warning size={24} weight="duotone" className="text-warning" />
      case 'trend':
        return <TrendUp size={24} weight="duotone" className="text-accent" />
      case 'pattern':
        return <ChartLine size={24} weight="duotone" className="text-primary" />
    }
  }

  const getSeverityBadge = () => {
    const colors = {
      critical: 'bg-destructive/10 text-destructive border-destructive',
      high: 'bg-warning/10 text-warning border-warning',
      medium: 'bg-primary/10 text-primary border-primary',
      low: 'bg-muted text-muted-foreground'
    }

    return (
      <Badge variant="outline" className={colors[insight.severity]}>
        {insight.severity.toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatTimeUntil = (timestamp?: number) => {
    if (!timestamp) return null
    
    const diff = timestamp - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return 'Less than 1 hour'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {getTypeIcon()}
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{insight.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {getSeverityBadge()}
                <Badge variant="secondary">
                  {insight.confidence}% Confidence
                </Badge>
                <Badge variant="outline">
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          <DialogDescription className="text-base mt-4">
            {insight.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Prediction Confidence</div>
            <div className="flex items-center gap-3">
              <Progress value={insight.confidence} className="flex-1" />
              <span className="text-sm font-mono font-semibold">{insight.confidence}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {insight.confidence >= 85 ? 'Very High - Highly reliable prediction' :
               insight.confidence >= 70 ? 'High - Reliable prediction' :
               insight.confidence >= 55 ? 'Medium - Moderately reliable' :
               'Low - Use caution'}
            </p>
          </div>

          {insight.predictedTime && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar size={32} weight="duotone" className="text-primary" />
                  <div>
                    <div className="font-semibold">Predicted Occurrence</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(insight.predictedTime)}
                    </div>
                    <div className="text-sm font-medium text-primary mt-1">
                      Expected in approximately {formatTimeUntil(insight.predictedTime)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {pattern && (
            <div className="space-y-3">
              <div className="font-semibold flex items-center gap-2">
                <ChartLine size={20} weight="duotone" className="text-primary" />
                Pattern Analysis
              </div>
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Frequency</div>
                      <div className="text-lg font-semibold">{pattern.frequency} occurrences</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Average Interval</div>
                      <div className="text-lg font-semibold">
                        {Math.round(pattern.averageInterval / (1000 * 60 * 60))} hours
                      </div>
                    </div>
                    {pattern.seasonality && (
                      <>
                        <div>
                          <div className="text-sm text-muted-foreground">Seasonality</div>
                          <div className="text-lg font-semibold capitalize">{pattern.seasonality}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Last Occurrence</div>
                          <div className="text-sm">{formatDate(pattern.lastOccurrence)}</div>
                        </div>
                      </>
                    )}
                  </div>
                  {pattern.keywords.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground mb-2">Related Keywords</div>
                      <div className="flex flex-wrap gap-2">
                        {pattern.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {insight.actionable && insight.preventionSteps && insight.preventionSteps.length > 0 && (
            <div className="space-y-3">
              <div className="font-semibold flex items-center gap-2">
                <CheckCircle size={20} weight="duotone" className="text-accent" />
                Recommended Prevention Steps
              </div>
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    {insight.preventionSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {relatedIncidents.length > 0 && (
            <div className="space-y-3">
              <div className="font-semibold flex items-center gap-2">
                <Lightning size={20} weight="duotone" className="text-warning" />
                Related Historical Incidents
                <Badge variant="secondary" className="ml-auto">
                  {relatedIncidents.length}
                </Badge>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {relatedIncidents.slice(0, 5).map((incident, idx) => (
                      <div key={incident.id}>
                        {idx > 0 && <Separator className="my-2" />}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{incident.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(incident.createdAt)}
                            </div>
                          </div>
                          <Badge 
                            variant={incident.status === 'resolved' ? 'default' : 'secondary'}
                            className="flex-shrink-0"
                          >
                            {incident.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {relatedIncidents.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center pt-2">
                        And {relatedIncidents.length - 5} more...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {insight.actionable && onCreatePreventiveAction && (
            <Button onClick={() => onCreatePreventiveAction(insight)}>
              <Lightning size={18} className="mr-2" weight="bold" />
              Create Preventive Action
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
