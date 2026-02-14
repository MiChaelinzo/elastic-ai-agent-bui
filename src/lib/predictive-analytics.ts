import type { Incident, IncidentSeverity } from './types'
import { getSimulatedCurrentTime } from './utils'

export interface IncidentPattern {
  id: string
  type: string
  frequency: number
  averageInterval: number
  lastOccurrence: number
  severity: IncidentSeverity
  keywords: string[]
  timeOfDayDistribution: number[]
  dayOfWeekDistribution: number[]
  seasonality?: 'daily' | 'weekly' | 'monthly'
}

export interface PredictiveInsight {
  id: string
  type: 'pattern' | 'anomaly' | 'trend' | 'forecast'
  title: string
  description: string
  confidence: number
  severity: IncidentSeverity
  predictedTime?: number
  relatedPattern?: string
  actionable: boolean
  preventionSteps?: string[]
  historicalIncidents: string[]
  createdAt: number
}

export interface TimeSeriesPoint {
  timestamp: number
  count: number
  severity: Record<IncidentSeverity, number>
}

export interface AnomalyDetection {
  timestamp: number
  value: number
  expectedValue: number
  deviation: number
  isAnomaly: boolean
  severity: 'low' | 'medium' | 'high'
}

export function analyzeIncidentPatterns(incidents: Incident[]): IncidentPattern[] {
  const patterns: Map<string, IncidentPattern> = new Map()
  
  incidents.forEach(incident => {
    const keywords = extractKeywords(incident.title + ' ' + incident.description)
    const primaryKeyword = keywords[0] || 'unknown'
    
    const date = new Date(incident.createdAt)
    const hourOfDay = date.getHours()
    const dayOfWeek = date.getDay()
    
    if (!patterns.has(primaryKeyword)) {
      patterns.set(primaryKeyword, {
        id: `pattern-${primaryKeyword}`,
        type: primaryKeyword,
        frequency: 0,
        averageInterval: 0,
        lastOccurrence: incident.createdAt,
        severity: incident.severity,
        keywords: keywords,
        timeOfDayDistribution: new Array(24).fill(0),
        dayOfWeekDistribution: new Array(7).fill(0)
      })
    }
    
    const pattern = patterns.get(primaryKeyword)!
    pattern.frequency++
    pattern.lastOccurrence = Math.max(pattern.lastOccurrence, incident.createdAt)
    pattern.timeOfDayDistribution[hourOfDay]++
    pattern.dayOfWeekDistribution[dayOfWeek]++
    
    if (incident.severity === 'critical' || incident.severity === 'high') {
      pattern.severity = incident.severity
    }
  })
  
  patterns.forEach(pattern => {
    const relatedIncidents = incidents.filter(inc => {
      const incKeywords = extractKeywords(inc.title + ' ' + inc.description)
      return incKeywords.some(kw => pattern.keywords.includes(kw))
    }).sort((a, b) => a.createdAt - b.createdAt)
    
    if (relatedIncidents.length > 1) {
      const intervals: number[] = []
      for (let i = 1; i < relatedIncidents.length; i++) {
        intervals.push(relatedIncidents[i].createdAt - relatedIncidents[i - 1].createdAt)
      }
      pattern.averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      
      if (pattern.averageInterval < 86400000) {
        pattern.seasonality = 'daily'
      } else if (pattern.averageInterval < 604800000) {
        pattern.seasonality = 'weekly'
      } else {
        pattern.seasonality = 'monthly'
      }
    }
  })
  
  return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency)
}

