import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { ChartLineUp, TrendUp } from '@phosphor-icons/react'
import type { AnomalyResult, TimeSeriesMetrics } from '@/lib/anomaly-detection'

interface AnomalyVisualizationProps {
  anomalies: AnomalyResult[]
  metrics: TimeSeriesMetrics
}

export function AnomalyVisualization({ anomalies, metrics }: AnomalyVisualizationProps) {
  const chartData = useMemo(() => {
    return anomalies.map((anomaly, index) => ({
      index,
      timestamp: new Date(anomaly.timestamp).toLocaleDateString(),
      time: new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: Number(anomaly.value.toFixed(2)),
      expected: Number(anomaly.expectedValue.toFixed(2)),
      mean: Number(metrics.mean.toFixed(2)),
      upperBound: Number((metrics.mean + metrics.stdDev * 2).toFixed(2)),
      lowerBound: Number((metrics.mean - metrics.stdDev * 2).toFixed(2)),
      isAnomaly: anomaly.isAnomaly,
      severity: anomaly.severity,
      confidence: anomaly.confidence
    }))
  }, [anomalies, metrics])

  const anomalyPoints = useMemo(() => {
    return chartData.filter(d => d.isAnomaly)
  }, [chartData])

  const severityDistribution = useMemo(() => {
    const dist = anomalies
      .filter(a => a.isAnomaly)
      .reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    return [
      { severity: 'Critical', count: dist.critical || 0, fill: 'hsl(var(--destructive))' },
      { severity: 'High', count: dist.high || 0, fill: 'hsl(var(--warning))' },
      { severity: 'Medium', count: dist.medium || 0, fill: 'hsl(var(--primary))' },
      { severity: 'Low', count: dist.low || 0, fill: 'hsl(var(--muted-foreground))' }
    ].filter(d => d.count > 0)
  }, [anomalies])

  const confidenceDistribution = useMemo(() => {
    const buckets = { '0-25': 0, '25-50': 0, '50-75': 0, '75-90': 0, '90-100': 0 }
    anomalies.filter(a => a.isAnomaly).forEach(a => {
      if (a.confidence < 25) buckets['0-25']++
      else if (a.confidence < 50) buckets['25-50']++
      else if (a.confidence < 75) buckets['50-75']++
      else if (a.confidence < 90) buckets['75-90']++
      else buckets['90-100']++
    })
    
    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
      fill: 'hsl(var(--primary))'
    }))
  }, [anomalies])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <div className="text-sm font-semibold mb-2">{data.timestamp} {data.time}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Actual:</span>
            <span className="font-mono font-semibold">{data.value}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Expected:</span>
            <span className="font-mono">{data.expected}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Mean:</span>
            <span className="font-mono">{data.mean}</span>
          </div>
          {data.isAnomaly && (
            <>
              <div className="border-t pt-1 mt-1">
                <Badge variant="destructive" className="text-xs">
                  {data.severity.toUpperCase()} ANOMALY
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-mono">{data.confidence}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <ChartLineUp size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle>Time Series Analysis</CardTitle>
              <CardDescription>
                Metric values over time with anomaly detection bands
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="index" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <ReferenceLine 
                y={metrics.mean} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5" 
                label="Mean"
              />
              <ReferenceLine 
                y={metrics.mean + metrics.stdDev * 2} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="3 3" 
                label="+2σ"
              />
              <ReferenceLine 
                y={metrics.mean - metrics.stdDev * 2} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="3 3" 
                label="-2σ"
              />
              
              <Area
                type="monotone"
                dataKey="upperBound"
                fill="hsl(var(--warning) / 0.1)"
                stroke="none"
                name="Normal Range"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                fill="hsl(var(--warning) / 0.1)"
                stroke="none"
              />
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (!payload.isAnomaly) return <circle cx={cx} cy={cy} r={0} />
                  
                  const color = 
                    payload.severity === 'critical' ? 'hsl(var(--destructive))' :
                    payload.severity === 'high' ? 'hsl(var(--warning))' :
                    payload.severity === 'medium' ? 'hsl(var(--primary))' :
                    'hsl(var(--muted-foreground))'
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  )
                }}
                name="Actual Value"
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Expected Value"
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {anomalyPoints.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-semibold mb-2">Anomaly Legend:</div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span>Critical / High Severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Medium Severity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span>Low Severity</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendUp size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle>Severity Distribution</CardTitle>
                <CardDescription>Anomalies by severity level</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="severity" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendUp size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle>Confidence Distribution</CardTitle>
                <CardDescription>Detection confidence ranges</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Confidence %', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
