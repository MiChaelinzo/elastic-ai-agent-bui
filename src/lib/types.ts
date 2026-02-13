export type AgentType = 'detector' | 'analyzer' | 'resolver' | 'verifier'

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'complete' | 'error'

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'

export type IncidentStatus = 'new' | 'in-progress' | 'resolved' | 'failed' | 'pending-approval'

export type ToolType = 'esql' | 'search' | 'workflow'

export interface Agent {
  id: string
  type: AgentType
  name: string
  description: string
  status: AgentStatus
  confidence?: number
}

export interface ReasoningStep {
  id: string
  agentType: AgentType
  timestamp: number
  thought: string
  tool?: ToolType
  query?: string
  result?: string
  confidence: number
}

export interface Incident {
  id: string
  title: string
  description: string
  severity: IncidentSeverity
  status: IncidentStatus
  createdAt: number
  updatedAt: number
  detectedBy?: string
  assignedAgents: AgentType[]
  reasoningSteps: ReasoningStep[]
  proposedSolution?: string
  resolution?: string
  templateId?: string
  requiresApproval?: boolean
  approvalReason?: string
  approvedBy?: string
  approvedAt?: number
  lowestConfidence?: number
  metricsImpact?: {
    timeToDetect: number
    timeToResolve: number
    stepsAutomated: number
  }
}

export interface WorkflowStep {
  id: string
  agentType: AgentType
  name: string
  status: 'pending' | 'active' | 'complete' | 'failed'
  reasoning?: string
  tool?: ToolType
}

export interface Workflow {
  id: string
  name: string
  description: string
  incidentId: string
  steps: WorkflowStep[]
  currentStep: number
  status: 'running' | 'paused' | 'complete' | 'failed'
  startedAt: number
  completedAt?: number
}

export interface ConfidenceSettings {
  minConfidenceThreshold: number
  requireApprovalBelowThreshold: boolean
  autoExecuteAboveThreshold: boolean
  criticalIncidentThreshold: number
  notifyOnLowConfidence: boolean
}
