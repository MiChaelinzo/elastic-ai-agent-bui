import type { Incident } from './types'
import type { AnomalyResult, MetricDataPoint } from './anomaly-detection'

export type ExternalMetricType = 'cpu' | 'memory' | 'network' | 'disk' | 'latency' | 'error_rate'

export interface ExternalMetric {
  id: string
  type: ExternalMetricType
  name: string
  unit: string
  description: string
  dataPoints: MetricDataPoint[]
  threshold?: {
    warning: number
    critical: number
  }
  source?: string
}

export interface CorrelationResult {
  id: string
  metricType: ExternalMetricType
  incidentId: string
  correlationScore: number
  timeOffset: number
  confidence: number
  description: string
  metricSnapshot: {
    value: number
    timestamp: number
    deviation: number
  }
  suggestedCause: string
}

export interface MetricCorrelationAnalysis {
  incident: Incident
  correlations: CorrelationResult[]
  strongestCorrelation?: CorrelationResult
  multiMetricPattern?: string
  overallConfidence: number
}

export function generateMockExternalMetrics(
  startTime: number,
  endTime: number,
  intervalMs: number = 60000
): ExternalMetric[] {
  const metrics: ExternalMetric[] = []
  
  metrics.push({
    id: 'cpu-usage',
    type: 'cpu',
    name: 'CPU Usage',
    unit: '%',
    description: 'Average CPU utilization across all nodes',
    threshold: { warning: 70, critical: 90 },
    source: 'Elastic Agent - System Integration',
    dataPoints: generateMetricDataPoints(startTime, endTime, intervalMs, {
      baseline: 45,
      variance: 15,
      spikes: true,
      spikeIntensity: 30
    })
  })
  
  metrics.push({
    id: 'memory-usage',
    type: 'memory',
    name: 'Memory Usage',
    unit: '%',
    description: 'Average memory utilization across all nodes',
    threshold: { warning: 80, critical: 95 },
    source: 'Elastic Agent - System Integration',
    dataPoints: generateMetricDataPoints(startTime, endTime, intervalMs, {
      baseline: 65,
      variance: 10,
      spikes: true,
      spikeIntensity: 20
    })
  })
  
  metrics.push({
    id: 'network-throughput',
    type: 'network',
    name: 'Network Throughput',
    unit: 'Mbps',
    description: 'Network data transfer rate',
    threshold: { warning: 800, critical: 950 },
    source: 'Elastic Agent - Network Integration',
    dataPoints: generateMetricDataPoints(startTime, endTime, intervalMs, {
      baseline: 450,
      variance: 150,
      spikes: true,
      spikeIntensity: 300
    })
  })
  
  metrics.push({
    id: 'disk-io',
    type: 'disk',
    name: 'Disk I/O',
    unit: 'IOPS',
    description: 'Disk input/output operations per second',
    threshold: { warning: 5000, critical: 8000 },
    source: 'Elastic Agent - System Integration',
    dataPoints: generateMetricDataPoints(startTime, endTime, intervalMs, {
      baseline: 2500,
      variance: 800,
      spikes: true,
      spikeIntensity: 2000
    })
  })
  
  metrics.push({
    id: 'api-latency',
    type: 'latency',
    name: 'API Response Latency',
    unit: 'ms',
    description: 'Average API response time',
    threshold: { warning: 500, critical: 1000 },
    source: 'Elastic APM',
    dataPoints: generateMetricDataPoints(startTime, endTime, intervalMs, {
      baseline: 180,
      variance: 80,
      spikes: true,
      spikeIntensity: 400
    })
  })
  
  metrics.push({
    id: 'error-rate',
    type: 'error_rate',
    name: 'Error Rate',
    unit: 'errors/min',
    description: 'Application error rate per minute',
    threshold: { warning: 10, critical: 50 },
    source: 'Elastic APM',
    dataPoints: generateMetricDataPoints(startTime, endTime, intervalMs, {
      baseline: 2,
      variance: 3,
      spikes: true,
      spikeIntensity: 30
    })
  })
  
  return metrics
}

