import type { Incident, IncidentSeverity } from './types'

export interface SLAPolicy {
  id: string
  name: string
  description: string
  severity: IncidentSeverity
  responseTime: number
  resolutionTime: number
  escalationTime?: number
  businessHoursOnly: boolean
  enabled: boolean
  target?: number
}

export interface SLAStatus {
  incidentId: string
  policyId: string
  responseDeadline: number
  resolutionDeadline: number
  escalationDeadline?: number
  responseTime?: number
  resolutionTime?: number
  responseBreached: boolean
  resolutionBreached: boolean
  timeToResponseBreach: number
  timeToResolutionBreach: number
  percentComplete: number
  status: 'on-track' | 'at-risk' | 'breached'
  breachType?: 'response' | 'resolution' | 'both'
  timeOverBreach?: number
}

export interface SLABreach {
  id: string
  incidentId: string
  incidentTitle: string
  severity: IncidentSeverity
  policyId: string
  breachType: 'response' | 'resolution' | 'both'
  breachedAt: number
  timeOverBreach: number
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: number
  notes?: string
}

export interface SLAMetrics {
  overall: {
    compliance: number
    totalIncidents: number
    compliantIncidents: number
    breachedIncidents: number
    averageResolutionTime: number
    averageResponseTime: number
  }
  bySeverity: Record<IncidentSeverity, {
    compliance: number
    total: number
    compliant: number
    breached: number
    averageResolutionTime: number
  }>
  trends: {
    period: string
    compliance: number
    breached: number
  }[]
}

export const defaultSLAPolicies: SLAPolicy[] = [
  {
    id: 'sla-critical',
    name: 'Critical Incident SLA',
    description: 'SLA for critical severity incidents',
    severity: 'critical',
    responseTime: 15 * 60 * 1000,
    resolutionTime: 4 * 60 * 60 * 1000,
    escalationTime: 30 * 60 * 1000,
    businessHoursOnly: false,
    enabled: true,
    target: 99.5
  },
  {
    id: 'sla-high',
    name: 'High Priority SLA',
    description: 'SLA for high severity incidents',
    severity: 'high',
    responseTime: 30 * 60 * 1000,
    resolutionTime: 8 * 60 * 60 * 1000,
    escalationTime: 2 * 60 * 60 * 1000,
    businessHoursOnly: false,
    enabled: true,
    target: 98.0
  },
  {
    id: 'sla-medium',
    name: 'Medium Priority SLA',
    description: 'SLA for medium severity incidents',
    severity: 'medium',
    responseTime: 2 * 60 * 60 * 1000,
    resolutionTime: 24 * 60 * 60 * 1000,
    escalationTime: 4 * 60 * 60 * 1000,
    businessHoursOnly: true,
    enabled: true,
    target: 95.0
  },
  {
    id: 'sla-low',
    name: 'Low Priority SLA',
    description: 'SLA for low severity incidents',
    severity: 'low',
    responseTime: 4 * 60 * 60 * 1000,
    resolutionTime: 48 * 60 * 60 * 1000,
    businessHoursOnly: true,
    enabled: true,
    target: 90.0
  }
]

export function getSLAPolicy(severity: IncidentSeverity, policies: SLAPolicy[]): SLAPolicy | undefined {
  return policies.find(p => p.severity === severity && p.enabled)
}

