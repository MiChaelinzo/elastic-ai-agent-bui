import type { Incident, ReasoningStep, AgentType, ToolType, ConfidenceSettings } from './types'

export const simulateAgentReasoning = async (
  incident: Incident,
  agentType: AgentType,
  onStep: (step: ReasoningStep) => void
): Promise<string> => {
  const agentPrompts = {
    detector: `You are a Detector agent analyzing this incident: "${incident.title}". 
Identify the incident type, affected systems, and initial severity assessment. 
Use ES|QL to query recent logs and metrics. Return your analysis as a brief technical summary.`,
    
    analyzer: `You are an Analyzer agent investigating incident: "${incident.title}".
The incident has been classified. Now determine the root cause by:
1. Using ES|QL queries to correlate events
2. Searching historical incidents for patterns
3. Analyzing metrics and logs
Return a detailed root cause analysis.`,
    
    resolver: `You are a Resolver agent proposing solutions for: "${incident.title}".
Based on the analysis, suggest specific remediation steps that could be automated.
Consider: config changes, service restarts, scaling operations, or rollbacks.
Return a concrete action plan with commands/APIs to execute.`,
    
    verifier: `You are a Verifier agent validating the proposed solution for: "${incident.title}".
Review the resolver's plan for safety, completeness, and potential side effects.
Run simulation checks and validate against past successful resolutions.
Return your verification result with confidence score and any concerns.`
  }

  const tools: Record<AgentType, ToolType> = {
    detector: 'esql',
    analyzer: 'search',
    resolver: 'workflow',
    verifier: 'esql'
  }

  await new Promise(resolve => setTimeout(resolve, 800))
  
  const thinkingStep: ReasoningStep = {
    id: `step-${Date.now()}-1`,
    agentType,
    timestamp: Date.now(),
    thought: `Analyzing incident using ${tools[agentType]} tool...`,
    tool: tools[agentType],
    confidence: 0
  }
  onStep(thinkingStep)

  await new Promise(resolve => setTimeout(resolve, 1200))

  const sampleQueries = {
    detector: `FROM logs-* | WHERE @timestamp > NOW() - 1 hour AND severity >= "error" | STATS count = COUNT(*) BY service | SORT count DESC`,
    analyzer: `FROM metrics-* | WHERE @timestamp > NOW() - 24 hours AND service == "${incident.title.split(' ')[0]}" | STATS avg_response_time = AVG(response_time)`,
    resolver: `workflow: restart_service | config: update_replicas | rollback: previous_version`,
    verifier: `FROM incidents-* | WHERE resolution_status == "success" AND incident_type == "service_failure" | STATS success_rate = COUNT(*)`
  }

  const queryStep: ReasoningStep = {
    id: `step-${Date.now()}-2`,
    agentType,
    timestamp: Date.now(),
    thought: `Executing ${tools[agentType]} query to gather data`,
    tool: tools[agentType],
    query: sampleQueries[agentType],
    confidence: 50
  }
  onStep(queryStep)

  await new Promise(resolve => setTimeout(resolve, 1500))

  const promptText = `${agentPrompts[agentType]}

Context:
- Severity: ${incident.severity}
- Status: ${incident.status}
- Created: ${new Date(incident.createdAt).toLocaleString()}

Provide a concise technical response (2-3 sentences) from the perspective of a ${agentType} agent.`

  const response = await window.spark.llm(promptText, 'gpt-4o-mini')

  const confidence = Math.floor(Math.random() * 20) + 80

  const resultStep: ReasoningStep = {
    id: `step-${Date.now()}-3`,
    agentType,
    timestamp: Date.now(),
    thought: `Analysis complete`,
    tool: tools[agentType],
    result: response,
    confidence
  }
  onStep(resultStep)

  return response
}

export const executeWorkflow = async (
  incidentId: string,
  onProgress: (step: string, progress: number) => void
): Promise<{ success: boolean; message: string }> => {
  const steps = [
    'Validating prerequisites',
    'Backing up current state',
    'Applying configuration changes',
    'Restarting affected services',
    'Running health checks',
    'Verifying resolution'
  ]

  for (let i = 0; i < steps.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800))
    onProgress(steps[i], ((i + 1) / steps.length) * 100)
  }

  return {
    success: Math.random() > 0.2,
    message: 'Workflow executed successfully. All systems operational.'
  }
}

export const checkConfidenceThresholds = (
  incident: Incident,
  settings: ConfidenceSettings
): { requiresApproval: boolean; reason: string; lowestConfidence: number } => {
  const confidenceScores = incident.reasoningSteps
    .filter(step => step.confidence > 0)
    .map(step => step.confidence)

  if (confidenceScores.length === 0) {
    return {
      requiresApproval: true,
      reason: 'No confidence scores available from agents',
      lowestConfidence: 0
    }
  }

  const lowestConfidence = Math.min(...confidenceScores)
  const threshold = incident.severity === 'critical' 
    ? settings.criticalIncidentThreshold 
    : settings.minConfidenceThreshold

  if (lowestConfidence < threshold) {
    return {
      requiresApproval: settings.requireApprovalBelowThreshold,
      reason: `Agent confidence (${lowestConfidence}%) is below threshold (${threshold}%)`,
      lowestConfidence
    }
  }

  if (incident.severity === 'critical') {
    return {
      requiresApproval: true,
      reason: 'Critical severity incidents always require manual approval',
      lowestConfidence
    }
  }

  return {
    requiresApproval: !settings.autoExecuteAboveThreshold,
    reason: settings.autoExecuteAboveThreshold 
      ? 'Confidence exceeds threshold, auto-execution enabled'
      : 'Manual approval required (auto-execution disabled)',
    lowestConfidence
  }
}