export function generatePredictiveInsights(
  incidents: Incident[],
  patterns: IncidentPattern[]
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = []
  const now = Date.now()
  
  patterns.forEach(pattern => {
    if (pattern.frequency >= 3 && pattern.averageInterval > 0) {
      const timeSinceLastOccurrence = now - pattern.lastOccurrence
      const expectedNextOccurrence = pattern.lastOccurrence + pattern.averageInterval
      const timeUntilPredicted = expectedNextOccurrence - now
      
      if (timeUntilPredicted > 0 && timeUntilPredicted < pattern.averageInterval * 1.5) {
        const confidence = Math.min(95, 60 + (pattern.frequency * 5))
        
        insights.push({
          id: `forecast-${pattern.id}`,
          type: 'forecast',
          title: `Predicted ${pattern.type} Incident`,
          description: `Based on ${pattern.frequency} historical occurrences, a ${pattern.type} incident is likely within the next ${formatTimeInterval(timeUntilPredicted)}. Average interval: ${formatTimeInterval(pattern.averageInterval)}.`,
          confidence,
          severity: pattern.severity,
          predictedTime: expectedNextOccurrence,
          relatedPattern: pattern.id,
          actionable: true,
          preventionSteps: generatePreventionSteps(pattern),
          historicalIncidents: incidents
            .filter(inc => extractKeywords(inc.title + ' ' + inc.description).some(kw => pattern.keywords.includes(kw)))
            .map(inc => inc.id)
            .slice(-5),
          createdAt: now
        })
      }
    }
  })
  
  const timeSeries = generateTimeSeries(incidents)
  const anomalies = detectAnomalies(timeSeries)
  
  anomalies.forEach((anomaly, index) => {
    if (anomaly.isAnomaly && anomaly.severity === 'high') {
      insights.push({
        id: `anomaly-${index}`,
        type: 'anomaly',
        title: 'Unusual Incident Spike Detected',
        description: `Incident rate increased by ${Math.round(anomaly.deviation * 100)}% above normal levels. This may indicate an emerging system-wide issue.`,
        confidence: Math.min(90, 70 + Math.abs(anomaly.deviation) * 20),
        severity: anomaly.value > anomaly.expectedValue * 2 ? 'critical' : 'high',
        actionable: true,
        preventionSteps: [
          'Review recent system changes and deployments',
          'Check infrastructure health metrics',
          'Investigate common patterns in recent incidents'
        ],
        historicalIncidents: [],
        createdAt: now
      })
    }
  })
  
  const trendInsights = detectTrends(incidents)
  insights.push(...trendInsights)
  
  const recurringInsights = detectRecurringIssues(incidents, patterns)
  insights.push(...recurringInsights)
  
  return insights.sort((a, b) => b.confidence - a.confidence)
}

export function generateTimeSeries(incidents: Incident[], intervalMs: number = 86400000): TimeSeriesPoint[] {
  if (incidents.length === 0) return []
  
  const earliest = Math.min(...incidents.map(i => i.createdAt))
  const latest = Math.max(...incidents.map(i => i.createdAt))
  const points: TimeSeriesPoint[] = []
  
  for (let time = earliest; time <= latest + intervalMs; time += intervalMs) {
    const incidentsInInterval = incidents.filter(
      inc => inc.createdAt >= time && inc.createdAt < time + intervalMs
    )
    
    points.push({
      timestamp: time,
      count: incidentsInInterval.length,
      severity: {
        critical: incidentsInInterval.filter(i => i.severity === 'critical').length,
        high: incidentsInInterval.filter(i => i.severity === 'high').length,
        medium: incidentsInInterval.filter(i => i.severity === 'medium').length,
        low: incidentsInInterval.filter(i => i.severity === 'low').length
      }
    })
  }
  
  return points
}

export function detectAnomalies(timeSeries: TimeSeriesPoint[]): AnomalyDetection[] {
  if (timeSeries.length < 3) return []
  
  const counts = timeSeries.map(p => p.count)
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length
  const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length
  const stdDev = Math.sqrt(variance)
  
  return timeSeries.map(point => {
    const deviation = (point.count - mean) / (stdDev || 1)
    const isAnomaly = Math.abs(deviation) > 2
    
    let severity: 'low' | 'medium' | 'high' = 'low'
    if (Math.abs(deviation) > 3) {
      severity = 'high'
    } else if (Math.abs(deviation) > 2.5) {
      severity = 'medium'
    }
    
    return {
      timestamp: point.timestamp,
      value: point.count,
      expectedValue: mean,
      deviation,
      isAnomaly,
      severity
    }
  })
}

function detectTrends(incidents: Incident[]): PredictiveInsight[] {
  const insights: PredictiveInsight[] = []
  const now = getSimulatedCurrentTime()
  const thirtyDaysAgo = now - (30 * 86400000)
  const sixtyDaysAgo = now - (60 * 86400000)
  
  const recentIncidents = incidents.filter(i => i.createdAt >= thirtyDaysAgo)
  const olderIncidents = incidents.filter(i => i.createdAt >= sixtyDaysAgo && i.createdAt < thirtyDaysAgo)
  
  if (olderIncidents.length > 0 && recentIncidents.length > 0) {
    const recentRate = recentIncidents.length / 30
    const olderRate = olderIncidents.length / 30
    const changePercent = ((recentRate - olderRate) / olderRate) * 100
    
    if (Math.abs(changePercent) > 20) {
      const isIncreasing = changePercent > 0
      
      insights.push({
        id: 'trend-overall',
        type: 'trend',
        title: `${isIncreasing ? 'Increasing' : 'Decreasing'} Incident Trend`,
        description: `Incident rate has ${isIncreasing ? 'increased' : 'decreased'} by ${Math.abs(Math.round(changePercent))}% over the past 30 days compared to the previous period.`,
        confidence: Math.min(85, 60 + Math.abs(changePercent) / 5),
        severity: isIncreasing ? (changePercent > 50 ? 'high' : 'medium') : 'low',
        actionable: isIncreasing,
        preventionSteps: isIncreasing ? [
          'Conduct system health review',
          'Analyze common root causes',
          'Consider infrastructure scaling',
          'Review recent changes and deployments'
        ] : undefined,
        historicalIncidents: recentIncidents.map(i => i.id).slice(-10),
        createdAt: now
      })
    }
  }
  
  const criticalIncidents = incidents.filter(i => i.severity === 'critical')
  const recentCritical = criticalIncidents.filter(i => i.createdAt >= thirtyDaysAgo)
  
  if (recentCritical.length >= 3) {
    insights.push({
      id: 'trend-critical',
      type: 'trend',
      title: 'High Rate of Critical Incidents',
      description: `${recentCritical.length} critical incidents detected in the past 30 days. Immediate attention required.`,
      confidence: 90,
      severity: 'critical',
      actionable: true,
      preventionSteps: [
        'Escalate to engineering leadership',
        'Conduct incident retrospective',
        'Review monitoring and alerting coverage',
        'Implement additional safeguards'
      ],
      historicalIncidents: recentCritical.map(i => i.id),
      createdAt: now
    })
  }
  
  return insights
}

