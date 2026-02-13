import type { ExternalMetric, ExternalMetricType, CorrelationResult } from './external-metrics'
import type { MetricDataPoint } from './anomaly-detection'
import type { Incident } from './types'
import { correlateIncidentWithMetrics } from './external-metrics'

export interface StreamingMetricUpdate {
  metricId: string
  metricType: ExternalMetricType
  timestamp: number
  value: number
  change: number
  trend: 'increasing' | 'decreasing' | 'stable'
  anomaly?: boolean
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface LiveCorrelationUpdate {
  incidentId: string
  timestamp: number
  correlations: CorrelationResult[]
  changedMetrics: string[]
  newAnomalies: string[]
  confidenceChange: number
}

export interface ElasticsearchQueryConfig {
  index: string
  interval: string
  aggregation: string
  field: string
}

export interface MetricStreamConfig {
  metricId: string
  metricType: ExternalMetricType
  elasticsearchQuery: ElasticsearchQueryConfig
  updateIntervalMs: number
  enabled: boolean
}

export type StreamUpdateCallback = (update: StreamingMetricUpdate) => void
export type CorrelationUpdateCallback = (update: LiveCorrelationUpdate) => void

class MetricStreamingService {
  private streams: Map<string, NodeJS.Timeout> = new Map()
  private metrics: Map<string, ExternalMetric> = new Map()
  private subscribers: Map<string, Set<StreamUpdateCallback>> = new Map()
  private correlationSubscribers: Set<CorrelationUpdateCallback> = new Set()
  private activeIncidents: Map<string, Incident> = new Map()
  private lastCorrelationUpdate: Map<string, number> = new Map()
  private isRunning: boolean = false

  startStreaming(metrics: ExternalMetric[], configs: MetricStreamConfig[]) {
    this.isRunning = true
    
    metrics.forEach(metric => {
      this.metrics.set(metric.id, metric)
    })

    configs.forEach(config => {
      if (config.enabled && !this.streams.has(config.metricId)) {
        this.startMetricStream(config)
      }
    })
  }

  stopStreaming() {
    this.isRunning = false
    this.streams.forEach(interval => clearInterval(interval))
    this.streams.clear()
  }

  pauseStream(metricId: string) {
    const interval = this.streams.get(metricId)
    if (interval) {
      clearInterval(interval)
      this.streams.delete(metricId)
    }
  }

  resumeStream(config: MetricStreamConfig) {
    if (config.enabled && !this.streams.has(config.metricId)) {
      this.startMetricStream(config)
    }
  }

  private startMetricStream(config: MetricStreamConfig) {
    const metric = this.metrics.get(config.metricId)
    if (!metric) return

    const interval = setInterval(() => {
      if (!this.isRunning) return

      const update = this.generateMetricUpdate(metric, config)
      
      metric.dataPoints.push({
        timestamp: update.timestamp,
        value: update.value,
        label: new Date(update.timestamp).toISOString()
      })

      if (metric.dataPoints.length > 1000) {
        metric.dataPoints.shift()
      }

      this.notifySubscribers(config.metricId, update)

      if (update.anomaly || update.severity === 'critical' || update.severity === 'high') {
        this.checkIncidentCorrelations(update)
      }
    }, config.updateIntervalMs)

    this.streams.set(config.metricId, interval)
  }

  private generateMetricUpdate(
    metric: ExternalMetric, 
    config: MetricStreamConfig
  ): StreamingMetricUpdate {
    const lastDataPoint = metric.dataPoints[metric.dataPoints.length - 1]
    const allValues = metric.dataPoints.map(p => p.value)
    
    const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length
    const stdDev = Math.sqrt(
      allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length
    )

    let baseValue = lastDataPoint?.value || mean
    const volatility = stdDev * 0.3
    const randomWalk = (Math.random() - 0.5) * volatility
    
    const timeFactor = Math.sin(Date.now() / 300000) * volatility * 0.5
    
    let newValue = baseValue + randomWalk + timeFactor

    const anomalyProbability = 0.05
    let isAnomaly = false
    let severity: 'low' | 'medium' | 'high' | 'critical' | undefined

    if (Math.random() < anomalyProbability) {
      const spike = (Math.random() > 0.5 ? 1 : -1) * stdDev * (2 + Math.random() * 2)
      newValue += spike
      isAnomaly = true
    }

    newValue = Math.max(0, newValue)

    if (metric.threshold) {
      if (newValue >= metric.threshold.critical) {
        severity = 'critical'
        isAnomaly = true
      } else if (newValue >= metric.threshold.warning) {
        severity = 'high'
        isAnomaly = true
      }
    }

    if (!severity && isAnomaly) {
      const zScore = stdDev > 0 ? Math.abs((newValue - mean) / stdDev) : 0
      if (zScore > 3) severity = 'high'
      else if (zScore > 2.5) severity = 'medium'
      else severity = 'low'
    }

    const change = lastDataPoint ? ((newValue - lastDataPoint.value) / lastDataPoint.value) * 100 : 0
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    if (metric.dataPoints.length >= 5) {
      const recentValues = metric.dataPoints.slice(-5).map(p => p.value)
      const recentTrend = recentValues[recentValues.length - 1] - recentValues[0]
      if (recentTrend > stdDev * 0.3) trend = 'increasing'
      else if (recentTrend < -stdDev * 0.3) trend = 'decreasing'
    }

    return {
      metricId: metric.id,
      metricType: metric.type,
      timestamp: Date.now(),
      value: newValue,
      change,
      trend,
      anomaly: isAnomaly,
      severity
    }
  }

