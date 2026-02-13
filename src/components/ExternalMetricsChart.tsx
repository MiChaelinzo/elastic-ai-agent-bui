import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { ExternalMetric } from '@/lib/external-metrics'
import { ChartLine } from '@phosphor-icons/react'

interface ExternalMetricsChartProps {
  metrics: ExternalMetric[]
  selectedMetricId?: string
  incidentTime?: number
}

export function ExternalMetricsChart({ metrics, selectedMetricId, incidentTime }: ExternalMetricsChartProps) {
  const metric = selectedMetricId 
    ? metrics.find(m => m.id === selectedMetricId)
    : metrics[0]
  
  if (!metric) return null
  
  const chartData = metric.dataPoints.map(point => ({
    timestamp: new Date(point.timestamp).toLocaleTimeString(),
    value: parseFloat(point.value.toFixed(2)),
    fullTimestamp: point.timestamp
  }))
  
  const maxValue = Math.max(...metric.dataPoints.map(p => p.value))
  const minValue = Math.min(...metric.dataPoints.map(p => p.value))
  const avgValue = metric.dataPoints.reduce((sum, p) => sum + p.value, 0) / metric.dataPoints.length
  
  const metricColors: Record<string, string> = {
    cpu: '#3b82f6',
    memory: '#a855f7',
    network: '#22c55e',
    disk: '#f97316',
    latency: '#eab308',
    error_rate: '#ef4444'
  }
  
  const color = metricColors[metric.type] || '#3b82f6'
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChartLine size={24} weight="duotone" className="text-primary" />
              {metric.name}
            </CardTitle>
            <CardDescription>{metric.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{avgValue.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Average {metric.unit}</div>
          </div>
        </div>
        
        <div className="flex gap-4 pt-2">
          <div>
            <div className="text-xs text-muted-foreground">Min</div>
            <div className="text-sm font-semibold">{minValue.toFixed(1)} {metric.unit}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Max</div>
            <div className="text-sm font-semibold">{maxValue.toFixed(1)} {metric.unit}</div>
          </div>
          {metric.threshold && (
            <>
              <div>
                <div className="text-xs text-muted-foreground">Warning</div>
                <Badge variant="default" className="bg-warning">
                  {metric.threshold.warning} {metric.unit}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Critical</div>
                <Badge variant="destructive">
                  {metric.threshold.critical} {metric.unit}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: metric.unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend />
            
            {metric.threshold && (
              <>
                <ReferenceLine 
                  y={metric.threshold.warning} 
                  stroke="#eab308" 
                  strokeDasharray="3 3"
                  label={{ value: 'Warning', position: 'right', fill: '#eab308' }}
                />
                <ReferenceLine 
                  y={metric.threshold.critical} 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  label={{ value: 'Critical', position: 'right', fill: '#ef4444' }}
                />
              </>
            )}
            
            {incidentTime && (
              <ReferenceLine 
                x={chartData.find(d => Math.abs(d.fullTimestamp - incidentTime) < 120000)?.timestamp}
                stroke="#8b5cf6" 
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: 'Incident', position: 'top', fill: '#8b5cf6' }}
              />
            )}
            
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              strokeWidth={2}
              dot={false}
              name={metric.name}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {metric.source && (
          <div className="mt-4 text-xs text-muted-foreground">
            Data source: {metric.source}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
