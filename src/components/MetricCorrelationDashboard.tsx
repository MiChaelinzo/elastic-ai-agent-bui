import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MetricCorrelationView } from '@/components/MetricCorrelationView'
import { ExternalMetricsChart } from '@/components/ExternalMetricsChart'
import { ChartLine, Lightning, Warning, CheckCircle, Download } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import type { ExternalMetric, MetricCorrelationAnalysis } from '@/lib/external-metrics'
import { generateCorrelationReport } from '@/lib/external-metrics'
import { toast } from 'sonner'

interface MetricCorrelationDashboardProps {
  isOpen: boolean
  onClose: () => void
  incident: Incident | null
  metrics: ExternalMetric[]
  analysis: MetricCorrelationAnalysis | null
}

export function MetricCorrelationDashboard({
  isOpen,
  onClose,
  incident,
  metrics,
  analysis
}: MetricCorrelationDashboardProps) {
  const [selectedMetricId, setSelectedMetricId] = useState<string>(metrics[0]?.id || '')
  
  const strongCorrelations = useMemo(() => 
    analysis?.correlations.filter(c => c.correlationScore >= 0.5) || [],
    [analysis]
  )
  
  const handleExportReport = () => {
    if (!analysis) return
    
    const report = generateCorrelationReport(analysis)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `correlation-report-${incident?.id}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Correlation report exported', {
      description: 'Report downloaded as Markdown file'
    })
  }
  
  if (!incident || !analysis) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChartLine size={28} weight="duotone" className="text-primary" />
            External Metric Correlation Analysis
          </DialogTitle>
          <DialogDescription>
            System metrics correlated with incident: {incident.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {analysis.multiMetricPattern && (
            <Alert className="border-warning bg-warning/10">
              <Lightning size={20} className="text-warning" />
              <AlertDescription>
                <div className="font-semibold mb-1">Multi-Metric Pattern Detected</div>
                <div className="text-sm">{analysis.multiMetricPattern}</div>
                <div className="mt-2 text-xs">
                  Overall Confidence: <strong>{analysis.overallConfidence}%</strong>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Metrics</CardDescription>
                <CardTitle className="text-3xl">{metrics.length}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Strong Correlations</CardDescription>
                <CardTitle className="text-3xl text-warning">{strongCorrelations.length}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Confidence Level</CardDescription>
                <CardTitle className="text-3xl text-primary">{analysis.overallConfidence}%</CardTitle>
              </CardHeader>
            </Card>
          </div>
          
          <Tabs defaultValue="correlations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="correlations">
                Correlations
                {strongCorrelations.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{strongCorrelations.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="charts">
                Metric Charts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="correlations" className="space-y-4">
              <MetricCorrelationView correlations={analysis.correlations} showAll />
              
              {analysis.strongestCorrelation && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightning size={24} weight="duotone" className="text-primary" />
                      Primary Root Cause Indicator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">
                          {analysis.strongestCorrelation.metricType.replace('_', ' ').toUpperCase()}
                        </div>
                        <Badge variant="destructive" className="text-lg px-4 py-1">
                          {(analysis.strongestCorrelation.correlationScore * 100).toFixed(0)}% Match
                        </Badge>
                      </div>
                      
                      <Alert>
                        <CheckCircle size={20} />
                        <AlertDescription>
                          {analysis.strongestCorrelation.suggestedCause}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <div className="text-sm text-muted-foreground">Detection Confidence</div>
                          <div className="text-2xl font-bold">{analysis.strongestCorrelation.confidence}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Statistical Deviation</div>
                          <div className="text-2xl font-bold">{analysis.strongestCorrelation.metricSnapshot.deviation.toFixed(1)}σ</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="charts" className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={selectedMetricId} onValueChange={setSelectedMetricId}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {metrics.map(metric => (
                      <SelectItem key={metric.id} value={metric.id}>
                        {metric.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-muted-foreground">
                  {metrics.length} metrics available
                </div>
              </div>
              
              <ExternalMetricsChart 
                metrics={metrics}
                selectedMetricId={selectedMetricId}
                incidentTime={incident.createdAt}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleExportReport}>
              <Download size={18} className="mr-2" />
              Export Report
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
