import type { Incident, IncidentSeverity } from './types'

export type EscalationActionType = 
  | 'notify_team'
  | 'upgrade_severity'
  | 'assign_senior'
  | 'trigger_workflow'
  | 'page_oncall'
  | 'create_ticket'
  | 'send_webhook'
  | 'auto_approve'

export type EscalationTrigger = 'breach' | 'at-risk' | 'time-threshold' | 'manual'

export interface EscalationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  trigger: EscalationTrigger
  conditions: {
    severities?: IncidentSeverity[]
    breachType?: ('response' | 'resolution' | 'both')[]
    timeOverThreshold?: number
    atRiskThreshold?: number
  }
  actions: EscalationAction[]
  cooldownPeriod?: number
  maxExecutions?: number
}

export interface EscalationAction {
  type: EscalationActionType
  priority: number
  config: {
    team?: string
    newSeverity?: IncidentSeverity
    assignee?: string
    workflowId?: string
    webhookUrl?: string
    message?: string
    channels?: string[]
  }
}

export interface EscalationExecution {
  id: string
  ruleId: string
  incidentId: string
  breachId?: string
  triggeredAt: number
  trigger: EscalationTrigger
  actionsExecuted: {
    actionType: EscalationActionType
    executedAt: number
    success: boolean
    result?: string
    error?: string
  }[]
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
  completedAt?: number
}

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
  escalationRules?: string[]
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
  escalationExecutions?: string[]
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

export const defaultEscalationRules: EscalationRule[] = [
  {
    id: 'escalation-critical-breach',
    name: 'Critical Incident Breach Response',
    description: 'Immediate escalation for critical incident SLA breaches',
    enabled: true,
    trigger: 'breach',
    conditions: {
      severities: ['critical'],
      breachType: ['response', 'resolution', 'both']
    },
    actions: [
      {
        type: 'page_oncall',
        priority: 1,
        config: {
          team: 'incident-response',
          message: 'URGENT: Critical incident SLA breach detected'
        }
      },
      {
        type: 'notify_team',
        priority: 2,
        config: {
          team: 'engineering-leads',
          channels: ['slack', 'email'],
          message: 'Critical incident requires immediate attention'
        }
      },
      {
        type: 'assign_senior',
        priority: 3,
        config: {
          assignee: 'senior-engineer'
        }
      },
      {
        type: 'trigger_workflow',
        priority: 4,
        config: {
          workflowId: 'emergency-response'
        }
      }
    ],
    cooldownPeriod: 30 * 60 * 1000,
    maxExecutions: 3
  },
  {
    id: 'escalation-high-at-risk',
    name: 'High Priority At-Risk Alert',
    description: 'Proactive escalation when high priority incidents are at risk',
    enabled: true,
    trigger: 'at-risk',
    conditions: {
      severities: ['high', 'critical'],
      atRiskThreshold: 75
    },
    actions: [
      {
        type: 'notify_team',
        priority: 1,
        config: {
          team: 'incident-response',
          channels: ['slack'],
          message: 'High priority incident approaching SLA deadline'
        }
      },
      {
        type: 'trigger_workflow',
        priority: 2,
        config: {
          workflowId: 'escalation-prep'
        }
      }
    ],
    cooldownPeriod: 60 * 60 * 1000,
    maxExecutions: 2
  },
  {
    id: 'escalation-upgrade-severity',
    name: 'Auto-Upgrade After Time Threshold',
    description: 'Automatically upgrade severity if incident exceeds time threshold',
    enabled: true,
    trigger: 'time-threshold',
    conditions: {
      severities: ['medium', 'high'],
      timeOverThreshold: 2 * 60 * 60 * 1000
    },
    actions: [
      {
        type: 'upgrade_severity',
        priority: 1,
        config: {
          newSeverity: 'high',
          message: 'Auto-upgraded due to extended resolution time'
        }
      },
      {
        type: 'notify_team',
        priority: 2,
        config: {
          team: 'operations',
          channels: ['slack', 'email'],
          message: 'Incident severity upgraded due to SLA risk'
        }
      }
    ],
    cooldownPeriod: 3 * 60 * 60 * 1000,
    maxExecutions: 1
  },
  {
    id: 'escalation-auto-approve',
    name: 'Auto-Approve Critical Breaches',
    description: 'Automatically approve agent actions for breached critical incidents',
    enabled: true,
    trigger: 'breach',
    conditions: {
      severities: ['critical'],
      breachType: ['resolution', 'both']
    },
    actions: [
      {
        type: 'auto_approve',
        priority: 1,
        config: {
          message: 'Auto-approved due to critical SLA breach'
        }
      },
      {
        type: 'notify_team',
        priority: 2,
        config: {
          team: 'incident-response',
          channels: ['slack'],
          message: 'Agent actions auto-approved for breached critical incident'
        }
      }
    ],
    maxExecutions: 1
  },
  {
    id: 'escalation-webhook',
    name: 'External System Integration',
    description: 'Trigger webhooks for external ticketing and ITSM systems',
    enabled: false,
    trigger: 'breach',
    conditions: {
      severities: ['critical', 'high'],
      breachType: ['resolution', 'both']
    },
    actions: [
      {
        type: 'send_webhook',
        priority: 1,
        config: {
          webhookUrl: 'https://example.com/api/sla-breach',
          message: 'SLA breach webhook trigger'
        }
      },
      {
        type: 'create_ticket',
        priority: 2,
        config: {
          team: 'support',
          message: 'Create escalation ticket in external system'
        }
      }
    ]
  }
]

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
    target: 99.5,
    escalationRules: ['escalation-critical-breach', 'escalation-auto-approve', 'escalation-webhook']
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
    target: 98.0,
    escalationRules: ['escalation-high-at-risk', 'escalation-upgrade-severity', 'escalation-webhook']
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
    target: 95.0,
    escalationRules: ['escalation-upgrade-severity']
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
        acknowledged: false,
        escalationExecutions: []
      })
    }
  })

  return breaches
}

