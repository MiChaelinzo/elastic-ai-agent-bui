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
    enabled: true
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
    enabled: true
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
    enabled: true
  },
  {
    id: 'sla-low',
    name: 'Low Priority SLA',
    description: 'SLA for low severity incidents',
    severity: 'low',
    responseTime: 4 * 60 * 60 * 1000,
    resolutionTime: 48 * 60 * 60 * 1000,
    businessHoursOnly: true,
    enabled: true
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
    status
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

export function getSLAComplianceRate(incidents: Incident[], policies: SLAPolicy[]): {
  overall: number
  bySeverity: Record<IncidentSeverity, number>
  totalIncidents: number
  compliantIncidents: number
} {
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved')
  
  if (resolvedIncidents.length === 0) {
    return {
      overall: 100,
      bySeverity: { critical: 100, high: 100, medium: 100, low: 100 },
      totalIncidents: 0,
      compliantIncidents: 0
    }
  }

  let compliantCount = 0
  const bySeverity: Record<IncidentSeverity, { total: number, compliant: number }> = {
    critical: { total: 0, compliant: 0 },
    high: { total: 0, compliant: 0 },
    medium: { total: 0, compliant: 0 },
    low: { total: 0, compliant: 0 }
  }

  resolvedIncidents.forEach(incident => {
    const policy = getSLAPolicy(incident.severity, policies)
    if (!policy) return

    const status = calculateSLAStatus(incident, policy, incident.updatedAt)
    bySeverity[incident.severity].total++

    if (!status.responseBreached && !status.resolutionBreached) {
      compliantCount++
      bySeverity[incident.severity].compliant++
    }
  })

  const bySeverityRates: Record<IncidentSeverity, number> = {
    critical: bySeverity.critical.total > 0 
      ? (bySeverity.critical.compliant / bySeverity.critical.total) * 100 
      : 100,
    high: bySeverity.high.total > 0 
      ? (bySeverity.high.compliant / bySeverity.high.total) * 100 
      : 100,
    medium: bySeverity.medium.total > 0 
      ? (bySeverity.medium.compliant / bySeverity.medium.total) * 100 
      : 100,
    low: bySeverity.low.total > 0 
      ? (bySeverity.low.compliant / bySeverity.low.total) * 100 
      : 100
  }

  return {
    overall: (compliantCount / resolvedIncidents.length) * 100,
    bySeverity: bySeverityRates,
    totalIncidents: resolvedIncidents.length,
    compliantIncidents: compliantCount
  }
}
