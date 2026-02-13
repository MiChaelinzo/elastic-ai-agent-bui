import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Broadcast, ChartLine } from '@phosphor-icons/react'
import type { ExternalMetric } from '@/lib/external-metrics'
import { LiveMetricStream } from './LiveMetricStream'

interface LiveMetricWidgetProps {
  metrics: ExternalMetric[]
  isStreaming?: boolean
  onOpenFullDashboard?: () => void
  maxMetrics?: number
}

export function LiveMetricWidget({ 
  metrics, 
  isStreaming = false,
  onOpenFullDashboard,
  maxMetrics = 3
}: LiveMetricWidgetProps) {
  const displayMetrics = metrics.slice(0, maxMetrics)

  if (metrics.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Broadcast size={20} weight="duotone" className="text-primary" />
            Live Metric Streams
            {isStreaming && (
              <Badge variant="default" className="gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Active
              </Badge>
            )}
          </CardTitle>
          {onOpenFullDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFullDashboard}
            >
              <ChartLine size={16} className="mr-2" weight="duotone" />
              Full Dashboard
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayMetrics.map(metric => (
            <LiveMetricStream
              key={metric.id}
              metric={metric}
              isStreaming={isStreaming}
              compact={true}
            />
          ))}
        </div>
        {metrics.length > maxMetrics && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFullDashboard}
            >
              View all {metrics.length} metrics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
