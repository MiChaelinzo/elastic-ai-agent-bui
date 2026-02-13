import { Card } from '@/components/ui/card'
import { 
  ListBullets, 
  FireSimple, 
  ClockCountdown, 
  ArrowUp, 
  ShieldCheck,
  Hourglass
} from '@phosphor-icons/react'

interface QueueMetricsProps {
  totalInQueue: number
  criticalCount: number
  overdueCount: number
  escalatedCount: number
  awaitingApproval: number
  avgWaitTimeMinutes: number
}

export function QueueMetrics({
  totalInQueue,
  criticalCount,
  overdueCount,
  escalatedCount,
  awaitingApproval,
  avgWaitTimeMinutes
}: QueueMetricsProps) {
  const metrics = [
    {
      label: 'Total in Queue',
      value: totalInQueue,
      icon: ListBullets,
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    {
      label: 'Critical Priority',
      value: criticalCount,
      icon: FireSimple,
      color: 'text-destructive',
      bgColor: 'bg-destructive/20',
      pulse: criticalCount > 0
    },
    {
      label: 'SLA Breached',
      value: overdueCount,
      icon: ClockCountdown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/20',
      pulse: overdueCount > 0
    },
    {
      label: 'Auto-Escalated',
      value: escalatedCount,
      icon: ArrowUp,
      color: 'text-warning',
      bgColor: 'bg-warning/20'
    },
    {
      label: 'Need Approval',
      value: awaitingApproval,
      icon: ShieldCheck,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
      pulse: awaitingApproval > 0
    },
    {
      label: 'Avg Wait Time',
      value: `${avgWaitTimeMinutes}m`,
      icon: Hourglass,
      color: 'text-accent',
      bgColor: 'bg-accent/20'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <Card key={index} className={`p-4 relative ${metric.pulse ? 'animate-pulse-glow' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
                  {metric.label}
                </p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <Icon size={20} weight="duotone" className={metric.color} />
              </div>
            </div>
            {metric.pulse && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
            )}
          </Card>
        )
      })}
    </div>
  )
}
