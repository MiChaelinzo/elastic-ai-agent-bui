import type { Incident, Agent, ReasoningStep } from './types'

export interface AgentPerformanceMetrics {
  agentId: string
  agentName: string
  agentType: string
  totalIncidents: number
  successfulResolutions: number
  failedResolutions: number
  averageConfidence: number
  averageResponseTime: number
  totalThinkingTime: number
  successRate: number
  lastActive: number
  topStrengths: string[]
  areasForImprovement: string[]
  recentActivity: AgentActivity[]
  collaborationScore: number
  efficiencyTrend: 'improving' | 'stable' | 'declining'
}

export interface AgentActivity {
  timestamp: number
  incidentId: string
  incidentTitle: string
  action: string
  confidence: number
  duration: number
  outcome: 'success' | 'pending' | 'failed'
}

export interface PerformanceComparison {
  metric: string
  values: { agentName: string; value: number; trend: number }[]
}

export interface TeamPerformanceMetrics {
  totalIncidentsHandled: number
  averageResolutionTime: number
  teamSuccessRate: number
  topPerformer: string
  mostImprovedAgent: string
  collaborationEfficiency: number
  avgConfidence: number
}

export function calculateAgentPerformance(
  agent: Agent,
  incidents: Incident[]
): AgentPerformanceMetrics {
  const agentIncidents = incidents.filter(inc => 
    inc.assignedAgents.includes(agent.type)
  )

  const totalIncidents = agentIncidents.length
  const successfulResolutions = agentIncidents.filter(
    inc => inc.status === 'resolved'
  ).length
  const failedResolutions = agentIncidents.filter(
    inc => inc.status === 'failed'
  ).length

  const agentSteps = agentIncidents.flatMap(inc =>
    inc.reasoningSteps.filter(step => step.agentType === agent.type)
  )

  const totalThinkingTime = agentSteps.reduce(
    (sum, step) => sum + (step.timestamp ? 1000 : 0),
    0
  )
  const averageResponseTime = totalIncidents > 0 
    ? totalThinkingTime / totalIncidents 
    : 0

  const confidences = agentSteps
    .filter(step => step.confidence !== undefined)
    .map(step => step.confidence!)
  const averageConfidence = confidences.length > 0
    ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
    : 0

  const successRate = totalIncidents > 0
    ? (successfulResolutions / totalIncidents) * 100
    : 0

  const lastActive = agentIncidents.length > 0
    ? Math.max(...agentIncidents.map(inc => inc.updatedAt))
    : Date.now()

  const recentActivity: AgentActivity[] = agentIncidents
    .slice(0, 10)
    .map(inc => ({
      timestamp: inc.updatedAt,
      incidentId: inc.id,
      incidentTitle: inc.title,
      action: `Processed ${inc.severity} severity incident`,
      confidence: averageConfidence,
      duration: inc.metricsImpact?.timeToResolve || 0,
      outcome: inc.status === 'resolved' ? 'success' : 
               inc.status === 'failed' ? 'failed' : 'pending'
    }))

  const topStrengths: string[] = []
  const areasForImprovement: string[] = []

  if (averageConfidence >= 85) {
    topStrengths.push('High confidence decision-making')
  } else if (averageConfidence < 70) {
    areasForImprovement.push('Improve decision confidence')
  }

  if (successRate >= 90) {
    topStrengths.push('Excellent success rate')
  } else if (successRate < 70) {
    areasForImprovement.push('Increase resolution success rate')
  }

  if (averageResponseTime < 2000) {
    topStrengths.push('Fast response time')
  } else if (averageResponseTime > 5000) {
    areasForImprovement.push('Reduce processing time')
  }

  const collaborationScore = calculateCollaborationScore(agent, incidents)
  
  const efficiencyTrend = calculateEfficiencyTrend(agentIncidents)

  return {
    agentId: agent.id,
    agentName: agent.name,
    agentType: agent.type,
    totalIncidents,
    successfulResolutions,
    failedResolutions,
    averageConfidence,
    averageResponseTime,
    totalThinkingTime,
    successRate,
    lastActive,
    topStrengths,
    areasForImprovement,
    recentActivity,
    collaborationScore,
    efficiencyTrend
  }
}