interface MetricGenerationOptions {
  baseline: number
  variance: number
  spikes: boolean
  spikeIntensity: number
  trend?: 'increasing' | 'decreasing' | 'stable'
}

function generateMetricDataPoints(
  startTime: number,
  endTime: number,
  intervalMs: number,
  options: MetricGenerationOptions
): MetricDataPoint[] {
  const dataPoints: MetricDataPoint[] = []
  const { baseline, variance, spikes, spikeIntensity, trend = 'stable' } = options
  
  let currentBaseline = baseline
  const trendRate = trend === 'increasing' ? 0.002 : trend === 'decreasing' ? -0.002 : 0
  
  for (let time = startTime; time <= endTime; time += intervalMs) {
    let value = currentBaseline + (Math.random() - 0.5) * variance * 2
    
    if (spikes && Math.random() < 0.08) {
      value += (Math.random() - 0.3) * spikeIntensity
    }
    
    value = Math.max(0, value)
    
    dataPoints.push({
      timestamp: time,
      value,
      label: new Date(time).toISOString()
    })
    
    currentBaseline += currentBaseline * trendRate
  }
  
  return dataPoints
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0
  
  const n = x.length
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX
    const diffY = y[i] - meanY
    numerator += diffX * diffY
    sumSqX += diffX * diffX
    sumSqY += diffY * diffY
  }
  
  const denominator = Math.sqrt(sumSqX * sumSqY)
  
  if (denominator === 0) return 0
  
  return numerator / denominator
}

export function correlateIncidentWithMetrics(
  incident: Incident,
  metrics: ExternalMetric[],
  timeWindowMs: number = 1800000
): CorrelationResult[] {
  const correlations: CorrelationResult[] = []
  const incidentTime = incident.createdAt
  
  metrics.forEach(metric => {
    const relevantPoints = metric.dataPoints.filter(
      point => Math.abs(point.timestamp - incidentTime) <= timeWindowMs
    )
    
    if (relevantPoints.length < 3) return
    
    const closestPoint = relevantPoints.reduce((closest, point) => {
      return Math.abs(point.timestamp - incidentTime) < Math.abs(closest.timestamp - incidentTime)
        ? point
        : closest
    })
    
    const allValues = metric.dataPoints.map(p => p.value)
    const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length
    const stdDev = Math.sqrt(
      allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length
    )
    
    const deviation = stdDev > 0 ? Math.abs((closestPoint.value - mean) / stdDev) : 0
    
    const beforeIncident = metric.dataPoints.filter(
      p => p.timestamp < incidentTime && p.timestamp >= incidentTime - timeWindowMs
    )
    const afterIncident = metric.dataPoints.filter(
      p => p.timestamp >= incidentTime && p.timestamp <= incidentTime + timeWindowMs
    )
    
    if (beforeIncident.length < 2 || afterIncident.length < 2) return
    
    const beforeValues = beforeIncident.map(p => p.value)
    const afterValues = afterIncident.map(p => p.value)
    const beforeMean = beforeValues.reduce((a, b) => a + b, 0) / beforeValues.length
    const afterMean = afterValues.reduce((a, b) => a + b, 0) / afterValues.length
    
    const changeRatio = beforeMean > 0 ? Math.abs((afterMean - beforeMean) / beforeMean) : 0
    
    let correlationScore = 0
    
    correlationScore += Math.min(deviation / 3, 0.35)
    
    correlationScore += Math.min(changeRatio, 0.35)
    
    const timeOffset = Math.abs(closestPoint.timestamp - incidentTime)
    const proximityScore = Math.max(0, 1 - (timeOffset / timeWindowMs)) * 0.3
    correlationScore += proximityScore
    
    correlationScore = Math.min(correlationScore, 1)
    
    const confidence = Math.round(correlationScore * 85 + 10)
    
    const suggestedCause = generateSuggestedCause(metric, deviation, changeRatio, incident.severity)
    
    correlations.push({
      id: `corr-${incident.id}-${metric.id}`,
      metricType: metric.type,
      incidentId: incident.id,
      correlationScore,
      timeOffset,
      confidence,
      description: `${metric.name} showed ${deviation.toFixed(2)}σ deviation at incident time`,
      metricSnapshot: {
        value: closestPoint.value,
        timestamp: closestPoint.timestamp,
        deviation
      },
      suggestedCause
    })
  })
  
  return correlations.sort((a, b) => b.correlationScore - a.correlationScore)
}

