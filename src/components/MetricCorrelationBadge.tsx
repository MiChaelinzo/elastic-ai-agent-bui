import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChartLine } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import type { ExternalMetric } from '@/lib/external-metrics'
import { correlateIncidentWithMetrics } from '@/lib/external-metrics'

interface MetricCorrelationBadgeProps {
  incident: Incident
  metrics: ExternalMetric[]
  onClick: () => void
}

export function MetricCorrelationBadge({ incident, metrics, onClick }: MetricCorrelationBadgeProps) {
  if (metrics.length === 0) return null
  
  const correlations = correlateIncidentWithMetrics(incident, metrics)
  const strongCorrelations = correlations.filter(c => c.correlationScore >= 0.5)
  
  if (strongCorrelations.length === 0) return null
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="gap-2"
    >
      <ChartLine size={16} weight="duotone" />
      <span className="text-xs">
        {strongCorrelations.length} metric{strongCorrelations.length !== 1 ? 's' : ''} correlated
      </span>
      <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
        {Math.round(strongCorrelations[0].correlationScore * 100)}%
      </Badge>
    </Button>
  )
}
