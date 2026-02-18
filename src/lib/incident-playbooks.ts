import type { Incident, IncidentSeverity } from './types'

export interface IncidentPlaybook {
  id: string
  name: string
  description: string
  triggerConditions: PlaybookTrigger[]
  steps: PlaybookStep[]
  category: string
  severity: IncidentSeverity[]
  estimatedDuration: number
  successRate: number
  usageCount: number
  lastUsed?: number
  tags: string[]
  automationLevel: 'manual' | 'semi-automatic' | 'fully-automatic'
}

export interface PlaybookTrigger {
  type: 'keyword' | 'severity' | 'pattern' | 'metric'
  condition: string
  value: string | number
}

export interface PlaybookStep {
  id: string
  order: number
  title: string
  description: string
  action: PlaybookAction
  expectedDuration: number
  requiresApproval: boolean
  dependencies: string[]
  rollbackPossible: boolean
}

export interface PlaybookAction {
  type: 'diagnostic' | 'remediation' | 'notification' | 'escalation' | 'verification'
  agent: string
  command?: string
  parameters?: Record<string, any>
}

export interface PlaybookRecommendation {
  playbook: IncidentPlaybook
  matchScore: number
  reasons: string[]
  estimatedImpact: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface PlaybookExecution {
  id: string
  playbookId: string
  incidentId: string
  startedAt: number
  completedAt?: number
  status: 'running' | 'completed' | 'failed' | 'paused'
  currentStep: number
  executedSteps: ExecutedStep[]
  success: boolean
  errorMessage?: string
}

export interface ExecutedStep {
  stepId: string
  startedAt: number
  completedAt?: number
  status: 'running' | 'completed' | 'failed' | 'skipped'
  output?: string
  error?: string
}

export const defaultPlaybooks: IncidentPlaybook[] = [
  {
    id: 'playbook-1',
    name: 'High CPU Usage Response',
    description: 'Automated response for high CPU utilization incidents',
    triggerConditions: [
      { type: 'keyword', condition: 'contains', value: 'cpu' },
      { type: 'severity', condition: 'equals', value: 'high' }
    ],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Identify High CPU Processes',
        description: 'Query system metrics to identify processes consuming excessive CPU',
        action: {
          type: 'diagnostic',
          agent: 'detector',
          command: 'GET /metrics/cpu/top-processes'
        },
        expectedDuration: 30,
        requiresApproval: false,
        dependencies: [],
        rollbackPossible: false
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Analyze Process History',
        description: 'Review historical CPU usage patterns for identified processes',
        action: {
          type: 'diagnostic',
          agent: 'analyzer',
          command: 'QUERY historical_cpu_usage'
        },
        expectedDuration: 60,
        requiresApproval: false,
        dependencies: ['step-1'],
        rollbackPossible: false
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Apply CPU Throttling',
        description: 'Throttle CPU usage for non-critical processes',
        action: {
          type: 'remediation',
          agent: 'resolver',
          command: 'THROTTLE_PROCESS',
          parameters: { max_cpu_percent: 80 }
        },
        expectedDuration: 15,
        requiresApproval: true,
        dependencies: ['step-2'],
        rollbackPossible: true
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Verify CPU Normalization',
        description: 'Confirm CPU usage has returned to normal levels',
        action: {
          type: 'verification',
          agent: 'verifier',
          command: 'VERIFY_CPU_NORMAL'
        },
        expectedDuration: 45,
        requiresApproval: false,
        dependencies: ['step-3'],
        rollbackPossible: false
      }
    ],
    category: 'infrastructure',
    severity: ['high', 'critical'],
    estimatedDuration: 150,
    successRate: 92,
    usageCount: 47,
    tags: ['cpu', 'performance', 'infrastructure'],
    automationLevel: 'semi-automatic'
  },
  {
    id: 'playbook-2',
    name: 'Memory Leak Detection & Remediation',
    description: 'Detect and resolve memory leak issues across services',
    triggerConditions: [
      { type: 'keyword', condition: 'contains', value: 'memory' },
      { type: 'pattern', condition: 'increasing', value: 'memory_usage' }
    ],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Identify Memory Growth Pattern',
        description: 'Analyze memory usage trends over the past 24 hours',
        action: {
          type: 'diagnostic',
          agent: 'analyzer',
          command: 'ANALYZE_MEMORY_TREND'
        },
        expectedDuration: 45,
        requiresApproval: false,
        dependencies: [],
        rollbackPossible: false
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Isolate Leaking Service',
        description: 'Determine which service or process is leaking memory',
        action: {
          type: 'diagnostic',
          agent: 'detector',
          command: 'DETECT_MEMORY_LEAK_SOURCE'
        },
        expectedDuration: 60,
        requiresApproval: false,
        dependencies: ['step-1'],
        rollbackPossible: false
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Restart Affected Service',
        description: 'Safely restart the service to clear memory',
        action: {
          type: 'remediation',
          agent: 'resolver',
          command: 'SAFE_RESTART_SERVICE'
        },
        expectedDuration: 90,
        requiresApproval: true,
        dependencies: ['step-2'],
        rollbackPossible: true
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Monitor Post-Restart',
        description: 'Track memory usage for 15 minutes after restart',
        action: {
          type: 'verification',
          agent: 'verifier',
          command: 'MONITOR_MEMORY_STABILITY'
        },
        expectedDuration: 900,
        requiresApproval: false,
        dependencies: ['step-3'],
        rollbackPossible: false
      }
    ],
    category: 'infrastructure',
    severity: ['medium', 'high', 'critical'],
    estimatedDuration: 1095,
    successRate: 88,
    usageCount: 34,
    tags: ['memory', 'leak', 'performance'],
    automationLevel: 'semi-automatic'
  },
  {
    id: 'playbook-3',
    name: 'API Latency Spike Response',
    description: 'Diagnose and resolve sudden API performance degradation',
    triggerConditions: [
      { type: 'keyword', condition: 'contains', value: 'api' },
      { type: 'keyword', condition: 'contains', value: 'latency' }
    ],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Measure Current Latency',
        description: 'Execute health checks across all API endpoints',
        action: {
          type: 'diagnostic',
          agent: 'detector',
          command: 'RUN_API_HEALTH_CHECK'
        },
        expectedDuration: 30,
        requiresApproval: false,
        dependencies: [],
        rollbackPossible: false
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Analyze Database Queries',
        description: 'Identify slow database queries impacting API performance',
        action: {
          type: 'diagnostic',
          agent: 'analyzer',
          command: 'ANALYZE_SLOW_QUERIES'
        },
        expectedDuration: 60,
        requiresApproval: false,
        dependencies: ['step-1'],
        rollbackPossible: false
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Enable Response Caching',
        description: 'Activate caching for frequently accessed endpoints',
        action: {
          type: 'remediation',
          agent: 'resolver',
          command: 'ENABLE_API_CACHE',
          parameters: { ttl: 300 }
        },
        expectedDuration: 20,
        requiresApproval: false,
        dependencies: ['step-2'],
        rollbackPossible: true
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Verify Latency Improvement',
        description: 'Confirm API response times have improved',
        action: {
          type: 'verification',
          agent: 'verifier',
          command: 'VERIFY_API_PERFORMANCE'
        },
        expectedDuration: 60,
        requiresApproval: false,
        dependencies: ['step-3'],
        rollbackPossible: false
      }
    ],
    category: 'application',
    severity: ['medium', 'high'],
    estimatedDuration: 170,
    successRate: 95,
    usageCount: 89,
    tags: ['api', 'latency', 'performance', 'database'],
    automationLevel: 'fully-automatic'
  },
  {
    id: 'playbook-4',
    name: 'Database Connection Pool Exhaustion',
    description: 'Resolve database connection pool saturation',
    triggerConditions: [
      { type: 'keyword', condition: 'contains', value: 'database' },
      { type: 'keyword', condition: 'contains', value: 'connection' }
    ],
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Check Connection Pool Status',
        description: 'Query current database connection pool utilization',
        action: {
          type: 'diagnostic',
          agent: 'detector',
          command: 'GET_POOL_STATUS'
        },
        expectedDuration: 15,
        requiresApproval: false,
        dependencies: [],
        rollbackPossible: false
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Identify Long-Running Queries',
        description: 'Find queries holding connections for extended periods',
        action: {
          type: 'diagnostic',
          agent: 'analyzer',
          command: 'FIND_BLOCKING_QUERIES'
        },
        expectedDuration: 30,
        requiresApproval: false,
        dependencies: ['step-1'],
        rollbackPossible: false
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Increase Pool Size Temporarily',
        description: 'Scale up connection pool to handle immediate load',
        action: {
          type: 'remediation',
          agent: 'resolver',
          command: 'SCALE_CONNECTION_POOL',
          parameters: { increase_by: 20 }
        },
        expectedDuration: 10,
        requiresApproval: false,
        dependencies: ['step-2'],
        rollbackPossible: true
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Kill Zombie Connections',
        description: 'Terminate stale database connections',
        action: {
          type: 'remediation',
          agent: 'resolver',
          command: 'KILL_STALE_CONNECTIONS'
        },
        expectedDuration: 20,
        requiresApproval: true,
        dependencies: ['step-3'],
        rollbackPossible: false
      }
    ],
    category: 'database',
    severity: ['high', 'critical'],
    estimatedDuration: 75,
    successRate: 91,
    usageCount: 56,
    tags: ['database', 'connections', 'performance'],
    automationLevel: 'semi-automatic'
  }
]

