import type { Incident, ReasoningStep } from './types'

export type TimelineEventType = 
  | 'created'
  | 'status_changed'
  | 'severity_changed'
  | 'agent_assigned'
  | 'analysis_started'
  | 'analysis_completed'
  | 'solution_proposed'
  | 'approval_requested'
  | 'approved'
  | 'rejected'
  | 'resolution_started'
  | 'resolved'
  | 'failed'
  | 'comment_added'
  | 'escalated'
  | 'correlated'
  | 'metric_spike'
  | 'dependency_affected'

export interface TimelineEvent {
  id: string
  incidentId: string
  type: TimelineEventType
  timestamp: number
  actor?: string
  actorType: 'user' | 'agent' | 'system'
  title: string
  description: string
  metadata?: Record<string, any>
  relatedEvents?: string[]
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export interface EventCorrelation {
  eventId: string
  relatedEventIds: string[]
  correlationType: 'causal' | 'temporal' | 'contextual'
  confidence: number
  explanation: string
}

export function createTimelineEvent(
  incidentId: string,
  type: TimelineEventType,
  title: string,
  description: string,
  actor?: string,
  actorType: 'user' | 'agent' | 'system' = 'system',
  metadata?: Record<string, any>
): TimelineEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    incidentId,
    type,
    timestamp: Date.now(),
    actor,
    actorType,
    title,
    description,
    metadata
  }
}

export function generateIncidentTimeline(incident: Incident): TimelineEvent[] {
  const events: TimelineEvent[] = []

  events.push(createTimelineEvent(
    incident.id,
    'created',
    'Incident Created',
    `${incident.severity.toUpperCase()} severity incident: ${incident.title}`,
    undefined,
    'system',
    { severity: incident.severity }
  ))

  if (incident.assignedAgents.length > 0) {
    incident.assignedAgents.forEach(agentType => {
      events.push(createTimelineEvent(
        incident.id,
        'agent_assigned',
        `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent Assigned`,
        `${agentType} agent began analysis`,
        agentType,
        'agent',
        { agentType }
      ))
    })
  }

  incident.reasoningSteps.forEach(step => {
    events.push(createTimelineEvent(
      incident.id,
      'analysis_completed',
      `${step.agentType} Analysis`,
      step.thought,
      step.agentType,
      'agent',
      { confidence: step.confidence, tool: step.tool, result: step.result }
    ))
  })

  if (incident.proposedSolution) {
    events.push(createTimelineEvent(
      incident.id,
      'solution_proposed',
      'Solution Proposed',
      incident.proposedSolution,
      undefined,
      'agent'
    ))
  }

  if (incident.requiresApproval) {
    events.push(createTimelineEvent(
      incident.id,
      'approval_requested',
      'Approval Required',
      incident.approvalReason || 'Manual approval required',
      undefined,
      'system',
      { confidence: incident.lowestConfidence }
    ))
  }

  if (incident.approvedBy) {
    events.push(createTimelineEvent(
      incident.id,
      'approved',
      'Resolution Approved',
      `Approved by ${incident.approvedBy}`,
      incident.approvedBy,
      'user'
    ))
  }

  if (incident.status === 'resolved' && incident.resolution) {
    events.push(createTimelineEvent(
      incident.id,
      'resolved',
      'Incident Resolved',
      incident.resolution,
      undefined,
      'system',
      { metricsImpact: incident.metricsImpact }
    ))
  }

  if (incident.status === 'failed') {
    events.push(createTimelineEvent(
      incident.id,
      'failed',
      'Resolution Failed',
      incident.resolution || 'Resolution workflow failed',
      undefined,
      'system'
    ))
  }

  return events.sort((a, b) => a.timestamp - b.timestamp)
}

export function correlateTimelineEvents(events: TimelineEvent[]): EventCorrelation[] {
  const correlations: EventCorrelation[] = []

  events.forEach((event, index) => {
    const relatedEvents: string[] = []

    for (let i = index + 1; i < events.length; i++) {
      const nextEvent = events[i]
      const timeDiff = nextEvent.timestamp - event.timestamp

      if (timeDiff < 5000) {
        relatedEvents.push(nextEvent.id)
      }

      if (
        (event.type === 'analysis_completed' && nextEvent.type === 'solution_proposed') ||
        (event.type === 'approval_requested' && nextEvent.type === 'approved') ||
        (event.type === 'approved' && nextEvent.type === 'resolved')
      ) {
        relatedEvents.push(nextEvent.id)
        correlations.push({
          eventId: event.id,
          relatedEventIds: [nextEvent.id],
          correlationType: 'causal',
          confidence: 0.95,
          explanation: `${event.type} directly led to ${nextEvent.type}`
        })
      }
    }

    if (relatedEvents.length > 0 && correlations.every(c => c.eventId !== event.id)) {
      correlations.push({
        eventId: event.id,
        relatedEventIds: relatedEvents,
        correlationType: 'temporal',
        confidence: 0.75,
        explanation: 'Events occurred within close temporal proximity'
      })
    }
  })

  return correlations
}

export function getEventIcon(type: TimelineEventType): string {
  const iconMap: Record<TimelineEventType, string> = {
    created: 'Plus',
    status_changed: 'ArrowsClockwise',
    severity_changed: 'Warning',
    agent_assigned: 'Robot',
    analysis_started: 'MagnifyingGlass',
    analysis_completed: 'CheckCircle',
    solution_proposed: 'Lightbulb',
    approval_requested: 'ShieldCheck',
    approved: 'ThumbsUp',
    rejected: 'ThumbsDown',
    resolution_started: 'Play',
    resolved: 'CheckCircle',
    failed: 'XCircle',
    comment_added: 'ChatCircle',
    escalated: 'ArrowUp',
    correlated: 'GitBranch',
    metric_spike: 'ChartLine',
    dependency_affected: 'Graph'
  }
  return iconMap[type] || 'Circle'
}

export function getEventColor(type: TimelineEventType): string {
  const colorMap: Record<TimelineEventType, string> = {
    created: 'text-primary',
    status_changed: 'text-muted-foreground',
    severity_changed: 'text-warning',
    agent_assigned: 'text-accent',
    analysis_started: 'text-primary',
    analysis_completed: 'text-success',
    solution_proposed: 'text-warning',
    approval_requested: 'text-warning',
    approved: 'text-success',
    rejected: 'text-destructive',
    resolution_started: 'text-primary',
    resolved: 'text-success',
    failed: 'text-destructive',
    comment_added: 'text-muted-foreground',
    escalated: 'text-destructive',
    correlated: 'text-accent',
    metric_spike: 'text-warning',
    dependency_affected: 'text-destructive'
  }
  return colorMap[type] || 'text-muted-foreground'
}
