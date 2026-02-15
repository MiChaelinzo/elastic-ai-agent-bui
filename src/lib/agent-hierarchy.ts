import type { Agent, Incident, ReasoningStep } from './types'

export type AgentRole = 'supervisor' | 'specialist' | 'executor' | 'monitor'
export type AgentCapability = 'detection' | 'analysis' | 'resolution' | 'verification' | 'coordination' | 'learning'

export interface EnhancedAgent extends Agent {
  role: AgentRole
  capabilities: AgentCapability[]
  performance: {
    successRate: number
    avgResponseTime: number
    tasksCompleted: number
    errorCount: number
  }
  learningData: {
    improvementRate: number
    confidenceTrend: 'improving' | 'stable' | 'declining'
    lastTrainingDate: number
  }
  collaborationScore: number
  specialization?: string[]
}

export interface AgentTeam {
  id: string
  name: string
  supervisor: EnhancedAgent
  members: EnhancedAgent[]
  focus: string
  performance: {
    teamEfficiency: number
    collaborationScore: number
    incidentsHandled: number
  }
}

export interface AgentMessage {
  id: string
  from: string
  to: string
  timestamp: number
  type: 'request' | 'response' | 'insight' | 'alert' | 'coordination'
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface CollaborationSession {
  id: string
  incidentId: string
  participants: string[]
  startTime: number
  endTime?: number
  messages: AgentMessage[]
  insights: string[]
  decisions: Array<{
    timestamp: number
    decision: string
    madeBy: string
    approvedBy: string[]
  }>
}

export function createEnhancedAgent(
  baseAgent: Agent,
  role: AgentRole,
  capabilities: AgentCapability[]
): EnhancedAgent {
  return {
    ...baseAgent,
    role,
    capabilities,
    performance: {
      successRate: 0.95,
      avgResponseTime: 2500,
      tasksCompleted: 0,
      errorCount: 0
    },
    learningData: {
      improvementRate: 0.05,
      confidenceTrend: 'stable',
      lastTrainingDate: Date.now()
    },
    collaborationScore: 0.85,
    specialization: []
  }
}

export function createAgentTeam(
  name: string,
  supervisor: EnhancedAgent,
  members: EnhancedAgent[],
  focus: string
): AgentTeam {
  return {
    id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    supervisor,
    members,
    focus,
    performance: {
      teamEfficiency: 0.88,
      collaborationScore: 0.82,
      incidentsHandled: 0
    }
  }
}

export function calculateAgentSynergy(agent1: EnhancedAgent, agent2: EnhancedAgent): number {
  const capabilityOverlap = agent1.capabilities.filter(c => 
    agent2.capabilities.includes(c)
  ).length
  
  const complementaryScore = (agent1.capabilities.length + agent2.capabilities.length - capabilityOverlap) / 
    (agent1.capabilities.length + agent2.capabilities.length)
  
  const performanceScore = (agent1.performance.successRate + agent2.performance.successRate) / 2
  
  return (complementaryScore * 0.6 + performanceScore * 0.4) * 100
}

export function recommendTeamForIncident(
  incident: Incident,
  availableAgents: EnhancedAgent[]
): EnhancedAgent[] {
  const severityWeights = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }
  
  const weight = severityWeights[incident.severity]
  const teamSize = Math.min(weight + 1, availableAgents.length)
  
  const scored = availableAgents.map(agent => {
    let score = agent.performance.successRate * 100
    
    if (incident.severity === 'critical' && agent.role === 'supervisor') {
      score += 20
    }
    
    if (agent.capabilities.includes('detection') && incident.status === 'new') {
      score += 15
    }
    
    if (agent.capabilities.includes('resolution') && incident.status === 'in-progress') {
      score += 15
    }
    
    score -= (agent.performance.avgResponseTime / 1000) * 2
    
    return { agent, score }
  })
  
  scored.sort((a, b) => b.score - a.score)
  
  return scored.slice(0, teamSize).map(s => s.agent)
}