export function shouldTriggerEscalation(
  rule: EscalationRule,
  incident: Incident,
  status: SLAStatus,
  breach?: SLABreach,
  existingExecutions: EscalationExecution[] = []
): boolean {
  if (!rule.enabled) return false

  if (rule.conditions.severities && !rule.conditions.severities.includes(incident.severity)) {
    return false
  }

  if (rule.trigger === 'breach' && status.status !== 'breached') {
    return false
  }

  if (rule.trigger === 'at-risk' && status.status !== 'at-risk') {
    return false
  }

  if (rule.conditions.breachType && status.breachType) {
    if (!rule.conditions.breachType.includes(status.breachType)) {
      return false
    }
  }

  if (rule.conditions.atRiskThreshold && status.percentComplete < rule.conditions.atRiskThreshold) {
    return false
  }

  if (rule.conditions.timeOverThreshold && (!status.timeOverBreach || status.timeOverBreach < rule.conditions.timeOverThreshold)) {
    return false
  }

  const ruleExecutions = existingExecutions.filter(e => e.ruleId === rule.id && e.incidentId === incident.id)
  
  if (rule.maxExecutions && ruleExecutions.length >= rule.maxExecutions) {
    return false
  }

  if (rule.cooldownPeriod && ruleExecutions.length > 0) {
    const lastExecution = ruleExecutions.sort((a, b) => b.triggeredAt - a.triggeredAt)[0]
    const timeSinceLastExecution = Date.now() - lastExecution.triggeredAt
    if (timeSinceLastExecution < rule.cooldownPeriod) {
      return false
    }
  }

  return true
}

