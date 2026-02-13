import type { Incident, IncidentSeverity } from './types'

export type AnomalyAlgorithm = 'zscore' | 'iqr' | 'mad' | 'isolation' | 'ensemble'

export interface AnomalyThresholds {
  zscoreThreshold: number
  iqrMultiplier: number
  madMultiplier: number
  isolationThreshold: number
  ensembleAgreement: number
  minDataPoints: number
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface MetricDataPoint {
  timestamp: number
  value: number
  label?: string
  metadata?: Record<string, any>
}

export interface AnomalyResult {
  id: string
  timestamp: number
  value: number
  expectedValue: number
  deviation: number
  isAnomaly: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  algorithm: AnomalyAlgorithm
  detectionMethods: string[]
  description: string
  suggestedActions: string[]
}

export interface AnomalyPattern {
  id: string
  name: string
  description: string
  frequency: number
  avgMagnitude: number
  lastDetected: number
  affectedMetrics: string[]
  correlatedIncidents: string[]
}

export interface TimeSeriesMetrics {
  mean: number
  median: number
  stdDev: number
  variance: number
  min: number
  max: number
  q1: number
  q3: number
  iqr: number
  mad: number
  trend: 'increasing' | 'decreasing' | 'stable'
  seasonality: boolean
}

export const defaultAnomalyThresholds: AnomalyThresholds = {
  zscoreThreshold: 2.5,
  iqrMultiplier: 1.5,
  madMultiplier: 3,
  isolationThreshold: 0.6,
  ensembleAgreement: 0.6,
  minDataPoints: 10,
  sensitivityLevel: 'medium'
}

export const sensitivityPresets: Record<string, Partial<AnomalyThresholds>> = {
  low: {
    zscoreThreshold: 3.5,
    iqrMultiplier: 2.0,
    madMultiplier: 4,
    isolationThreshold: 0.7,
    ensembleAgreement: 0.75,
    sensitivityLevel: 'low'
  },
  medium: {
    zscoreThreshold: 2.5,
    iqrMultiplier: 1.5,
    madMultiplier: 3,
    isolationThreshold: 0.6,
    ensembleAgreement: 0.6,
    sensitivityLevel: 'medium'
  },
  high: {
    zscoreThreshold: 2.0,
    iqrMultiplier: 1.2,
    madMultiplier: 2.5,
    isolationThreshold: 0.5,
    ensembleAgreement: 0.5,
    sensitivityLevel: 'high'
  },
  critical: {
    zscoreThreshold: 1.5,
    iqrMultiplier: 1.0,
    madMultiplier: 2,
    isolationThreshold: 0.4,
    ensembleAgreement: 0.4,
    sensitivityLevel: 'critical'
  }
}

export function calculateTimeSeriesMetrics(data: number[]): TimeSeriesMetrics {
  if (data.length === 0) {
    return {
      mean: 0, median: 0, stdDev: 0, variance: 0,
      min: 0, max: 0, q1: 0, q3: 0, iqr: 0, mad: 0,
      trend: 'stable', seasonality: false
    }
  }

  const sorted = [...data].sort((a, b) => a - b)
  const n = data.length
  
  const mean = data.reduce((sum, val) => sum + val, 0) / n
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]
  
  const q1Index = Math.floor(n / 4)
  const q3Index = Math.floor(3 * n / 4)
  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1
  
  const absoluteDeviations = data.map(val => Math.abs(val - median))
  const mad = absoluteDeviations.sort((a, b) => a - b)[Math.floor(absoluteDeviations.length / 2)]
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (data.length >= 3) {
    const firstThird = data.slice(0, Math.floor(n / 3)).reduce((a, b) => a + b, 0) / Math.floor(n / 3)
    const lastThird = data.slice(-Math.floor(n / 3)).reduce((a, b) => a + b, 0) / Math.floor(n / 3)
    const trendChange = (lastThird - firstThird) / (firstThird || 1)
    
    if (trendChange > 0.2) trend = 'increasing'
    else if (trendChange < -0.2) trend = 'decreasing'
  }
  
  const seasonality = detectSeasonality(data)
  
  return {
    mean, median, stdDev, variance,
    min: sorted[0],
    max: sorted[n - 1],
    q1, q3, iqr, mad,
    trend, seasonality
  }
}