export function generateAgentMessage(
  from: string,
  to: string,
  type: AgentMessage['type'],
  content: string,
  priority: AgentMessage['priority'] = 'medium'
): AgentMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    from,
    to,
    timestamp: Date.now(),
    type,
    content,
    priority
  }
}

export function createCollaborationSession(
  incidentId: string,
  participants: string[]
): CollaborationSession {
  return {
    id: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    incidentId,
    participants,
    startTime: Date.now(),
    messages: [],
    insights: [],
    decisions: []
  }
}

export async function simulateAgentCollaboration(
  incident: Incident,
  team: EnhancedAgent[],
  onMessage: (message: AgentMessage) => void
): Promise<CollaborationSession> {
  const session = createCollaborationSession(incident.id, team.map(a => a.id))
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const supervisor = team.find(a => a.role === 'supervisor') || team[0]
  const specialists = team.filter(a => a.role !== 'supervisor')
  
  const msg1 = generateAgentMessage(
    supervisor.id,
    'team',
    'coordination',
    `Analyzing ${incident.severity} severity incident: "${incident.title}". Assigning roles to team members.`,
    incident.severity === 'critical' ? 'critical' : 'high'
  )
  session.messages.push(msg1)
  onMessage(msg1)
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  for (const agent of specialists.slice(0, 2)) {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const msg = generateAgentMessage(
      agent.id,
      supervisor.id,
      'response',
      `Acknowledged. Beginning ${agent.capabilities[0]} analysis. Current confidence: ${Math.floor(Math.random() * 15 + 80)}%`,
      'medium'
    )
    session.messages.push(msg)
    onMessage(msg)
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const insightMsg = generateAgentMessage(
    specialists[0]?.id || supervisor.id,
    'team',
    'insight',
    `Pattern detected: Similar to ${Math.floor(Math.random() * 5 + 3)} previous incidents. Recommended action: ${['Restart service', 'Clear cache', 'Scale resources', 'Update configuration'][Math.floor(Math.random() * 4)]}`,
    'high'
  )
  session.messages.push(insightMsg)
  onMessage(insightMsg)
  session.insights.push(insightMsg.content)
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const decisionMsg = generateAgentMessage(
    supervisor.id,
    'team',
    'coordination',
    `Decision approved: Proceeding with automated resolution. All agents coordinate execution.`,
    'high'
  )
  session.messages.push(decisionMsg)
  onMessage(decisionMsg)
  
  session.decisions.push({
    timestamp: Date.now(),
    decision: 'Execute automated resolution workflow',
    madeBy: supervisor.id,
    approvedBy: team.map(a => a.id)
  })
  
  return session
}

export function evaluateTeamPerformance(team: AgentTeam): {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
} {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const recommendations: string[] = []
  
  if (team.performance.teamEfficiency > 0.85) {
    strengths.push('High team efficiency - consistently meeting performance targets')
  } else if (team.performance.teamEfficiency < 0.70) {
    weaknesses.push('Low team efficiency - performance below optimal levels')
    recommendations.push('Consider rebalancing team member roles and responsibilities')
  }
  
  if (team.performance.collaborationScore > 0.80) {
    strengths.push('Strong collaboration - effective communication between agents')
  } else if (team.performance.collaborationScore < 0.65) {
    weaknesses.push('Poor collaboration - agents working in silos')
    recommendations.push('Implement more frequent knowledge sharing sessions')
  }
  
  const avgMemberPerformance = team.members.reduce((sum, m) => 
    sum + m.performance.successRate, 0
  ) / team.members.length
  
  if (avgMemberPerformance > 0.90) {
    strengths.push('Excellent individual agent performance across team')
  } else if (avgMemberPerformance < 0.75) {
    weaknesses.push('Several agents underperforming')
    recommendations.push('Schedule retraining for underperforming agents')
  }
  
  if (team.members.length < 3) {
    recommendations.push('Consider expanding team size for better coverage')
  }
  
  return { strengths, weaknesses, recommendations }
}
