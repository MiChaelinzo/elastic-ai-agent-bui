import type { Incident, IncidentSeverity } from './types'
import { getSimulatedCurrentTime } from './utils'

export interface PriorityQueueSettings {
  enableAutoPrioritization: boolean
  enableAutoEscalation: boolean
  escalationIntervalMinutes: number
  criticalEscalationMinutes: number
  highEscalationMinutes: number
  mediumEscalationMinutes: number
  enableAgeBasedPriority: boolean
  enableSLATracking: boolean
}

export interface PriorityQueueItem {
  incident: Incident
  priority: number
  queuedAt: number
  escalationCount: number
  lastEscalationAt?: number
  originalSeverity: IncidentSeverity
  slaDeadline?: number
  isOverdue: boolean
}

export interface SLAConfig {
  critical: number
  high: number
  medium: number
  low: number
}

const SEVERITY_PRIORITY: Record<IncidentSeverity, number> = {
  critical: 1000,
  high: 750,
  medium: 500,
  low: 250
}

const DEFAULT_SLA_MINUTES: SLAConfig = {
  critical: 15,
  high: 60,
  medium: 240,
  low: 1440
}

export const defaultPrioritySettings: PriorityQueueSettings = {
  enableAutoPrioritization: true,
  enableAutoEscalation: true,
  escalationIntervalMinutes: 15,
  criticalEscalationMinutes: 5,
  highEscalationMinutes: 15,
  mediumEscalationMinutes: 30,
  enableAgeBasedPriority: true,
  enableSLATracking: true
}

export function calculateIncidentPriority(
  incident: Incident,
  settings: PriorityQueueSettings,
  escalationCount: number = 0,
  queuedAt: number = getSimulatedCurrentTime()
): number {
  let priority = SEVERITY_PRIORITY[incident.severity]
  
  if (settings.enableAgeBasedPriority) {
    const ageMinutes = (getSimulatedCurrentTime() - queuedAt) / (1000 * 60)
    const ageFactor = Math.floor(ageMinutes / 5) * 10
    priority += ageFactor
  }
  
  priority += escalationCount * 100
  
  if (incident.status === 'pending-approval') {
    priority += 200
  }
  
  if (incident.requiresApproval && incident.lowestConfidence && incident.lowestConfidence < 50) {
    priority += 150
  }
  
  return priority
}

export function shouldEscalateIncident(
  queueItem: PriorityQueueItem,
  settings: PriorityQueueSettings
): boolean {
  if (!settings.enableAutoEscalation) return false
  
  const now = getSimulatedCurrentTime()
  const queuedMinutes = (now - queueItem.queuedAt) / (1000 * 60)
  const lastEscalation = queueItem.lastEscalationAt || queueItem.queuedAt
  const minutesSinceLastEscalation = (now - lastEscalation) / (1000 * 60)
  
  const thresholds: Record<IncidentSeverity, number> = {
    critical: settings.criticalEscalationMinutes,
    high: settings.highEscalationMinutes,
    medium: settings.mediumEscalationMinutes,
    low: settings.escalationIntervalMinutes
  }
  
  const threshold = thresholds[queueItem.incident.severity]
  
  if (queueItem.escalationCount === 0) {
    return queuedMinutes >= threshold
  }
  
  return minutesSinceLastEscalation >= threshold
}

export function escalateIncident(
  queueItem: PriorityQueueItem,
  settings: PriorityQueueSettings
): { updatedItem: PriorityQueueItem; shouldUpgradeSeverity: boolean; newSeverity?: IncidentSeverity } {
  const updatedItem: PriorityQueueItem = {
    ...queueItem,
    escalationCount: queueItem.escalationCount + 1,
    lastEscalationAt: getSimulatedCurrentTime(),
    priority: calculateIncidentPriority(
      queueItem.incident,
      settings,
      queueItem.escalationCount + 1,
      queueItem.queuedAt
    )
  }
  
  let shouldUpgradeSeverity = false
  let newSeverity: IncidentSeverity | undefined
  
  if (updatedItem.escalationCount >= 3) {
    const severityLadder: IncidentSeverity[] = ['low', 'medium', 'high', 'critical']
    const currentIndex = severityLadder.indexOf(queueItem.incident.severity)
    
    if (currentIndex < severityLadder.length - 1) {
      shouldUpgradeSeverity = true
      newSeverity = severityLadder[currentIndex + 1]
    }
  }
  
  return { updatedItem, shouldUpgradeSeverity, newSeverity }
}

export function calculateSLADeadline(
  incident: Incident,
  slaConfig: SLAConfig = DEFAULT_SLA_MINUTES
): number {
  const slaMinutes = slaConfig[incident.severity]
  return incident.createdAt + (slaMinutes * 60 * 1000)
}

export function isIncidentOverdue(
  incident: Incident,
  slaDeadline: number
): boolean {
  if (incident.status === 'resolved' || incident.status === 'failed') {
    return false
  }
  return getSimulatedCurrentTime() > slaDeadline
}

export function sortQueueByPriority(queue: PriorityQueueItem[]): PriorityQueueItem[] {
  return [...queue].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1
    if (!a.isOverdue && b.isOverdue) return 1
    
    return b.priority - a.priority
  })
}

export function createQueueItem(
  incident: Incident,
  settings: PriorityQueueSettings
): PriorityQueueItem {
  const queuedAt = getSimulatedCurrentTime()
  const slaDeadline = settings.enableSLATracking 
    ? calculateSLADeadline(incident)
    : undefined
  
  return {
    incident,
    priority: calculateIncidentPriority(incident, settings, 0, queuedAt),
    queuedAt,
    escalationCount: 0,
    originalSeverity: incident.severity,
    slaDeadline,
    isOverdue: slaDeadline ? isIncidentOverdue(incident, slaDeadline) : false
  }
}

export function getQueuePosition(
  incidentId: string,
  queue: PriorityQueueItem[]
): number {
  return queue.findIndex(item => item.incident.id === incidentId) + 1
}

export function getEstimatedWaitTime(
  position: number,
  averageProcessingTimeMinutes: number = 5
): number {
  return (position - 1) * averageProcessingTimeMinutes
}

export function getQueueMetrics(queue: PriorityQueueItem[]) {
  const totalInQueue = queue.length
  const criticalCount = queue.filter(item => item.incident.severity === 'critical').length
  const overdueCount = queue.filter(item => item.isOverdue).length
  const escalatedCount = queue.filter(item => item.escalationCount > 0).length
  const awaitingApproval = queue.filter(item => item.incident.status === 'pending-approval').length
  
  const avgWaitTime = queue.reduce((sum, item) => {
    return sum + ((getSimulatedCurrentTime() - item.queuedAt) / (1000 * 60))
  }, 0) / (totalInQueue || 1)
  
  return {
    totalInQueue,
    criticalCount,
    overdueCount,
    escalatedCount,
    awaitingApproval,
    avgWaitTimeMinutes: Math.round(avgWaitTime)
  }
}