export async function executeEscalationAction(
  action: EscalationAction,
  incident: Incident,
  breach: SLABreach | undefined,
  context: {
    onUpgradeSeverity?: (newSeverity: IncidentSeverity) => void
    onAutoApprove?: () => void
    onNotifyTeam?: (team: string, message: string, channels: string[]) => void
    onTriggerWorkflow?: (workflowId: string) => void
  }
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    switch (action.type) {
      case 'upgrade_severity':
        if (action.config.newSeverity && context.onUpgradeSeverity) {
          context.onUpgradeSeverity(action.config.newSeverity)
          return {
            success: true,
            result: `Severity upgraded to ${action.config.newSeverity}`
          }
        }
        break

      case 'auto_approve':
        if (context.onAutoApprove) {
          context.onAutoApprove()
          return {
            success: true,
            result: 'Agent actions auto-approved'
          }
        }
        break

      case 'notify_team':
        if (action.config.team && action.config.message && context.onNotifyTeam) {
          const channels = action.config.channels || ['slack']
          context.onNotifyTeam(action.config.team, action.config.message, channels)
          return {
            success: true,
            result: `Team ${action.config.team} notified via ${channels.join(', ')}`
          }
        }
        break

      case 'trigger_workflow':
        if (action.config.workflowId && context.onTriggerWorkflow) {
          context.onTriggerWorkflow(action.config.workflowId)
          return {
            success: true,
            result: `Workflow ${action.config.workflowId} triggered`
          }
        }
        break

      case 'page_oncall':
        return {
          success: true,
          result: `On-call team ${action.config.team} paged`
        }

      case 'assign_senior':
        return {
          success: true,
          result: `Assigned to ${action.config.assignee}`
        }

      case 'create_ticket':
        return {
          success: true,
          result: 'External ticket created'
        }

      case 'send_webhook':
        if (action.config.webhookUrl) {
          return {
            success: true,
            result: `Webhook sent to ${action.config.webhookUrl}`
          }
        }
        break

      default:
        return {
          success: false,
          error: `Unknown action type: ${action.type}`
        }
    }

    return {
      success: false,
      error: 'Action configuration incomplete'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function executeEscalationRule(
  rule: EscalationRule,
  incident: Incident,
  breach: SLABreach | undefined,
  trigger: EscalationTrigger,
  context: {
    onUpgradeSeverity?: (newSeverity: IncidentSeverity) => void
    onAutoApprove?: () => void
    onNotifyTeam?: (team: string, message: string, channels: string[]) => void
    onTriggerWorkflow?: (workflowId: string) => void
  }
): Promise<EscalationExecution> {
  const execution: EscalationExecution = {
    id: `escalation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ruleId: rule.id,
    incidentId: incident.id,
    breachId: breach?.id,
    triggeredAt: Date.now(),
    trigger,
    actionsExecuted: [],
    status: 'executing'
  }

  const sortedActions = [...rule.actions].sort((a, b) => a.priority - b.priority)

  for (const action of sortedActions) {
    const result = await executeEscalationAction(action, incident, breach, context)
    execution.actionsExecuted.push({
      actionType: action.type,
      executedAt: Date.now(),
      success: result.success,
      result: result.result,
      error: result.error
    })
  }

  const allSuccessful = execution.actionsExecuted.every(a => a.success)
  execution.status = allSuccessful ? 'completed' : 'failed'
  execution.completedAt = Date.now()

  return execution
}

export function getApplicableEscalationRules(
  incident: Incident,
  status: SLAStatus,
  breach: SLABreach | undefined,
  allRules: EscalationRule[],
  policy: SLAPolicy,
  existingExecutions: EscalationExecution[] = []
): EscalationRule[] {
  const policyRuleIds = policy.escalationRules || []
  
  let applicableRules = allRules.filter(rule => {
    if (policyRuleIds.length > 0 && !policyRuleIds.includes(rule.id)) {
      return false
    }
    
    return shouldTriggerEscalation(rule, incident, status, breach, existingExecutions)
  })

  applicableRules = applicableRules.sort((a, b) => {
    const priorityA = Math.min(...a.actions.map(action => action.priority))
    const priorityB = Math.min(...b.actions.map(action => action.priority))
    return priorityA - priorityB
  })

  return applicableRules
}
