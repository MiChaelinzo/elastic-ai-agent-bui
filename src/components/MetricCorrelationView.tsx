import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartLine, Warning, CheckCircle, TrendUp, Lightning } from '@phosphor-icons/react'
import type { CorrelationResult } from '@/lib/external-metrics'

interface MetricCorrelationViewProps {
  correlations: CorrelationResult[]
  showAll?: boolean
}

const metricIcons: Record<string, any> = {
  cpu: '🖥️',
  memory: '💾',
  network: '🌐',
  disk: '💿',
  latency: '⏱️',
  error_rate: '❌'
}

const metricColors: Record<string, string> = {
  cpu: 'text-blue-600 dark:text-blue-400',
  memory: 'text-purple-600 dark:text-purple-400',
  network: 'text-green-600 dark:text-green-400',
  disk: 'text-orange-600 dark:text-orange-400',
  latency: 'text-yellow-600 dark:text-yellow-400',
  error_rate: 'text-red-600 dark:text-red-400'
}

export function MetricCorrelationView({ correlations, showAll = false }: MetricCorrelationViewProps) {
  const displayedCorrelations = showAll ? correlations : correlations.slice(0, 6)
  const strongCorrelations = correlations.filter(c => c.correlationScore >= 0.5)
  
  if (correlations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine size={24} weight="duotone" className="text-primary" />
            Metric Correlation
          </CardTitle>
          <CardDescription>
            External system metrics analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle size={20} className="text-muted-foreground" />
            <AlertDescription>
              No significant metric correlations detected. System metrics appear normal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine size={24} weight="duotone" className="text-primary" />
          Metric Correlation Analysis
          <Badge variant="secondary">{correlations.length} metrics</Badge>
        </CardTitle>
        <CardDescription>
          External system metrics correlated with incident timing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {strongCorrelations.length > 0 && (
          <Alert className="border-warning bg-warning/10">
            <Warning size={20} className="text-warning" />
            <AlertDescription>
              <strong>{strongCorrelations.length}</strong> metric{strongCorrelations.length !== 1 ? 's' : ''} show strong correlation with this incident
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {displayedCorrelations.map((corr) => (
            <div 
              key={corr.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{metricIcons[corr.metricType]}</span>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <span className={metricColors[corr.metricType]}>
                        {corr.metricType.replace('_', ' ').toUpperCase()}
                      </span>
                      {corr.correlationScore >= 0.7 && (
                        <Badge variant="destructive" className="text-xs">
                          High Correlation
                        </Badge>
                      )}
                      {corr.correlationScore >= 0.5 && corr.correlationScore < 0.7 && (
                        <Badge variant="default" className="text-xs bg-warning">
                          Medium Correlation
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {corr.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold">
                    {(corr.correlationScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {corr.confidence}% confidence
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <Progress 
                  value={corr.correlationScore * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Metric Value</div>
                  <div className="font-mono font-semibold">
                    {corr.metricSnapshot.value.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Deviation</div>
                  <div className="font-mono font-semibold">
                    {corr.metricSnapshot.deviation.toFixed(2)}σ
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  Suggested Cause
                </div>
                <p className="text-sm">{corr.suggestedCause}</p>
              </div>
              
              <div className="mt-2">
                <div className="text-xs text-muted-foreground">
                  Time offset: {Math.abs(Math.round(corr.timeOffset / 60000))} minutes from incident
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {!showAll && correlations.length > 6 && (
          <div className="text-center text-sm text-muted-foreground pt-2">
            Showing 6 of {correlations.length} correlated metrics
          </div>
        )}
      </CardContent>
    </Card>
  )
}