export function recommendPlaybooksForIncident(
  incident: Incident,
  allPlaybooks: IncidentPlaybook[] = defaultPlaybooks
): PlaybookRecommendation[] {
  const recommendations: PlaybookRecommendation[] = []

  for (const playbook of allPlaybooks) {
    let matchScore = 0
    const reasons: string[] = []

    if (playbook.severity.includes(incident.severity)) {
      matchScore += 20
      reasons.push(`Matches ${incident.severity} severity`)
    }

    for (const trigger of playbook.triggerConditions) {
      if (trigger.type === 'keyword') {
        const searchText = `${incident.title} ${incident.description}`.toLowerCase()
        if (searchText.includes(String(trigger.value).toLowerCase())) {
          matchScore += 25
          reasons.push(`Contains keyword: "${trigger.value}"`)
        }
      }
    }

    const categoryMatch = playbook.tags.some(tag => 
      incident.title.toLowerCase().includes(tag) ||
      incident.description.toLowerCase().includes(tag)
    )
    if (categoryMatch) {
      matchScore += 15
      reasons.push('Related category match')
    }

    if (playbook.successRate >= 90) {
      matchScore += 10
      reasons.push(`High success rate (${playbook.successRate}%)`)
    }

    if (playbook.usageCount > 50) {
      matchScore += 10
      reasons.push('Frequently used playbook')
    }

    if (playbook.automationLevel === 'fully-automatic') {
      matchScore += 5
      reasons.push('Fully automated resolution')
    }

    if (matchScore >= 30) {
      const riskLevel = playbook.steps.some(s => s.requiresApproval)
        ? 'medium'
        : playbook.automationLevel === 'fully-automatic'
        ? 'low'
        : 'high'

      const estimatedImpact = `Estimated resolution time: ${Math.floor(playbook.estimatedDuration / 60)} minutes`

      recommendations.push({
        playbook,
        matchScore,
        reasons,
        estimatedImpact,
        riskLevel
      })
    }
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore)
}

