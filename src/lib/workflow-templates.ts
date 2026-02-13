import type { IncidentSeverity, AgentType, ToolType } from './types'

export interface WorkflowTemplateStep {
  agentType: AgentType
  name: string
  tool: ToolType
  description: string
  esqlQuery?: string
  searchQuery?: string
  workflowAction?: string
  estimatedDuration: number
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  severity: IncidentSeverity[]
  tags: string[]
  estimatedTime: number
  automationLevel: 'full' | 'semi' | 'manual'
  steps: WorkflowTemplateStep[]
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'api-high-latency',
    name: 'API High Latency Response',
    description: 'Automated workflow for diagnosing and resolving API performance degradation',
    category: 'Performance',
    icon: 'ChartLine',
    severity: ['high', 'critical'],
    tags: ['api', 'latency', 'performance'],
    estimatedTime: 180,
    automationLevel: 'full',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Latency Spike',
        tool: 'esql',
        description: 'Query API response times and identify affected endpoints',
        esqlQuery: `FROM metrics-apm* 
| WHERE @timestamp > NOW() - 1 hour 
| WHERE transaction.type == "request" AND transaction.duration.us > 1000000
| STATS avg_duration = AVG(transaction.duration.us), p95 = PERCENTILE(transaction.duration.us, 95) BY service.name, transaction.name
| SORT p95 DESC`,
        estimatedDuration: 15
      },
      {
        agentType: 'analyzer',
        name: 'Root Cause Analysis',
        tool: 'search',
        description: 'Correlate latency with database queries, external API calls, and resource utilization',
        searchQuery: 'service.name:api AND (span.type:db OR span.type:external) AND span.duration.us > 500000',
        estimatedDuration: 45
      },
      {
        agentType: 'resolver',
        name: 'Apply Auto-Scaling',
        tool: 'workflow',
        description: 'Scale up service replicas and adjust connection pool settings',
        workflowAction: 'scale_service_replicas',
        estimatedDuration: 90
      },
      {
        agentType: 'verifier',
        name: 'Verify Performance',
        tool: 'esql',
        description: 'Confirm latency has returned to normal thresholds',
        esqlQuery: `FROM metrics-apm* 
| WHERE @timestamp > NOW() - 5 minutes 
| STATS p95 = PERCENTILE(transaction.duration.us, 95) BY service.name
| WHERE p95 < 500000`,
        estimatedDuration: 30
      }
    ]
  },
  {
    id: 'database-connection-pool',
    name: 'Database Connection Pool Exhaustion',
    description: 'Diagnose and resolve database connection pool saturation issues',
    category: 'Database',
    icon: 'Database',
    severity: ['high', 'critical'],
    tags: ['database', 'connections', 'pool'],
    estimatedTime: 240,
    automationLevel: 'semi',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Pool Exhaustion',
        tool: 'esql',
        description: 'Identify services with connection pool errors',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 30 minutes 
| WHERE message LIKE "*connection pool*" OR message LIKE "*too many connections*"
| STATS error_count = COUNT(*) BY service.name, host.name
| SORT error_count DESC`,
        estimatedDuration: 20
      },
      {
        agentType: 'analyzer',
        name: 'Analyze Connection Patterns',
        tool: 'search',
        description: 'Review connection lifecycle, slow queries, and leaks',
        searchQuery: 'event.category:database AND (event.action:query OR event.action:connection)',
        estimatedDuration: 60
      },
      {
        agentType: 'resolver',
        name: 'Increase Pool Size',
        tool: 'workflow',
        description: 'Update connection pool configuration and restart services',
        workflowAction: 'update_database_pool_config',
        estimatedDuration: 120
      },
      {
        agentType: 'verifier',
        name: 'Verify Connection Health',
        tool: 'esql',
        description: 'Check connection pool metrics are within normal range',
        esqlQuery: `FROM metrics-* 
| WHERE @timestamp > NOW() - 5 minutes 
| WHERE metric.name == "db.connection.pool.usage"
| STATS avg_usage = AVG(metric.value) BY service.name`,
        estimatedDuration: 40
      }
    ]
  },
  {
    id: 'memory-leak',
    name: 'Memory Leak Detection',
    description: 'Identify and mitigate memory leaks causing OOM errors',
    category: 'Resources',
    icon: 'Warning',
    severity: ['high', 'critical'],
    tags: ['memory', 'oom', 'leak'],
    estimatedTime: 300,
    automationLevel: 'semi',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Memory Growth',
        tool: 'esql',
        description: 'Identify services with continuous memory growth pattern',
        esqlQuery: `FROM metrics-system* 
| WHERE @timestamp > NOW() - 2 hours 
| WHERE system.memory.used.pct > 0.85
| STATS max_memory = MAX(system.memory.used.pct), trend = AVG(system.memory.used.pct) BY host.name
| SORT trend DESC`,
        estimatedDuration: 25
      },
      {
        agentType: 'analyzer',
        name: 'Heap Dump Analysis',
        tool: 'search',
        description: 'Analyze heap dumps and identify object retention patterns',
        searchQuery: 'profiler.memory.heap AND profiler.samples.count > 1000',
        estimatedDuration: 90
      },
      {
        agentType: 'resolver',
        name: 'Restart Service',
        tool: 'workflow',
        description: 'Rolling restart of affected services to reclaim memory',
        workflowAction: 'rolling_restart_service',
        estimatedDuration: 150
      },
      {
        agentType: 'verifier',
        name: 'Monitor Memory Stability',
        tool: 'esql',
        description: 'Verify memory usage is stable post-restart',
        esqlQuery: `FROM metrics-system* 
| WHERE @timestamp > NOW() - 10 minutes 
| STATS memory_stability = STDDEV(system.memory.used.pct) BY host.name
| WHERE memory_stability < 0.05`,
        estimatedDuration: 35
      }
    ]
  },
  {
    id: 'disk-space-critical',
    name: 'Disk Space Critical',
    description: 'Free up disk space and prevent service disruption',
    category: 'Resources',
    icon: 'HardDrives',
    severity: ['critical'],
    tags: ['disk', 'storage', 'capacity'],
    estimatedTime: 120,
    automationLevel: 'full',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Disk Usage',
        tool: 'esql',
        description: 'Find hosts with critical disk space',
        esqlQuery: `FROM metrics-system* 
| WHERE @timestamp > NOW() - 5 minutes 
| WHERE system.filesystem.used.pct > 0.90
| STATS max_usage = MAX(system.filesystem.used.pct) BY host.name, system.filesystem.mount_point
| SORT max_usage DESC`,
        estimatedDuration: 10
      },
      {
        agentType: 'analyzer',
        name: 'Identify Large Files',
        tool: 'search',
        description: 'Find log files and temp files consuming space',
        searchQuery: 'file.size > 1073741824 AND (file.path:*log* OR file.path:*tmp*)',
        estimatedDuration: 30
      },
      {
        agentType: 'resolver',
        name: 'Clean Up Files',
        tool: 'workflow',
        description: 'Archive old logs and delete temporary files',
        workflowAction: 'cleanup_disk_space',
        estimatedDuration: 60
      },
      {
        agentType: 'verifier',
        name: 'Verify Space Freed',
        tool: 'esql',
        description: 'Confirm disk usage is below critical threshold',
        esqlQuery: `FROM metrics-system* 
| WHERE @timestamp > NOW() - 2 minutes 
| STATS current_usage = MAX(system.filesystem.used.pct) BY host.name
| WHERE current_usage < 0.85`,
        estimatedDuration: 20
      }
    ]
  },
  {
    id: 'failed-deployment',
    name: 'Failed Deployment Rollback',
    description: 'Automatically detect and rollback failed deployments',
    category: 'Deployment',
    icon: 'GitBranch',
    severity: ['high', 'critical'],
    tags: ['deployment', 'rollback', 'cicd'],
    estimatedTime: 180,
    automationLevel: 'semi',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Deployment Issues',
        tool: 'esql',
        description: 'Identify recent deployments with error spikes',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 15 minutes 
| WHERE log.level == "error" OR log.level == "fatal"
| STATS error_rate = COUNT(*) BY service.name, service.version
| WHERE error_rate > 100`,
        estimatedDuration: 20
      },
      {
        agentType: 'analyzer',
        name: 'Compare Versions',
        tool: 'search',
        description: 'Compare error rates between current and previous versions',
        searchQuery: 'event.action:deployment AND deployment.status:(failed OR error)',
        estimatedDuration: 50
      },
      {
        agentType: 'resolver',
        name: 'Execute Rollback',
        tool: 'workflow',
        description: 'Rollback to previous stable version',
        workflowAction: 'rollback_deployment',
        estimatedDuration: 90
      },
      {
        agentType: 'verifier',
        name: 'Verify Rollback Success',
        tool: 'esql',
        description: 'Confirm error rate has decreased post-rollback',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 5 minutes 
| WHERE log.level == "error"
| STATS recent_errors = COUNT(*) BY service.name
| WHERE recent_errors < 10`,
        estimatedDuration: 20
      }
    ]
  },
  {
    id: 'security-breach',
    name: 'Security Breach Response',
    description: 'Contain and investigate potential security incidents',
    category: 'Security',
    icon: 'ShieldWarning',
    severity: ['critical'],
    tags: ['security', 'breach', 'intrusion'],
    estimatedTime: 300,
    automationLevel: 'manual',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Anomalies',
        tool: 'esql',
        description: 'Identify suspicious authentication attempts and access patterns',
        esqlQuery: `FROM logs-security* 
| WHERE @timestamp > NOW() - 1 hour 
| WHERE event.action IN ("authentication_failure", "unauthorized_access", "suspicious_activity")
| STATS attempts = COUNT(*) BY source.ip, user.name
| WHERE attempts > 10`,
        estimatedDuration: 30
      },
      {
        agentType: 'analyzer',
        name: 'Trace Attack Path',
        tool: 'search',
        description: 'Map the sequence of events and affected resources',
        searchQuery: 'event.category:security AND event.outcome:failure',
        estimatedDuration: 120
      },
      {
        agentType: 'resolver',
        name: 'Isolate Resources',
        tool: 'workflow',
        description: 'Block suspicious IPs and disable compromised accounts',
        workflowAction: 'security_lockdown',
        estimatedDuration: 120
      },
      {
        agentType: 'verifier',
        name: 'Verify Containment',
        tool: 'esql',
        description: 'Confirm no further suspicious activity from blocked sources',
        esqlQuery: `FROM logs-security* 
| WHERE @timestamp > NOW() - 10 minutes 
| WHERE source.ip IN (SELECT blocked_ip FROM security.blocklist)
| STATS activity_count = COUNT(*)
| WHERE activity_count == 0`,
        estimatedDuration: 30
      }
    ]
  },
  {
    id: 'service-unavailable',
    name: 'Service Unavailable',
    description: 'Restore service availability after downtime',
    category: 'Availability',
    icon: 'CloudSlash',
    severity: ['critical'],
    tags: ['downtime', 'availability', 'outage'],
    estimatedTime: 150,
    automationLevel: 'full',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Downtime',
        tool: 'esql',
        description: 'Identify services returning 5xx errors',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 5 minutes 
| WHERE http.response.status_code >= 500
| STATS error_rate = COUNT(*) / COUNT(*) BY service.name
| WHERE error_rate > 0.5`,
        estimatedDuration: 15
      },
      {
        agentType: 'analyzer',
        name: 'Check Dependencies',
        tool: 'search',
        description: 'Verify health of downstream services and databases',
        searchQuery: 'service.health:unhealthy OR span.outcome:failure',
        estimatedDuration: 45
      },
      {
        agentType: 'resolver',
        name: 'Restart Service',
        tool: 'workflow',
        description: 'Perform health check and restart unhealthy instances',
        workflowAction: 'restart_unhealthy_instances',
        estimatedDuration: 60
      },
      {
        agentType: 'verifier',
        name: 'Verify Service Health',
        tool: 'esql',
        description: 'Confirm service is returning successful responses',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 2 minutes 
| STATS success_rate = COUNT_IF(http.response.status_code < 400) / COUNT(*) BY service.name
| WHERE success_rate > 0.99`,
        estimatedDuration: 30
      }
    ]
  },
  {
    id: 'rate-limit-exceeded',
    name: 'Rate Limit Exceeded',
    description: 'Handle API rate limit violations and adjust throttling',
    category: 'API',
    icon: 'Gauge',
    severity: ['medium', 'high'],
    tags: ['api', 'rate-limit', 'throttling'],
    estimatedTime: 90,
    automationLevel: 'full',
    steps: [
      {
        agentType: 'detector',
        name: 'Detect Rate Limit Hits',
        tool: 'esql',
        description: 'Identify clients hitting rate limits',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 10 minutes 
| WHERE http.response.status_code == 429
| STATS rate_limit_hits = COUNT(*) BY client.ip, api.endpoint
| SORT rate_limit_hits DESC`,
        estimatedDuration: 10
      },
      {
        agentType: 'analyzer',
        name: 'Analyze Traffic Patterns',
        tool: 'search',
        description: 'Determine if traffic is legitimate or abuse',
        searchQuery: 'http.request.method:* AND user_agent.name:*',
        estimatedDuration: 30
      },
      {
        agentType: 'resolver',
        name: 'Adjust Rate Limits',
        tool: 'workflow',
        description: 'Update rate limit thresholds or block abusive clients',
        workflowAction: 'update_rate_limits',
        estimatedDuration: 30
      },
      {
        agentType: 'verifier',
        name: 'Verify Traffic Flow',
        tool: 'esql',
        description: 'Confirm rate limits are effective',
        esqlQuery: `FROM logs-* 
| WHERE @timestamp > NOW() - 5 minutes 
| STATS rate_limit_hits = COUNT_IF(http.response.status_code == 429) BY api.endpoint
| WHERE rate_limit_hits < 100`,
        estimatedDuration: 20
      }
    ]
  }
]

export const getTemplatesByCategory = (): Record<string, WorkflowTemplate[]> => {
  return workflowTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, WorkflowTemplate[]>)
}

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find(t => t.id === id)
}

export const getTemplatesBySeverity = (severity: IncidentSeverity): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.severity.includes(severity))
}

export const searchTemplates = (query: string): WorkflowTemplate[] => {
  const lowerQuery = query.toLowerCase()
  return workflowTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