function generateSuggestedCause(
  metric: ExternalMetric,
  deviation: number,
  changeRatio: number,
  severity: string
): string {
  const causes: Record<ExternalMetricType, string[]> = {
    cpu: [
      'CPU spike due to runaway process or inefficient code execution',
      'Resource contention from multiple competing processes',
      'Insufficient CPU capacity for current workload',
      'Background job or scheduled task consuming excessive CPU'
    ],
    memory: [
      'Memory leak in application code causing gradual exhaustion',
      'Insufficient memory allocation for workload demands',
      'Memory pressure from cache or buffer growth',
      'Large object allocation or data structure expansion'
    ],
    network: [
      'Network congestion or bandwidth saturation',
      'DDoS attack or abnormal traffic patterns',
      'Network configuration change or routing issue',
      'Increased API traffic or data transfer volume'
    ],
    disk: [
      'Disk I/O bottleneck from heavy read/write operations',
      'Storage capacity approaching limit',
      'Slow disk response times or hardware degradation',
      'Database query load or log file growth'
    ],
    latency: [
      'Backend service degradation or third-party API slowdown',
      'Database query performance issues',
      'Network latency or connection timeout issues',
      'Resource exhaustion affecting response times'
    ],
    error_rate: [
      'Application bug or code regression introduced',
      'External dependency failure or API timeout',
      'Invalid input data or malformed requests',
      'Configuration error or deployment issue'
    ]
  }
  
  const possibleCauses = causes[metric.type] || ['Unknown correlation factor']
  
  if (deviation > 3 && changeRatio > 0.5) {
    return possibleCauses[0]
  } else if (deviation > 2) {
    return possibleCauses[1]
  } else if (changeRatio > 0.3) {
    return possibleCauses[2]
  } else {
    return possibleCauses[3] || possibleCauses[0]
  }
}

export function analyzeMultiMetricCorrelation(
  incident: Incident,
  correlations: CorrelationResult[]
): MetricCorrelationAnalysis {
  const strongCorrelations = correlations.filter(c => c.correlationScore >= 0.5)
  const strongestCorrelation = correlations.length > 0 ? correlations[0] : undefined
  
  let multiMetricPattern: string | undefined
  let overallConfidence = 0
  
  if (strongCorrelations.length >= 3) {
    const types = strongCorrelations.map(c => c.metricType)
    
    if (types.includes('cpu') && types.includes('memory')) {
      multiMetricPattern = 'Resource Exhaustion Pattern: CPU and Memory spikes suggest application performance degradation or resource leak'
    } else if (types.includes('latency') && types.includes('error_rate')) {
      multiMetricPattern = 'Service Degradation Pattern: High latency with increased errors indicates backend service failure or overload'
    } else if (types.includes('network') && types.includes('latency')) {
      multiMetricPattern = 'Network Bottleneck Pattern: Network congestion affecting service response times'
    } else if (types.includes('disk') && types.includes('latency')) {
      multiMetricPattern = 'I/O Bottleneck Pattern: Disk performance issues causing application slowdown'
    } else {
      multiMetricPattern = `Complex Pattern: Multiple metrics (${types.join(', ')}) correlated - investigate system-wide issue`
    }
    
    overallConfidence = Math.round(
      strongCorrelations.reduce((sum, c) => sum + c.confidence, 0) / strongCorrelations.length
    )
  } else if (strongCorrelations.length > 0) {
    overallConfidence = strongestCorrelation?.confidence || 0
  }
  
  return {
    incident,
    correlations,
    strongestCorrelation,
    multiMetricPattern,
    overallConfidence
  }
}