export function calculateSLAStatus(incident: Incident, policy: SLAPolicy, currentTime: number = Date.now()): SLAStatus {
  const responseDeadline = incident.createdAt + policy.responseTime
  const resolutionDeadline = incident.createdAt + policy.resolutionTime
  const escalationDeadline = policy.escalationTime ? incident.createdAt + policy.escalationTime : undefined

  const firstAgentResponse = incident.assignedAgents.length > 0 ? incident.updatedAt : undefined
  const responseTime = firstAgentResponse ? firstAgentResponse - incident.createdAt : undefined
  const resolutionTime = incident.status === 'resolved' && incident.updatedAt 
    ? incident.updatedAt - incident.createdAt 
    : undefined

  const responseBreached = firstAgentResponse 
    ? responseTime! > policy.responseTime
    : currentTime > responseDeadline

  const resolutionBreached = incident.status === 'resolved'
    ? resolutionTime! > policy.resolutionTime
    : currentTime > resolutionDeadline

  const timeToResponseBreach = responseBreached 
    ? 0 
    : Math.max(0, responseDeadline - currentTime)

  const timeToResolutionBreach = resolutionBreached
    ? 0
    : Math.max(0, resolutionDeadline - currentTime)

  const elapsed = incident.status === 'resolved' 
    ? (incident.updatedAt - incident.createdAt)
    : (currentTime - incident.createdAt)
  
  const percentComplete = Math.min(100, (elapsed / policy.resolutionTime) * 100)

  let status: 'on-track' | 'at-risk' | 'breached' = 'on-track'
  if (responseBreached || resolutionBreached) {
    status = 'breached'
  } else if (percentComplete > 75 || timeToResolutionBreach < policy.resolutionTime * 0.25) {
    status = 'at-risk'
  }

  let breachType: 'response' | 'resolution' | 'both' | undefined
  if (responseBreached && resolutionBreached) {
    breachType = 'both'
  } else if (responseBreached) {
    breachType = 'response'
  } else if (resolutionBreached) {
    breachType = 'resolution'
  }

  const timeOverBreach = resolutionBreached 
    ? Math.max(
        responseBreached ? (responseTime! - policy.responseTime) : 0,
        incident.status === 'resolved' ? (resolutionTime! - policy.resolutionTime) : (currentTime - resolutionDeadline)
      )
    : responseBreached 
    ? (responseTime! - policy.responseTime)
    : 0

  return {
    incidentId: incident.id,
    policyId: policy.id,
    responseDeadline,
    resolutionDeadline,
    escalationDeadline,
    responseTime,
    resolutionTime,
    responseBreached,
    resolutionBreached,
    timeToResponseBreach,
    timeToResolutionBreach,
    percentComplete,
    status,
    breachType,
    timeOverBreach
  }
}

export function formatSLATime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

export function getSLAStatusColor(status: SLAStatus): string {
  if (status.status === 'breached') {
    return 'text-destructive'
  } else if (status.status === 'at-risk') {
    return 'text-warning'
  }
  return 'text-success'
}

