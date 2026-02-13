import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Pause, 
  Broadcast, 
  ChartLine, 
  TrendUp, 
  Warning,
  CheckCircle,
  Lightning,
  Database
} from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import type { ExternalMetric, CorrelationResult } from '@/lib/external-metrics'
import type { StreamingMetricUpdate, LiveCorrelationUpdate, MetricStreamConfig } from '@/lib/metric-streaming'
import { metricStreamingService, createDefaultStreamConfigs, generateElasticsearchQuery, generateESQLQuery } from '@/lib/metric-streaming'
import { LiveMetricStream } from './LiveMetricStream'

interface LiveCorrelationDashboardProps {
  isOpen: boolean
  onClose: () => void
  incident: Incident | null
  metrics: ExternalMetric[]
}

export function LiveCorrelationDashboard({
  isOpen,
  onClose,
  incident,
  metrics
}: LiveCorrelationDashboardProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamConfigs, setStreamConfigs] = useState<MetricStreamConfig[]>([])
  const [liveCorrelations, setLiveCorrelations] = useState<CorrelationResult[]>([])
  const [recentUpdates, setRecentUpdates] = useState<StreamingMetricUpdate[]>([])
  const [anomalyCount, setAnomalyCount] = useState(0)
  const [correlationHistory, setCorrelationHistory] = useState<LiveCorrelationUpdate[]>([])
  const [selectedMetricForQuery, setSelectedMetricForQuery] = useState<MetricStreamConfig | null>(null)
  const [activeStreams, setActiveStreams] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (metrics.length > 0 && streamConfigs.length === 0) {
      const configs = createDefaultStreamConfigs(metrics)
      setStreamConfigs(configs)
    }
  }, [metrics])

  useEffect(() => {
    if (!isOpen || !isStreaming || !incident) return

    metricStreamingService.trackIncident(incident)

    const unsubscribeCorrelations = metricStreamingService.subscribeToCorrelations((update) => {
      if (update.incidentId === incident.id) {
        setLiveCorrelations(update.correlations)
        setCorrelationHistory(prev => [update, ...prev.slice(0, 49)])
      }
    })

    const unsubscribers = streamConfigs.map(config => {
      return metricStreamingService.subscribeToMetric(config.metricId, (update) => {
        setRecentUpdates(prev => [update, ...prev.slice(0, 99)])
        
        if (update.anomaly) {
          setAnomalyCount(prev => prev + 1)
        }

        setActiveStreams(prev => new Set(prev).add(config.metricId))
      })
    })

    return () => {
      unsubscribeCorrelations()
      unsubscribers.forEach(unsub => unsub())
      if (incident) {
        metricStreamingService.untrackIncident(incident.id)
      }
    }
  }, [isOpen, isStreaming, incident, streamConfigs])

  const handleStartStreaming = () => {
    if (metrics.length === 0 || streamConfigs.length === 0) return
    
    metricStreamingService.startStreaming(metrics, streamConfigs)
    setIsStreaming(true)
    setRecentUpdates([])
    setAnomalyCount(0)
    setCorrelationHistory([])
  }

  const handleStopStreaming = () => {
    metricStreamingService.stopStreaming()
    setIsStreaming(false)
    setActiveStreams(new Set())
  }

  const handleToggleMetricStream = (metricId: string) => {
    const config = streamConfigs.find(c => c.metricId === metricId)
    if (!config) return

    if (activeStreams.has(metricId)) {
      metricStreamingService.pauseStream(metricId)
      setActiveStreams(prev => {
        const next = new Set(prev)
        next.delete(metricId)
        return next
      })
    } else {
      metricStreamingService.resumeStream(config)
      setActiveStreams(prev => new Set(prev).add(metricId))
    }
  }

  const topCorrelations = liveCorrelations.slice(0, 5)
  const recentAnomalies = recentUpdates.filter(u => u.anomaly).slice(0, 10)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Broadcast size={24} weight="duotone" className="text-primary" />
                Live Metric Streaming & Correlation Analysis
              </DialogTitle>
              <DialogDescription>
                Real-time metric data from Elasticsearch with live correlation analysis
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isStreaming ? "default" : "secondary"} className="gap-2">
                <div className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                {isStreaming ? 'Streaming' : 'Stopped'}
              </Badge>
              <Button
                onClick={isStreaming ? handleStopStreaming : handleStartStreaming}
                variant={isStreaming ? "destructive" : "default"}
                size="lg"
              >
                {isStreaming ? (
                  <>
                    <Pause size={18} className="mr-2" weight="fill" />
                    Stop All Streams
                  </>
                ) : (
                  <>
                    <Play size={18} className="mr-2" weight="fill" />
                    Start Streaming
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="streams" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="streams" className="gap-2">
              <Broadcast size={18} weight="duotone" />
              Live Streams
            </TabsTrigger>
            <TabsTrigger value="correlations" className="gap-2">
              <ChartLine size={18} weight="duotone" />
              Correlations
              {liveCorrelations.length > 0 && (
                <Badge variant="secondary">{liveCorrelations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="gap-2">
              <Warning size={18} weight="duotone" />
              Anomalies
              {anomalyCount > 0 && (
                <Badge variant="destructive">{anomalyCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="queries" className="gap-2">
              <Database size={18} weight="duotone" />
              ES Queries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="streams" className="flex-1 overflow-hidden mt-4">
            {!isStreaming && (
              <Alert className="mb-4">
                <Lightning size={20} />
                <AlertDescription>
                  Click "Start Streaming" to begin receiving real-time metric data from Elasticsearch
                </AlertDescription>
              </Alert>
            )}
            
            <ScrollArea className="h-[calc(95vh-280px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                {metrics.map(metric => (
                  <LiveMetricStream
                    key={metric.id}
                    metric={metric}
                    isStreaming={activeStreams.has(metric.id)}
                    onToggleStream={() => handleToggleMetricStream(metric.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="correlations" className="flex-1 overflow-hidden mt-4">
            {!incident ? (
              <Alert>
                <AlertDescription>
                  Select an incident to view live correlation analysis
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4 h-[calc(95vh-280px)] overflow-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tracking Incident</CardTitle>
                    <CardDescription>{incident.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">
                        Severity: {incident.severity.toUpperCase()}
                      </Badge>
                      <span className="text-muted-foreground">
                        Created: {new Date(incident.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {topCorrelations.length === 0 ? (
                  <Alert>
                    <CheckCircle size={20} />
                    <AlertDescription>
                      {isStreaming 
                        ? 'Waiting for correlation data...' 
                        : 'Start streaming to see live correlations'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      {topCorrelations.map((corr, index) => (
                        <Card key={corr.id} className={index === 0 ? 'border-primary' : ''}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                {index === 0 && <TrendUp size={20} weight="duotone" className="text-primary" />}
                                {corr.metricType.toUpperCase()}
                                {index === 0 && <Badge variant="default">Strongest</Badge>}
                              </CardTitle>
                              <Badge variant="secondary">
                                {(corr.correlationScore * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            <CardDescription>{corr.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Confidence</span>
                                <span className="font-medium">{corr.confidence}%</span>
                              </div>
                              <Progress value={corr.confidence} className="h-2" />
                            </div>
                            
                            <div className="text-sm">
                              <div className="text-muted-foreground mb-1">Suggested Cause</div>
                              <div>{corr.suggestedCause}</div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                              <div>
                                <div className="text-muted-foreground">Value</div>
                                <div className="font-mono">{corr.metricSnapshot.value.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Deviation</div>
                                <div className="font-mono">{corr.metricSnapshot.deviation.toFixed(2)}σ</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Time Offset</div>
                                <div className="font-mono">{Math.round(corr.timeOffset / 60000)}m</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {correlationHistory.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Correlation Update History</CardTitle>
                          <CardDescription>
                            Last {correlationHistory.length} correlation updates
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-64">
                            <div className="space-y-2 pr-4">
                              {correlationHistory.map((update, index) => (
                                <div 
                                  key={`${update.timestamp}-${index}`}
                                  className="flex items-center justify-between text-sm p-2 rounded border border-border"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{update.correlations.length}</Badge>
                                    <span className="text-muted-foreground">
                                      {new Date(update.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {update.newAnomalies.length > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {update.newAnomalies.length} anomalies
                                      </Badge>
                                    )}
                                    {update.changedMetrics.length > 0 && (
                                      <span className="text-xs text-muted-foreground">
                                        {update.changedMetrics.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="anomalies" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[calc(95vh-280px)]">
              <div className="space-y-3 pr-4">
                {recentAnomalies.length === 0 ? (
                  <Alert>
                    <CheckCircle size={20} />
                    <AlertDescription>
                      No anomalies detected yet
                    </AlertDescription>
                  </Alert>
                ) : (
                  recentAnomalies.map((update, index) => (
                    <Card 
                      key={`${update.timestamp}-${index}`}
                      className="border-destructive"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Warning size={18} weight="fill" className="text-destructive" />
                            {update.metricType.toUpperCase()}
                          </CardTitle>
                          <Badge variant="destructive">
                            {update.severity?.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Value</div>
                            <div className="font-mono font-bold">{update.value.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Change</div>
                            <div className={`font-mono ${update.change > 0 ? 'text-destructive' : 'text-success'}`}>
                              {update.change > 0 ? '+' : ''}{update.change.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">Time</div>
                            <div className="text-xs">{new Date(update.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="queries" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4 h-[calc(95vh-280px)] overflow-auto">
              <Alert>
                <Database size={20} />
                <AlertDescription>
                  These are the Elasticsearch queries being executed for each metric stream
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                {streamConfigs.map(config => (
                  <Card key={config.metricId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{config.metricType.toUpperCase()}</CardTitle>
                          <CardDescription>
                            Index: {config.elasticsearchQuery.index} | Interval: {config.elasticsearchQuery.interval}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMetricForQuery(
                            selectedMetricForQuery?.metricId === config.metricId ? null : config
                          )}
                        >
                          {selectedMetricForQuery?.metricId === config.metricId ? 'Hide' : 'View'} Queries
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {selectedMetricForQuery?.metricId === config.metricId && (
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Standard Query API</div>
                          <pre className="p-3 rounded bg-muted text-xs overflow-x-auto">
                            <code>{generateElasticsearchQuery(config)}</code>
                          </pre>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">ES|QL Query</div>
                          <pre className="p-3 rounded bg-muted text-xs overflow-x-auto">
                            <code>{generateESQLQuery(config)}</code>
                          </pre>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