function calculateCollaborationScore(agent: Agent, incidents: Incident[]): number {
  const agentIncidents = incidents.filter(inc => 
    inc.assignedAgents.includes(agent.type)
  )

  if (agentIncidents.length === 0) return 0

  const multiAgentIncidents = agentIncidents.filter(
    inc => inc.assignedAgents.length > 1
  )

  const collaborationRate = multiAgentIncidents.length / agentIncidents.length
  const successfulCollaborations = multiAgentIncidents.filter(
    inc => inc.status === 'resolved'
  ).length

  const collaborationSuccessRate = multiAgentIncidents.length > 0
    ? successfulCollaborations / multiAgentIncidents.length
    : 0

  return Math.round((collaborationRate * 50 + collaborationSuccessRate * 50))
}

function calculateEfficiencyTrend(
  incidents: Incident[]
): 'improving' | 'stable' | 'declining' {
  if (incidents.length < 4) return 'stable'

  const sortedIncidents = [...incidents].sort((a, b) => a.createdAt - b.createdAt)
  
  const firstHalf = sortedIncidents.slice(0, Math.floor(sortedIncidents.length / 2))
  const secondHalf = sortedIncidents.slice(Math.floor(sortedIncidents.length / 2))

  const firstHalfSuccessRate = firstHalf.filter(i => i.status === 'resolved').length / firstHalf.length
  const secondHalfSuccessRate = secondHalf.filter(i => i.status === 'resolved').length / secondHalf.length

  const improvement = secondHalfSuccessRate - firstHalfSuccessRate

  if (improvement > 0.1) return 'improving'
  if (improvement < -0.1) return 'declining'
  return 'stable'
}

export function calculateTeamPerformance(
  agents: Agent[],
  incidents: Incident[]
): TeamPerformanceMetrics {
  const allMetrics = agents.map(agent => 
    calculateAgentPerformance(agent, incidents)
  )

  const totalIncidentsHandled = incidents.length
  
  const resolvedIncidents = incidents.filter(inc => inc.status === 'resolved')
  const totalResolutionTime = resolvedIncidents.reduce(
    (sum, inc) => sum + (inc.metricsImpact?.timeToResolve || 0),
    0
  )
  const averageResolutionTime = resolvedIncidents.length > 0
    ? totalResolutionTime / resolvedIncidents.length
    : 0

  const teamSuccessRate = incidents.length > 0
    ? (resolvedIncidents.length / incidents.length) * 100
    : 0

  const topPerformer = allMetrics.reduce((best, current) => 
    current.successRate > best.successRate ? current : best,
    allMetrics[0]
  )

  const mostImprovedAgent = allMetrics.reduce((best, current) => 
    current.efficiencyTrend === 'improving' ? current : best,
    allMetrics[0]
  )

  const avgCollaboration = allMetrics.reduce(
    (sum, m) => sum + m.collaborationScore,
    0
  ) / allMetrics.length

  const avgConfidence = allMetrics.reduce(
    (sum, m) => sum + m.averageConfidence,
    0
  ) / allMetrics.length

  return {
    totalIncidentsHandled,
    averageResolutionTime,
    teamSuccessRate,
    topPerformer: topPerformer?.agentName || 'N/A',
    mostImprovedAgent: mostImprovedAgent?.agentName || 'N/A',
    collaborationEfficiency: Math.round(avgCollaboration),
    avgConfidence: Math.round(avgConfidence)
  }
}

export function generatePerformanceComparisons(
  agents: Agent[],
  incidents: Incident[]
): PerformanceComparison[] {
  const allMetrics = agents.map(agent => 
    calculateAgentPerformance(agent, incidents)
  )

  return [
    {
      metric: 'Success Rate',
      values: allMetrics.map(m => ({
        agentName: m.agentName,
        value: m.successRate,
        trend: m.efficiencyTrend === 'improving' ? 1 : 
               m.efficiencyTrend === 'declining' ? -1 : 0
      }))
    },
    {
      metric: 'Average Confidence',
      values: allMetrics.map(m => ({
        agentName: m.agentName,
        value: m.averageConfidence,
        trend: 0
      }))
    },
    {
      metric: 'Collaboration Score',
      values: allMetrics.map(m => ({
        agentName: m.agentName,
        value: m.collaborationScore,
        trend: 0
      }))
    },
    {
      metric: 'Response Time (ms)',
      values: allMetrics.map(m => ({
        agentName: m.agentName,
        value: m.averageResponseTime,
        trend: 0
      }))
    }
  ]
}