export function executePlaybook(
  playbookId: string,
  incidentId: string,
  onStepComplete: (step: ExecutedStep) => void
): Promise<PlaybookExecution> {
  return new Promise((resolve) => {
    const playbook = defaultPlaybooks.find(p => p.id === playbookId)
    if (!playbook) {
      throw new Error('Playbook not found')
    }

    const execution: PlaybookExecution = {
      id: `exec-${Date.now()}`,
      playbookId,
      incidentId,
      startedAt: Date.now(),
      status: 'running',
      currentStep: 0,
      executedSteps: [],
      success: false
    }

    let currentStepIndex = 0

    const executeNextStep = () => {
      if (currentStepIndex >= playbook.steps.length) {
        execution.status = 'completed'
        execution.completedAt = Date.now()
        execution.success = true
        resolve(execution)
        return
      }

      const step = playbook.steps[currentStepIndex]
      const executedStep: ExecutedStep = {
        stepId: step.id,
        startedAt: Date.now(),
        status: 'running'
      }

      execution.executedSteps.push(executedStep)
      execution.currentStep = currentStepIndex + 1

      setTimeout(() => {
        executedStep.status = 'completed'
        executedStep.completedAt = Date.now()
        executedStep.output = `${step.title} completed successfully`
        
        onStepComplete(executedStep)
        
        currentStepIndex++
        executeNextStep()
      }, step.expectedDuration * 10)
    }

    executeNextStep()
  })
}