function detectSeasonality(data: number[]): boolean {
  if (data.length < 14) return false
  
  const halfLength = Math.floor(data.length / 2)
  const firstHalf = data.slice(0, halfLength)
  const secondHalf = data.slice(halfLength)
  
  const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  const firstVariance = firstHalf.reduce((sum, val) => sum + Math.pow(val - firstMean, 2), 0) / firstHalf.length
  const secondVariance = secondHalf.reduce((sum, val) => sum + Math.pow(val - secondMean, 2), 0) / secondHalf.length
  
  const varianceRatio = Math.abs(firstVariance - secondVariance) / Math.max(firstVariance, secondVariance)
  
  return varianceRatio < 0.3
}

export function detectAnomaliesZScore(
  dataPoints: MetricDataPoint[],
  thresholds: AnomalyThresholds
): AnomalyResult[] {
  if (dataPoints.length < thresholds.minDataPoints) return []
  
  const values = dataPoints.map(p => p.value)
  const metrics = calculateTimeSeriesMetrics(values)
  
  return dataPoints.map((point, index) => {
    const zScore = metrics.stdDev > 0 
      ? Math.abs((point.value - metrics.mean) / metrics.stdDev)
      : 0
    
    const isAnomaly = zScore > thresholds.zscoreThreshold
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (zScore > thresholds.zscoreThreshold * 2) severity = 'critical'
    else if (zScore > thresholds.zscoreThreshold * 1.5) severity = 'high'
    else if (zScore > thresholds.zscoreThreshold * 1.2) severity = 'medium'
    
    const confidence = Math.min(95, Math.round(
      (zScore / thresholds.zscoreThreshold) * 70 + 25
    ))
    
    return {
      id: `anomaly-zscore-${index}-${point.timestamp}`,
      timestamp: point.timestamp,
      value: point.value,
      expectedValue: metrics.mean,
      deviation: zScore,
      isAnomaly,
      severity,
      confidence,
      algorithm: 'zscore',
      detectionMethods: ['Z-Score Statistical Analysis'],
      description: isAnomaly 
        ? `Value ${point.value.toFixed(2)} is ${zScore.toFixed(2)} standard deviations from the mean (${metrics.mean.toFixed(2)})`
        : `Value within normal range (${zScore.toFixed(2)}σ from mean)`,
      suggestedActions: isAnomaly ? [
        'Investigate root cause of deviation',
        'Check for system changes or deployments',
        'Review correlating metrics and logs',
        'Alert appropriate team if severity is high'
      ] : []
    }
  })
}

