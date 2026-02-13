import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChartLine, Warning, CheckCircle, Brain, TrendUp } from '@phosphor-icons/react'
import type { AnomalyResult, AnomalyAlgorithm, TimeSeriesMetrics } from '@/lib/anomaly-detection'

interface AnomalyDashboardProps {
  anomalies: AnomalyResult[]
  metrics: TimeSeriesMetrics
  algorithm: AnomalyAlgorithm
  onAlgorithmChange?: (algorithm: AnomalyAlgorithm) => void
}

const algorithmInfo = {
  zscore: {
    name: 'Z-Score',
    description: 'Statistical method measuring standard deviations from mean',
    icon: ChartLine
  },
  iqr: {
    name: 'IQR',
    description: 'Interquartile Range - resistant to extreme outliers',
    icon: TrendUp
  },
  mad: {
    name: 'MAD',
    description: 'Median Absolute Deviation - robust to outliers',
    icon: TrendUp
  },
  isolation: {
    name: 'Isolation Forest',
    description: 'ML-based method isolating anomalous data points',
    icon: Brain
  },
  ensemble: {
    name: 'Ensemble',
    description: 'Combines multiple algorithms for highest accuracy',
    icon: Brain
  }
}

export function AnomalyDashboard({ anomalies, metrics, algorithm, onAlgorithmChange }: AnomalyDashboardProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')

  const stats = useMemo(() => {
    const detected = anomalies.filter(a => a.isAnomaly)
    return {
      total: anomalies.length,
      detected: detected.length,
      detectionRate: anomalies.length > 0 ? (detected.length / anomalies.length * 100) : 0,
      critical: detected.filter(a => a.severity === 'critical').length,
      high: detected.filter(a => a.severity === 'high').length,
      medium: detected.filter(a => a.severity === 'medium').length,
      low: detected.filter(a => a.severity === 'low').length,
      avgConfidence: detected.length > 0 
        ? detected.reduce((sum, a) => sum + a.confidence, 0) / detected.length 
        : 0
    }
  }, [anomalies])

  const filteredAnomalies = useMemo(() => {
    const detected = anomalies.filter(a => a.isAnomaly)
    if (selectedSeverity === 'all') return detected
    return detected.filter(a => a.severity === selectedSeverity)
  }, [anomalies, selectedSeverity])

  const AlgoIcon = algorithmInfo[algorithm].icon

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <AlgoIcon size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                ML-Powered Anomaly Detection
                {stats.critical > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {stats.critical} Critical
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {algorithmInfo[algorithm].description}
              </CardDescription>
            </div>
          </div>
          {onAlgorithmChange && (
            <Tabs value={algorithm} onValueChange={(v) => onAlgorithmChange(v as AnomalyAlgorithm)}>
              <TabsList>
                <TabsTrigger value="ensemble">Ensemble</TabsTrigger>
                <TabsTrigger value="zscore">Z-Score</TabsTrigger>
                <TabsTrigger value="iqr">IQR</TabsTrigger>
                <TabsTrigger value="mad">MAD</TabsTrigger>
                <TabsTrigger value="isolation">ML</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.detected}</div>
            <div className="text-sm text-muted-foreground">Anomalies Detected</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.detectionRate.toFixed(1)}% of data points
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.avgConfidence.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Avg Confidence</div>
            <div className="text-xs text-muted-foreground mt-1">
              Detection accuracy
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{metrics.mean.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Baseline Mean</div>
            <div className="text-xs text-muted-foreground mt-1">
              σ = {metrics.stdDev.toFixed(2)}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold capitalize">{metrics.trend}</div>
            <div className="text-sm text-muted-foreground">Trend Direction</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.seasonality ? 'Seasonal' : 'Non-seasonal'}
            </div>
          </div>
        </div>

        {(stats.critical > 0 || stats.high > 0) && (
          <Alert className="border-destructive">
            <Warning size={20} className="text-destructive" />
            <AlertDescription>
              <strong>Action Required:</strong> {stats.critical} critical and {stats.high} high severity anomalies detected. 
              Immediate investigation recommended.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter by Severity:</span>
          <Button
            variant={selectedSeverity === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSeverity('all')}
          >
            All ({stats.detected})
          </Button>
          {stats.critical > 0 && (
            <Button
              variant={selectedSeverity === 'critical' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('critical')}
            >
              Critical ({stats.critical})
            </Button>
          )}
          {stats.high > 0 && (
            <Button
              variant={selectedSeverity === 'high' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('high')}
            >
              High ({stats.high})
            </Button>
          )}
          {stats.medium > 0 && (
            <Button
              variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('medium')}
            >
              Medium ({stats.medium})
            </Button>
          )}
          {stats.low > 0 && (
            <Button
              variant={selectedSeverity === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('low')}
            >
              Low ({stats.low})
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {filteredAnomalies.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                {selectedSeverity === 'all' 
                  ? 'No anomalies detected. System metrics are within normal parameters.'
                  : `No ${selectedSeverity} severity anomalies detected.`}
              </AlertDescription>
            </Alert>
          ) : (
            filteredAnomalies.slice(0, 10).map((anomaly) => (
              <Card key={anomaly.id} className={`border-l-4 ${
                anomaly.severity === 'critical' ? 'border-l-destructive' :
                anomaly.severity === 'high' ? 'border-l-warning' :
                anomaly.severity === 'medium' ? 'border-l-primary' :
                'border-l-muted-foreground'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {new Date(anomaly.timestamp).toLocaleString()}
                        </CardTitle>
                        <Badge variant={
                          anomaly.severity === 'critical' ? 'destructive' :
                          anomaly.severity === 'high' ? 'destructive' :
                          'secondary'
                        }>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {anomaly.confidence}% confidence
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {anomaly.description}
                      </CardDescription>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold">{anomaly.value.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        Expected: {anomaly.expectedValue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {anomaly.detectionMethods.map((method, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {method}
                      </Badge>
                    ))}
                  </div>
                  {anomaly.suggestedActions.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      <div className="font-semibold">Suggested Actions:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {anomaly.suggestedActions.slice(0, 3).map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
          {filteredAnomalies.length > 10 && (
            <Alert>
              <AlertDescription>
                Showing 10 of {filteredAnomalies.length} anomalies. Adjust filters or export data for full analysis.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