  private checkIncidentCorrelations(update: StreamingMetricUpdate) {
    this.activeIncidents.forEach((incident, incidentId) => {
      const lastUpdate = this.lastCorrelationUpdate.get(incidentId) || 0
      const timeSinceLastUpdate = Date.now() - lastUpdate

      if (timeSinceLastUpdate < 5000) return

      const currentMetrics = Array.from(this.metrics.values())
      const newCorrelations = correlateIncidentWithMetrics(incident, currentMetrics, 3600000)
      
      const correlationUpdate: LiveCorrelationUpdate = {
        incidentId,
        timestamp: Date.now(),
        correlations: newCorrelations,
        changedMetrics: [update.metricId],
        newAnomalies: update.anomaly ? [update.metricId] : [],
        confidenceChange: 0
      }

      this.lastCorrelationUpdate.set(incidentId, Date.now())
      this.notifyCorrelationSubscribers(correlationUpdate)
    })
  }

  subscribeToMetric(metricId: string, callback: StreamUpdateCallback) {
    if (!this.subscribers.has(metricId)) {
      this.subscribers.set(metricId, new Set())
    }
    this.subscribers.get(metricId)!.add(callback)

    return () => {
      const subs = this.subscribers.get(metricId)
      if (subs) {
        subs.delete(callback)
        if (subs.size === 0) {
          this.subscribers.delete(metricId)
        }
      }
    }
  }

  subscribeToCorrelations(callback: CorrelationUpdateCallback) {
    this.correlationSubscribers.add(callback)

    return () => {
      this.correlationSubscribers.delete(callback)
    }
  }

  private notifySubscribers(metricId: string, update: StreamingMetricUpdate) {
    const subs = this.subscribers.get(metricId)
    if (subs) {
      subs.forEach(callback => callback(update))
    }
  }

  private notifyCorrelationSubscribers(update: LiveCorrelationUpdate) {
    this.correlationSubscribers.forEach(callback => callback(update))
  }

  trackIncident(incident: Incident) {
    this.activeIncidents.set(incident.id, incident)
  }

  untrackIncident(incidentId: string) {
    this.activeIncidents.delete(incidentId)
    this.lastCorrelationUpdate.delete(incidentId)
  }

  getMetric(metricId: string): ExternalMetric | undefined {
    return this.metrics.get(metricId)
  }

  getAllMetrics(): ExternalMetric[] {
    return Array.from(this.metrics.values())
  }

  isStreamActive(metricId: string): boolean {
    return this.streams.has(metricId)
  }

  getActiveStreamCount(): number {
    return this.streams.size
  }
}

export const metricStreamingService = new MetricStreamingService()

export function createDefaultStreamConfigs(metrics: ExternalMetric[]): MetricStreamConfig[] {
  return metrics.map(metric => ({
    metricId: metric.id,
    metricType: metric.type,
    elasticsearchQuery: {
      index: getIndexForMetricType(metric.type),
      interval: '30s',
      aggregation: 'avg',
      field: getFieldForMetricType(metric.type)
    },
    updateIntervalMs: 2000 + Math.random() * 1000,
    enabled: true
  }))
}

function getIndexForMetricType(type: ExternalMetricType): string {
  const indexMap: Record<ExternalMetricType, string> = {
    cpu: 'metrics-system.cpu-*',
    memory: 'metrics-system.memory-*',
    network: 'metrics-system.network-*',
    disk: 'metrics-system.diskio-*',
    latency: 'traces-apm-*',
    error_rate: 'logs-apm.error-*'
  }
  return indexMap[type]
}

function getFieldForMetricType(type: ExternalMetricType): string {
  const fieldMap: Record<ExternalMetricType, string> = {
    cpu: 'system.cpu.total.norm.pct',
    memory: 'system.memory.actual.used.pct',
    network: 'system.network.in.bytes',
    disk: 'system.diskio.io.ops',
    latency: 'transaction.duration.us',
    error_rate: 'error.count'
  }
  return fieldMap[type]
}

export function generateElasticsearchQuery(config: MetricStreamConfig): string {
  return `
GET ${config.elasticsearchQuery.index}/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-${config.elasticsearchQuery.interval}",
        "lte": "now"
      }
    }
  },
  "aggs": {
    "metric_value": {
      "${config.elasticsearchQuery.aggregation}": {
        "field": "${config.elasticsearchQuery.field}"
      }
    }
  }
}
`.trim()
}

export function generateESQLQuery(config: MetricStreamConfig): string {
  return `
FROM ${config.elasticsearchQuery.index}
| WHERE @timestamp >= NOW() - ${config.elasticsearchQuery.interval}
| STATS metric_value = ${config.elasticsearchQuery.aggregation.toUpperCase()}(${config.elasticsearchQuery.field})
`.trim()
}