export function detectAnomaliesIQR(
  dataPoints: MetricDataPoint[],
  thresholds: AnomalyThresholds
): AnomalyResult[] {
  if (dataPoints.length < thresholds.minDataPoints) return []
  
  const values = dataPoints.map(p => p.value)
  const metrics = calculateTimeSeriesMetrics(values)
  
  const lowerBound = metrics.q1 - (thresholds.iqrMultiplier * metrics.iqr)
  const upperBound = metrics.q3 + (thresholds.iqrMultiplier * metrics.iqr)
  
  return dataPoints.map((point, index) => {
    const isAnomaly = point.value < lowerBound || point.value > upperBound
    
    const deviationFromBound = point.value > upperBound
      ? (point.value - upperBound) / metrics.iqr
      : (lowerBound - point.value) / metrics.iqr
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (deviationFromBound > 3) severity = 'critical'
    else if (deviationFromBound > 2) severity = 'high'
    else if (deviationFromBound > 1) severity = 'medium'
    
    const confidence = Math.min(95, Math.round(
      (deviationFromBound / thresholds.iqrMultiplier) * 60 + 30
    ))
    
    return {
      id: `anomaly-iqr-${index}-${point.timestamp}`,
      timestamp: point.timestamp,
      value: point.value,
      expectedValue: metrics.median,
      deviation: deviationFromBound,
      isAnomaly,
      severity,
      confidence,
      algorithm: 'iqr',
      detectionMethods: ['Interquartile Range (IQR)'],
      description: isAnomaly
        ? `Value ${point.value.toFixed(2)} is outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
        : `Value within IQR bounds`,
      suggestedActions: isAnomaly ? [
        'Verify data collection accuracy',
        'Compare with historical outliers',
        'Check for data pipeline issues',
        'Investigate if value represents genuine anomaly'
      ] : []
    }
  })
}

export function detectAnomaliesMAD(
  dataPoints: MetricDataPoint[],
  thresholds: AnomalyThresholds
): AnomalyResult[] {
  if (dataPoints.length < thresholds.minDataPoints) return []
  
  const values = dataPoints.map(p => p.value)
  const metrics = calculateTimeSeriesMetrics(values)
  
  return dataPoints.map((point, index) => {
    const madScore = metrics.mad > 0
      ? Math.abs((point.value - metrics.median) / (1.4826 * metrics.mad))
      : 0
    
    const isAnomaly = madScore > thresholds.madMultiplier
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (madScore > thresholds.madMultiplier * 2) severity = 'critical'
    else if (madScore > thresholds.madMultiplier * 1.5) severity = 'high'
    else if (madScore > thresholds.madMultiplier * 1.2) severity = 'medium'
    
    const confidence = Math.min(95, Math.round(
      (madScore / thresholds.madMultiplier) * 65 + 28
    ))
    
    return {
      id: `anomaly-mad-${index}-${point.timestamp}`,
      timestamp: point.timestamp,
      value: point.value,
      expectedValue: metrics.median,
      deviation: madScore,
      isAnomaly,
      severity,
      confidence,
      algorithm: 'mad',
      detectionMethods: ['Median Absolute Deviation (MAD)'],
      description: isAnomaly
        ? `Value ${point.value.toFixed(2)} has MAD score of ${madScore.toFixed(2)} (threshold: ${thresholds.madMultiplier})`
        : `Value within MAD threshold`,
      suggestedActions: isAnomaly ? [
        'Robust outlier detection - less sensitive to extreme values',
        'Review metric calculation methodology',
        'Check for sensor or measurement errors',
        'Validate against alternative detection methods'
      ] : []
    }
  })
}

export function detectAnomaliesIsolationForest(
  dataPoints: MetricDataPoint[],
  thresholds: AnomalyThresholds
): AnomalyResult[] {
  if (dataPoints.length < thresholds.minDataPoints) return []
  
  const values = dataPoints.map(p => p.value)
  const metrics = calculateTimeSeriesMetrics(values)
  
  const isolationScores = values.map(value => {
    let pathLength = 0
    let low = metrics.min
    let high = metrics.max
    
    for (let i = 0; i < 10; i++) {
      const split = low + Math.random() * (high - low)
      pathLength++
      
      if (value < split) {
        high = split
      } else {
        low = split
      }
      
      if (high - low < 0.01) break
    }
    
    const avgPathLength = values.length > 1 
      ? 2 * (Math.log(values.length - 1) + 0.5772156649) - (2 * (values.length - 1) / values.length)
      : 1
    
    return Math.pow(2, -pathLength / avgPathLength)
  })
  
  return dataPoints.map((point, index) => {
    const score = isolationScores[index]
    const isAnomaly = score > thresholds.isolationThreshold
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (score > 0.8) severity = 'critical'
    else if (score > 0.7) severity = 'high'
    else if (score > 0.6) severity = 'medium'
    
    const confidence = Math.min(95, Math.round(score * 100))
    
    return {
      id: `anomaly-isolation-${index}-${point.timestamp}`,
      timestamp: point.timestamp,
      value: point.value,
      expectedValue: metrics.mean,
      deviation: score,
      isAnomaly,
      severity,
      confidence,
      algorithm: 'isolation',
      detectionMethods: ['Isolation Forest'],
      description: isAnomaly
        ? `Value ${point.value.toFixed(2)} has isolation score of ${score.toFixed(3)} (highly isolated from normal patterns)`
        : `Value clusters with normal data`,
      suggestedActions: isAnomaly ? [
        'ML-based detection - value is isolated from patterns',
        'Cross-reference with business context',
        'Check for rare but valid edge cases',
        'Monitor for similar isolated occurrences'
      ] : []
    }
  })
}

export function detectAnomaliesEnsemble(
  dataPoints: MetricDataPoint[],
  thresholds: AnomalyThresholds
): AnomalyResult[] {
  if (dataPoints.length < thresholds.minDataPoints) return []
  
  const zscoreResults = detectAnomaliesZScore(dataPoints, thresholds)
  const iqrResults = detectAnomaliesIQR(dataPoints, thresholds)
  const madResults = detectAnomaliesMAD(dataPoints, thresholds)
  const isolationResults = detectAnomaliesIsolationForest(dataPoints, thresholds)
  
  return dataPoints.map((point, index) => {
    const detections = [
      zscoreResults[index],
      iqrResults[index],
      madResults[index],
      isolationResults[index]
    ]
    
    const anomalyCount = detections.filter(d => d.isAnomaly).length
    const agreementRatio = anomalyCount / detections.length
    const isAnomaly = agreementRatio >= thresholds.ensembleAgreement
    
    const detectionMethods = detections
      .filter(d => d.isAnomaly)
      .map(d => d.detectionMethods[0])
    
    const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
    const maxSeverity = detections.reduce((max, d) => {
      const severities = ['low', 'medium', 'high', 'critical']
      return severities.indexOf(d.severity) > severities.indexOf(max) ? d.severity : max
    }, 'low' as 'low' | 'medium' | 'high' | 'critical')
    
    const avgExpectedValue = detections.reduce((sum, d) => sum + d.expectedValue, 0) / detections.length
    const maxDeviation = Math.max(...detections.map(d => d.deviation))
    
    return {
      id: `anomaly-ensemble-${index}-${point.timestamp}`,
      timestamp: point.timestamp,
      value: point.value,
      expectedValue: avgExpectedValue,
      deviation: maxDeviation,
      isAnomaly,
      severity: isAnomaly ? maxSeverity : 'low',
      confidence: Math.round(avgConfidence * agreementRatio),
      algorithm: 'ensemble',
      detectionMethods: detectionMethods.length > 0 
        ? detectionMethods 
        : ['Ensemble (No algorithms detected anomaly)'],
      description: isAnomaly
        ? `Anomaly detected by ${anomalyCount}/4 algorithms (${detectionMethods.join(', ')})`
        : `Normal value - detected by ${anomalyCount}/4 algorithms`,
      suggestedActions: isAnomaly ? [
        `Multiple algorithms agree (${Math.round(agreementRatio * 100)}% consensus)`,
        'High confidence anomaly - prioritize investigation',
        'Review all detection method details',
        'Document findings for pattern learning'
      ] : []
    }
  })
}

export function detectAnomalies(
  dataPoints: MetricDataPoint[],
  algorithm: AnomalyAlgorithm,
  thresholds: AnomalyThresholds
): AnomalyResult[] {
  switch (algorithm) {
    case 'zscore':
      return detectAnomaliesZScore(dataPoints, thresholds)
    case 'iqr':
      return detectAnomaliesIQR(dataPoints, thresholds)
    case 'mad':
      return detectAnomaliesMAD(dataPoints, thresholds)
    case 'isolation':
      return detectAnomaliesIsolationForest(dataPoints, thresholds)
    case 'ensemble':
      return detectAnomaliesEnsemble(dataPoints, thresholds)
    default:
      return detectAnomaliesEnsemble(dataPoints, thresholds)
  }
}

export function convertIncidentsToMetricDataPoints(
  incidents: Incident[],
  intervalMs: number = 3600000
): MetricDataPoint[] {
  if (incidents.length === 0) return []
  
  const earliest = Math.min(...incidents.map(i => i.createdAt))
  const latest = Date.now()
  const dataPoints: MetricDataPoint[] = []
  
  for (let time = earliest; time <= latest; time += intervalMs) {
    const incidentsInInterval = incidents.filter(
      inc => inc.createdAt >= time && inc.createdAt < time + intervalMs
    )
    
    dataPoints.push({
      timestamp: time,
      value: incidentsInInterval.length,
      label: new Date(time).toISOString(),
      metadata: {
        criticalCount: incidentsInInterval.filter(i => i.severity === 'critical').length,
        highCount: incidentsInInterval.filter(i => i.severity === 'high').length,
        mediumCount: incidentsInInterval.filter(i => i.severity === 'medium').length,
        lowCount: incidentsInInterval.filter(i => i.severity === 'low').length
      }
    })
  }
  
  return dataPoints
}

export function analyzeAnomalyPatterns(
  anomalies: AnomalyResult[],
  incidents: Incident[]
): AnomalyPattern[] {
  const patterns: Map<string, AnomalyPattern> = new Map()
  
  const detectedAnomalies = anomalies.filter(a => a.isAnomaly)
  
  if (detectedAnomalies.length === 0) return []
  
  const severityGroups = detectedAnomalies.reduce((groups, anomaly) => {
    const key = `${anomaly.severity}-anomaly`
    if (!groups[key]) groups[key] = []
    groups[key].push(anomaly)
    return groups
  }, {} as Record<string, AnomalyResult[]>)
  
  Object.entries(severityGroups).forEach(([key, group]) => {
    const avgMagnitude = group.reduce((sum, a) => sum + Math.abs(a.value - a.expectedValue), 0) / group.length
    const lastAnomaly = group.sort((a, b) => b.timestamp - a.timestamp)[0]
    
    const relatedIncidents = incidents.filter(inc => {
      const incTime = inc.createdAt
      return group.some(a => Math.abs(a.timestamp - incTime) < 3600000)
    })
    
    patterns.set(key, {
      id: `pattern-${key}`,
      name: `${key.split('-')[0].toUpperCase()} Severity Anomaly Pattern`,
      description: `Recurring pattern of ${key.split('-')[0]} severity anomalies detected ${group.length} times`,
      frequency: group.length,
      avgMagnitude,
      lastDetected: lastAnomaly.timestamp,
      affectedMetrics: ['Incident Rate', 'System Load', 'Error Frequency'],
      correlatedIncidents: relatedIncidents.map(i => i.id)
    })
  })
  
  return Array.from(patterns.values())
}

export function generateAnomalyReport(
  anomalies: AnomalyResult[],
  thresholds: AnomalyThresholds,
  metrics: TimeSeriesMetrics
): string {
  const detectedAnomalies = anomalies.filter(a => a.isAnomaly)
  const criticalAnomalies = detectedAnomalies.filter(a => a.severity === 'critical')
  const highAnomalies = detectedAnomalies.filter(a => a.severity === 'high')
  
  let report = `# Anomaly Detection Report\n\n`
  report += `**Generated**: ${new Date().toISOString()}\n`
  report += `**Algorithm**: ${anomalies[0]?.algorithm || 'ensemble'}\n`
  report += `**Detection Sensitivity**: ${thresholds.sensitivityLevel}\n\n`
  
  report += `## Summary\n\n`
  report += `- **Total Data Points**: ${anomalies.length}\n`
  report += `- **Anomalies Detected**: ${detectedAnomalies.length} (${Math.round(detectedAnomalies.length / anomalies.length * 100)}%)\n`
  report += `- **Critical**: ${criticalAnomalies.length}\n`
  report += `- **High**: ${highAnomalies.length}\n\n`
  
  report += `## Baseline Metrics\n\n`
  report += `- **Mean**: ${metrics.mean.toFixed(2)}\n`
  report += `- **Median**: ${metrics.median.toFixed(2)}\n`
  report += `- **Std Dev**: ${metrics.stdDev.toFixed(2)}\n`
  report += `- **Range**: [${metrics.min.toFixed(2)}, ${metrics.max.toFixed(2)}]\n`
  report += `- **Trend**: ${metrics.trend}\n\n`
  
  if (criticalAnomalies.length > 0) {
    report += `## Critical Anomalies\n\n`
    criticalAnomalies.slice(0, 5).forEach(anomaly => {
      report += `### ${new Date(anomaly.timestamp).toLocaleString()}\n`
      report += `- **Value**: ${anomaly.value.toFixed(2)} (Expected: ${anomaly.expectedValue.toFixed(2)})\n`
      report += `- **Deviation**: ${anomaly.deviation.toFixed(2)}\n`
      report += `- **Confidence**: ${anomaly.confidence}%\n`
      report += `- **Description**: ${anomaly.description}\n\n`
    })
  }
  
  return report
}
