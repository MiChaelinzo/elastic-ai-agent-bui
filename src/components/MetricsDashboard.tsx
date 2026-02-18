import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { CheckCircle, Clock, Lightning, TrendUp, XCircle, ChartLine } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'

interface MetricsDashboardProps {
  incidents: Incident[]
}

export function MetricsDashboard({ incidents }: MetricsDashboardProps) {
  const [prevMetrics, setPrevMetrics] = useState<Record<string, number>>({})
  const [animatingMetrics, setAnimatingMetrics] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    const newAnimating = new Set<string>()
    
    if (prevMetrics.totalIncidents !== undefined && prevMetrics.totalIncidents !== metrics.totalIncidents) {
      newAnimating.add('totalIncidents')
    }
    if (prevMetrics.resolvedIncidents !== undefined && prevMetrics.resolvedIncidents !== metrics.resolvedIncidents) {
      newAnimating.add('resolvedIncidents')
    }
    if (prevMetrics.activeIncidents !== undefined && prevMetrics.activeIncidents !== metrics.activeIncidents) {
      newAnimating.add('activeIncidents')
    }
    if (prevMetrics.pendingIncidents !== undefined && prevMetrics.pendingIncidents !== metrics.pendingIncidents) {
      newAnimating.add('pendingIncidents')
    }
    if (prevMetrics.failedIncidents !== undefined && prevMetrics.failedIncidents !== metrics.failedIncidents) {
      newAnimating.add('failedIncidents')
    }
    
    if (newAnimating.size > 0) {
      setAnimatingMetrics(newAnimating)
      setTimeout(() => setAnimatingMetrics(new Set()), 1000)
    }
    
    setPrevMetrics({
      totalIncidents: metrics.totalIncidents,
      resolvedIncidents: metrics.resolvedIncidents,
      activeIncidents: metrics.activeIncidents,
      pendingIncidents: metrics.pendingIncidents,
      failedIncidents: metrics.failedIncidents
    })
  }, [metrics])

  const metricCards = [
    {
      id: 'totalIncidents',
      title: 'Total Incidents',
      value: metrics.totalIncidents,
      icon: ChartLine,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      id: 'resolvedIncidents',
      title: 'Resolved',
      value: metrics.resolvedIncidents,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
      subtitle: `${metrics.resolutionRate.toFixed(1)}% success rate`
    },
    {
      id: 'activeIncidents',
      title: 'Active',
      value: metrics.activeIncidents,
      icon: Lightning,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      pulse: metrics.activeIncidents > 0
    },
    {
      id: 'pendingIncidents',
      title: 'Pending Approval',
      value: metrics.pendingIncidents,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      pulse: metrics.pendingIncidents > 0
    },
    {
      id: 'failedIncidents',
      title: 'Failed',
      value: metrics.failedIncidents,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      id: 'avgResolutionTime',
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
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className={`p-4 border-border transition-all duration-300 ${
              animatingMetrics.has(metric.id) 
                ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                : 'hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.pulse ? 'animate-pulse' : ''}`}>
                <metric.icon size={20} weight="duotone" className={metric.color} />
              </div>
            </div>
            <div className="space-y-1">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${metric.id}-${metric.value}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold font-mono"
                >
                  {metric.value}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{metric.title}</p>
              {metric.subtitle && (
                <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
              )}
            </div>
            {animatingMetrics.has(metric.id) && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-lg" />
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