function detectRecurringIssues(incidents: Incident[], patterns: IncidentPattern[]): PredictiveInsight[] {
  const insights: PredictiveInsight[] = []
  const now = getSimulatedCurrentTime()
  
  patterns.forEach(pattern => {
    if (pattern.frequency >= 5) {
      const relatedIncidents = incidents.filter(inc => 
        extractKeywords(inc.title + ' ' + inc.description).some(kw => pattern.keywords.includes(kw))
      )
      
      const resolvedCount = relatedIncidents.filter(i => i.status === 'resolved').length
      const resolutionRate = resolvedCount / relatedIncidents.length
      
      if (resolutionRate < 0.7 || pattern.frequency >= 8) {
        insights.push({
          id: `recurring-${pattern.id}`,
          type: 'pattern',
          title: `Recurring ${pattern.type} Issue`,
          description: `This issue has occurred ${pattern.frequency} times. ${resolutionRate < 0.7 ? 'Low resolution rate suggests incomplete fixes.' : 'High frequency indicates a systemic problem.'} Consider implementing a permanent solution.`,
          confidence: Math.min(95, 70 + pattern.frequency * 3),
          severity: pattern.severity,
          relatedPattern: pattern.id,
          actionable: true,
          preventionSteps: [
            'Investigate root cause thoroughly',
            'Implement permanent fix instead of workarounds',
            'Add preventive monitoring and alerts',
            'Document solution in knowledge base'
          ],
          historicalIncidents: relatedIncidents.map(i => i.id).slice(-10),
          createdAt: now
        })
      }
    }
  })
  
  return insights
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those'])
  
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
  
  const frequency: Map<string, number> = new Map()
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1)
  })
  
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

function formatTimeInterval(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`
  return `${seconds} second${seconds > 1 ? 's' : ''}`
}

function generatePreventionSteps(pattern: IncidentPattern): string[] {
  const steps: string[] = []
  
  const peakHour = pattern.timeOfDayDistribution.indexOf(Math.max(...pattern.timeOfDayDistribution))
  const peakDay = pattern.dayOfWeekDistribution.indexOf(Math.max(...pattern.dayOfWeekDistribution))
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  if (pattern.seasonality === 'daily') {
    steps.push(`Schedule preventive maintenance during off-peak hours (typically occurs around ${peakHour}:00)`)
  } else if (pattern.seasonality === 'weekly') {
    steps.push(`Plan preventive actions before ${dayNames[peakDay]} (peak occurrence day)`)
  }
  
  steps.push('Review and strengthen monitoring for early detection')
  steps.push('Implement automated remediation workflow')
  steps.push('Add capacity scaling triggers')
  
  return steps
}

export function calculatePredictiveScore(incidents: Incident[]): {
  score: number
  confidence: number
  recommendation: string
} {
  if (incidents.length < 5) {
    return {
      score: 0,
      confidence: 0,
      recommendation: 'Insufficient historical data for predictions. Need at least 5 incidents.'
    }
  }
  
  const patterns = analyzeIncidentPatterns(incidents)
  const insights = generatePredictiveInsights(incidents, patterns)
  
  const highConfidenceInsights = insights.filter(i => i.confidence > 75).length
  const actionableInsights = insights.filter(i => i.actionable).length
  
  const score = Math.min(100, (highConfidenceInsights * 15) + (actionableInsights * 10) + (patterns.length * 5))
  const confidence = insights.length > 0 ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length : 0
  
  let recommendation = 'Predictive analytics are operating normally.'
  if (highConfidenceInsights >= 3) {
    recommendation = 'High prediction confidence. Consider taking preventive action on identified patterns.'
  } else if (patterns.length >= 5) {
    recommendation = 'Multiple patterns detected. Continue monitoring for stronger signals.'
  }
  
  return { score, confidence, recommendation }
}
