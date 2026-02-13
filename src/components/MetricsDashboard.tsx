import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { CheckCircle, Clock, Lightning, TrendUp, XCircle, ChartLine } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'

interface MetricsDashboardProps {
  incidents: Incident[]
}

export function MetricsDashboard({ incidents }: MetricsDashboardProps) {
  const metrics = useMemo(() => {
    const totalIncidents = incidents.length
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length
    const failedIncidents = incidents.filter(i => i.status === 'failed').length
    const pendingIncidents = incidents.filter(i => i.status === 'pending-approval').length
    const activeIncidents = incidents.filter(i => i.status === 'in-progress' || i.status === 'new').length

    const avgResolutionTime = incidents
      .filter(i => i.status === 'resolved' && i.metricsImpact)
      .reduce((acc, i) => acc + (i.metricsImpact?.timeToResolve || 0), 0) / (resolvedIncidents || 1)

    const totalStepsAutomated = incidents
      .filter(i => i.metricsImpact)
      .reduce((acc, i) => acc + (i.metricsImpact?.stepsAutomated || 0), 0)

    const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0
    
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length
    
    const avgConfidence = incidents
      .filter(i => i.lowestConfidence)
      .reduce((acc, i) => acc + (i.lowestConfidence || 0), 0) / (incidents.filter(i => i.lowestConfidence).length || 1)

    return {
      totalIncidents,
      resolvedIncidents,
      failedIncidents,
      pendingIncidents,
      activeIncidents,
      avgResolutionTime,
      totalStepsAutomated,
      resolutionRate,
      criticalIncidents,
      avgConfidence
    }
  }, [incidents])

  const metricCards = [
    {
      title: 'Total Incidents',
      value: metrics.totalIncidents,
      icon: ChartLine,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Resolved',
      value: metrics.resolvedIncidents,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: `${metrics.resolutionRate.toFixed(1)}% success rate`
    },
    {
      title: 'Active',
      value: metrics.activeIncidents,
      icon: Lightning,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    {
      title: 'Pending Approval',
      value: metrics.pendingIncidents,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Failed',
      value: metrics.failedIncidents,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Avg Resolution Time',
      value: `${Math.round(metrics.avgResolutionTime)}s`,
      icon: TrendUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: `${metrics.totalStepsAutomated} steps automated`
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricCards.map((metric, index) => (
        <Card key={index} className="p-4 border-border hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <metric.icon size={20} weight="duotone" className={metric.color} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold font-mono">{metric.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.title}</p>
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