export function detectAnomaliesInExternalMetrics(
  metrics: ExternalMetric[]
): Map<string, AnomalyResult[]> {
  const anomalyMap = new Map<string, AnomalyResult[]>()
  
  metrics.forEach(metric => {
    const anomalies: AnomalyResult[] = []
    const values = metric.dataPoints.map(p => p.value)
    
    if (values.length === 0) return
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )
    
    metric.dataPoints.forEach((point, index) => {
      const zScore = stdDev > 0 ? Math.abs((point.value - mean) / stdDev) : 0
      const isAnomaly = zScore > 2.5
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
      
      if (metric.threshold) {
        if (point.value >= metric.threshold.critical) {
          severity = 'critical'
        } else if (point.value >= metric.threshold.warning) {
          severity = 'high'
        } else if (isAnomaly && zScore > 3) {
          severity = 'medium'
        }
      } else {
        if (zScore > 4) severity = 'critical'
        else if (zScore > 3) severity = 'high'
        else if (zScore > 2.5) severity = 'medium'
      }
      
      if (isAnomaly || (metric.threshold && point.value >= metric.threshold.warning)) {
        anomalies.push({
          id: `${metric.id}-anomaly-${index}`,
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: mean,
          deviation: zScore,
          isAnomaly: true,
          severity,
          confidence: Math.min(95, Math.round(zScore * 30 + 20)),
          algorithm: 'zscore',
          detectionMethods: ['Z-Score with Threshold'],
          description: `${metric.name} at ${point.value.toFixed(2)} ${metric.unit} (${zScore.toFixed(2)}σ from mean)`,
          suggestedActions: [
            `Check ${metric.name.toLowerCase()} for resource constraints`,
            'Review recent deployments or configuration changes',
            'Investigate correlating metrics and incidents',
            severity === 'critical' ? 'Immediate action required - system at risk' : 'Monitor for escalation'
          ]
        })
      }
    })
    
    if (anomalies.length > 0) {
      anomalyMap.set(metric.id, anomalies)
    }
  })
  
  return anomalyMap
}

export function generateCorrelationReport(analysis: MetricCorrelationAnalysis): string {
  let report = `# Incident Correlation Analysis\n\n`
  report += `**Incident**: ${analysis.incident.title}\n`
  report += `**Time**: ${new Date(analysis.incident.createdAt).toLocaleString()}\n`
  report += `**Severity**: ${analysis.incident.severity}\n\n`
  
  report += `## Correlation Summary\n\n`
  report += `- **Metrics Analyzed**: ${analysis.correlations.length}\n`
  report += `- **Strong Correlations**: ${analysis.correlations.filter(c => c.correlationScore >= 0.5).length}\n`
  report += `- **Overall Confidence**: ${analysis.overallConfidence}%\n\n`
  
  if (analysis.multiMetricPattern) {
    report += `## Multi-Metric Pattern Detected\n\n`
    report += `${analysis.multiMetricPattern}\n\n`
  }
  
  if (analysis.strongestCorrelation) {
    const corr = analysis.strongestCorrelation
    report += `## Strongest Correlation\n\n`
    report += `- **Metric**: ${corr.metricType}\n`
    report += `- **Correlation Score**: ${(corr.correlationScore * 100).toFixed(1)}%\n`
    report += `- **Confidence**: ${corr.confidence}%\n`
    report += `- **Time Offset**: ${Math.round(corr.timeOffset / 60000)} minutes\n`
    report += `- **Suggested Cause**: ${corr.suggestedCause}\n\n`
  }
  
  report += `## All Correlations\n\n`
  analysis.correlations.slice(0, 10).forEach(corr => {
    report += `### ${corr.metricType.toUpperCase()}\n`
    report += `- Score: ${(corr.correlationScore * 100).toFixed(1)}%\n`
    report += `- ${corr.description}\n`
    report += `- Cause: ${corr.suggestedCause}\n\n`
  })
  
  return report
}
