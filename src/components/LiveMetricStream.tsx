import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, Pause, ArrowUp, ArrowDown, Minus, Warning, CheckCircle } from '@phosphor-icons/react'
import type { ExternalMetric, ExternalMetricType } from '@/lib/external-metrics'
import type { StreamingMetricUpdate } from '@/lib/metric-streaming'

interface LiveMetricStreamProps {
  metric: ExternalMetric
  onUpdate?: (update: StreamingMetricUpdate) => void
  isStreaming: boolean
  onToggleStream?: () => void
  compact?: boolean
}

export function LiveMetricStream({ 
  metric, 
  onUpdate, 
  isStreaming,
  onToggleStream,
  compact = false
}: LiveMetricStreamProps) {
  const [currentValue, setCurrentValue] = useState<number>(
    metric.dataPoints[metric.dataPoints.length - 1]?.value || 0
  )
  const [change, setChange] = useState<number>(0)
  const [trend, setTrend] = useState<'increasing' | 'decreasing' | 'stable'>('stable')
  const [anomaly, setAnomaly] = useState<boolean>(false)
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical' | undefined>()
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [updateCount, setUpdateCount] = useState<number>(0)
  const sparklineRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (metric.dataPoints.length > 0) {
      const latest = metric.dataPoints[metric.dataPoints.length - 1]
      setCurrentValue(latest.value)
      setLastUpdate(latest.timestamp)
    }
  }, [metric.dataPoints])

  useEffect(() => {
    if (!sparklineRef.current || metric.dataPoints.length < 2) return

    const canvas = sparklineRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, rect.width, rect.height)

    const dataPoints = metric.dataPoints.slice(-50)
    const values = dataPoints.map(p => p.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const width = rect.width
    const height = rect.height
    const padding = 5

    ctx.strokeStyle = anomaly 
      ? severity === 'critical' ? 'rgb(239, 68, 68)' 
      : severity === 'high' ? 'rgb(249, 115, 22)'
      : 'rgb(234, 179, 8)'
      : 'rgb(59, 130, 246)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, anomaly ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)')
    gradient.addColorStop(1, anomaly ? 'rgba(239, 68, 68, 0)' : 'rgba(59, 130, 246, 0)')

    ctx.beginPath()
    dataPoints.forEach((point, i) => {
      const x = padding + (i / (dataPoints.length - 1)) * (width - padding * 2)
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    const lastX = padding + (width - padding * 2)
    const lastY = height - padding - ((values[values.length - 1] - min) / range) * (height - padding * 2)
    
    ctx.lineTo(lastX, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    dataPoints.forEach((point, i) => {
      const x = padding + (i / (dataPoints.length - 1)) * (width - padding * 2)
      const y = height - padding - ((point.value - min) / range) * (height - padding * 2)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    if (metric.threshold) {
      if (metric.threshold.critical) {
        const criticalY = height - padding - ((metric.threshold.critical - min) / range) * (height - padding * 2)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(padding, criticalY)
        ctx.lineTo(width - padding, criticalY)
        ctx.stroke()
      }
      
      if (metric.threshold.warning) {
        const warningY = height - padding - ((metric.threshold.warning - min) / range) * (height - padding * 2)
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(padding, warningY)
        ctx.lineTo(width - padding, warningY)
        ctx.stroke()
      }
    }

    ctx.setLineDash([])
  }, [metric.dataPoints, anomaly, severity, metric.threshold])

  const handleUpdate = (update: StreamingMetricUpdate) => {
    setCurrentValue(update.value)
    setChange(update.change)
    setTrend(update.trend)
    setAnomaly(update.anomaly || false)
    setSeverity(update.severity)
    setLastUpdate(update.timestamp)
    setUpdateCount(prev => prev + 1)
    onUpdate?.(update)
  }

  useEffect(() => {
    if (isStreaming && onUpdate) {
      const interval = setInterval(() => {
        const lastPoint = metric.dataPoints[metric.dataPoints.length - 1]
        if (lastPoint && lastPoint.timestamp > lastUpdate) {
          const mockUpdate: StreamingMetricUpdate = {
            metricId: metric.id,
            metricType: metric.type,
            timestamp: lastPoint.timestamp,
            value: lastPoint.value,
            change: 0,
            trend: 'stable'
          }
          handleUpdate(mockUpdate)
        }
      }, 500)
      
      return () => clearInterval(interval)
    }
  }, [isStreaming, metric.dataPoints, lastUpdate])

  const getTrendIcon = () => {
    if (trend === 'increasing') return <ArrowUp size={16} weight="bold" className="text-warning" />
    if (trend === 'decreasing') return <ArrowDown size={16} weight="bold" className="text-success" />
    return <Minus size={16} weight="bold" className="text-muted-foreground" />
  }

  const getSeverityColor = () => {
    if (severity === 'critical') return 'bg-destructive text-destructive-foreground'
    if (severity === 'high') return 'bg-orange-500 text-white'
    if (severity === 'medium') return 'bg-yellow-500 text-white'
    return 'bg-blue-500 text-white'
  }

  const getThresholdPercentage = () => {
    if (!metric.threshold) return 0
    const max = metric.threshold.critical || metric.threshold.warning
    return Math.min((currentValue / max) * 100, 100)
  }

  const timeSinceUpdate = Math.floor((Date.now() - lastUpdate) / 1000)

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${anomaly ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">{metric.name}</span>
          </div>
          {anomaly && severity && (
            <Badge variant="destructive" className={getSeverityColor()}>
              {severity.toUpperCase()}
            </Badge>
          )}
        </div>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold">{currentValue.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">{metric.unit}</span>
          {getTrendIcon()}
          {change !== 0 && (
            <span className={`text-xs ${change > 0 ? 'text-warning' : 'text-success'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </div>

        <canvas 
          ref={sparklineRef}
          className="w-full h-12 rounded"
          style={{ width: '100%', height: '48px' }}
        />
      </div>
    )
  }

  return (
    <Card className={anomaly ? 'border-destructive' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isStreaming ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            <div>
              <CardTitle className="flex items-center gap-2">
                {metric.name}
                {anomaly && <Warning size={20} weight="fill" className="text-destructive" />}
              </CardTitle>
              <CardDescription>{metric.description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {severity && (
              <Badge className={getSeverityColor()}>
                {severity.toUpperCase()}
              </Badge>
            )}
            {onToggleStream && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleStream}
              >
                {isStreaming ? (
                  <>
                    <Pause size={16} className="mr-2" weight="fill" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-2" weight="fill" />
                    Resume
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {anomaly && (
          <Alert variant="destructive">
            <Warning size={20} />
            <AlertDescription>
              Anomaly detected! Metric value is outside normal range.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Value</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{currentValue.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">{metric.unit}</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-1">Change</div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-2xl font-bold ${change > 0 ? 'text-warning' : change < 0 ? 'text-success' : 'text-foreground'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {metric.threshold && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Threshold Progress</span>
              <span className="font-medium">{getThresholdPercentage().toFixed(0)}%</span>
            </div>
            <Progress 
              value={getThresholdPercentage()} 
              className={`h-2 ${currentValue >= (metric.threshold.critical || Infinity) ? 'bg-destructive' : currentValue >= (metric.threshold.warning || Infinity) ? 'bg-warning' : ''}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Warning: {metric.threshold.warning}</span>
              <span>Critical: {metric.threshold.critical}</span>
            </div>
          </div>
        )}

        <div>
          <div className="text-sm text-muted-foreground mb-2">Live Trend (Last 50 Updates)</div>
          <canvas 
            ref={sparklineRef}
            className="w-full h-24 rounded border border-border"
            style={{ width: '100%', height: '96px' }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <>
                <CheckCircle size={14} className="text-success" weight="fill" />
                <span>Streaming from {metric.source || 'Elasticsearch'}</span>
              </>
            ) : (
              <span>Stream paused</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Updates: {updateCount}</span>
            <span>Last: {timeSinceUpdate}s ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
