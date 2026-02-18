import type { Incident, Agent, ReasoningStep } from './types'

  agentName: string
  totalIncidents:
  failedResolutions
  averageResponseTi
  successRate: number
  topStrengths: string[]
  recentActivity: AgentActi
  efficiencyTrend: 'improvi

  timestamp: number
  incidentTitle: stri
  confidence: number
  outcome: 'success' | '

  metric: string
}
export interface TeamPerformanceMetrics {
 

  collaborationEfficiency: numbe
}
export function calc
  incidents: Incident[]
  const agentInc
  )
  const totalIncid
    inc => inc.status === 'resolved'
 

  const agentSteps = agentIncidents.flat
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


  const totalIncidents = agentIncidents.length
  const successfulResolutions = agentIncidents.filter(
    inc => inc.status === 'resolved'
  ).length
  const failedResolutions = agentIncidents.filter(
    inc => inc.status === 'failed'
  ).length

  const agentSteps = agentIncidents.flatMap(inc =>
    inc.reasoningSteps.filter(step => step.agent === agent.type)
  )

    }))
  const topStrengths: string[] = []

   
    areasForImprovement.push('Improve decision co

    top


    topStrengths.push('Fast response time')
    areasForImprovement.push('Redu

  


    agentType: agent.type,
    successfulResolutions,
    ave

    lastActive,
    areasForImprovement,
    collaboratio


  const agentInci
  )
  if (agentIncidents.length ===
  const multiAgentInciden
  )
  const collaborationRate = multiAgentIncidents.length / age
    inc => inc.status === 'resolved'

    ? successfulCollaborations / multiAgentIncidents.le

}

): 'improving' | 'stable' | 'declin


  const secondHalf = sortedIncid
  const firstHalfSuccessRate = firstHalf.filter(i => i.s


  i

export function calculateT
  incidents: Incident[]
  const allMetrics = agents.map(
  )
  c

    (sum, inc) => sum + (inc.metric
  )
    ? totalResolutionTime / resolvedIncide

   

    current.successRate > best.successRate ? current : best,
  
  const mostImprovedAgent = allMetrics.reduce((best, current) => 


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