export function getSLAMetrics(incidents: Incident[], policies: SLAPolicy[]): SLAMetrics {
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved')
  
  if (resolvedIncidents.length === 0) {
    return {
      overall: {
        compliance: 100,
        totalIncidents: 0,
        compliantIncidents: 0,
        breachedIncidents: 0,
        averageResolutionTime: 0,
        averageResponseTime: 0
      },
      bySeverity: {
        critical: { compliance: 100, total: 0, compliant: 0, breached: 0, averageResolutionTime: 0 },
        high: { compliance: 100, total: 0, compliant: 0, breached: 0, averageResolutionTime: 0 },
        medium: { compliance: 100, total: 0, compliant: 0, breached: 0, averageResolutionTime: 0 },
        low: { compliance: 100, total: 0, compliant: 0, breached: 0, averageResolutionTime: 0 }
      },
      trends: []
    }
  }

  let compliantCount = 0
  let totalResponseTime = 0
  let totalResolutionTime = 0
  let responseTimeCount = 0

  const bySeverity: Record<IncidentSeverity, { 
    total: number
    compliant: number
    breached: number
    totalResolutionTime: number
  }> = {
    critical: { total: 0, compliant: 0, breached: 0, totalResolutionTime: 0 },
    high: { total: 0, compliant: 0, breached: 0, totalResolutionTime: 0 },
    medium: { total: 0, compliant: 0, breached: 0, totalResolutionTime: 0 },
    low: { total: 0, compliant: 0, breached: 0, totalResolutionTime: 0 }
  }

  resolvedIncidents.forEach(incident => {
    const policy = getSLAPolicy(incident.severity, policies)
    if (!policy) return

    const status = calculateSLAStatus(incident, policy, incident.updatedAt)
    bySeverity[incident.severity].total++

    const resolutionTime = incident.updatedAt - incident.createdAt
    bySeverity[incident.severity].totalResolutionTime += resolutionTime
    totalResolutionTime += resolutionTime

    if (status.responseTime) {
      totalResponseTime += status.responseTime
      responseTimeCount++
    }

    if (!status.responseBreached && !status.resolutionBreached) {
      compliantCount++
      bySeverity[incident.severity].compliant++
    } else {
      bySeverity[incident.severity].breached++
    }
  })

  const bySeverityMetrics: Record<IncidentSeverity, {
    compliance: number
    total: number
    compliant: number
    breached: number
    averageResolutionTime: number
  }> = {
    critical: {
      compliance: bySeverity.critical.total > 0 
        ? (bySeverity.critical.compliant / bySeverity.critical.total) * 100 
        : 100,
      total: bySeverity.critical.total,
      compliant: bySeverity.critical.compliant,
      breached: bySeverity.critical.breached,
      averageResolutionTime: bySeverity.critical.total > 0
        ? bySeverity.critical.totalResolutionTime / bySeverity.critical.total
        : 0
    },
    high: {
      compliance: bySeverity.high.total > 0 
        ? (bySeverity.high.compliant / bySeverity.high.total) * 100 
        : 100,
      total: bySeverity.high.total,
      compliant: bySeverity.high.compliant,
      breached: bySeverity.high.breached,
      averageResolutionTime: bySeverity.high.total > 0
        ? bySeverity.high.totalResolutionTime / bySeverity.high.total
        : 0
    },
    medium: {
      compliance: bySeverity.medium.total > 0 
        ? (bySeverity.medium.compliant / bySeverity.medium.total) * 100 
        : 100,
      total: bySeverity.medium.total,
      compliant: bySeverity.medium.compliant,
      breached: bySeverity.medium.breached,
      averageResolutionTime: bySeverity.medium.total > 0
        ? bySeverity.medium.totalResolutionTime / bySeverity.medium.total
        : 0
    },
    low: {
      compliance: bySeverity.low.total > 0 
        ? (bySeverity.low.compliant / bySeverity.low.total) * 100 
        : 100,
      total: bySeverity.low.total,
      compliant: bySeverity.low.compliant,
      breached: bySeverity.low.breached,
      averageResolutionTime: bySeverity.low.total > 0
        ? bySeverity.low.totalResolutionTime / bySeverity.low.total
        : 0
    }
  }

  return {
    overall: {
      compliance: (compliantCount / resolvedIncidents.length) * 100,
      totalIncidents: resolvedIncidents.length,
      compliantIncidents: compliantCount,
      breachedIncidents: resolvedIncidents.length - compliantCount,
      averageResolutionTime: totalResolutionTime / resolvedIncidents.length,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0
    },
    bySeverity: bySeverityMetrics,
    trends: []
  }
}

export function detectSLABreaches(incidents: Incident[], policies: SLAPolicy[], existingBreaches: SLABreach[] = []): SLABreach[] {
  const breaches: SLABreach[] = []
  const existingBreachIds = new Set(existingBreaches.map(b => b.incidentId))

  incidents.forEach(incident => {
    if (existingBreachIds.has(incident.id)) return

    const policy = getSLAPolicy(incident.severity, policies)
    if (!policy) return

    const status = calculateSLAStatus(incident, policy)
    
    if (status.status === 'breached' && status.breachType && status.timeOverBreach) {
      breaches.push({
        id: `breach-${incident.id}-${Date.now()}`,
        incidentId: incident.id,
        incidentTitle: incident.title,
        severity: incident.severity,
        policyId: policy.id,
        breachType: status.breachType,
        breachedAt: Date.now(),
        timeOverBreach: status.timeOverBreach,
        acknowledged: false
      })
    }
  })

  return breaches
}
