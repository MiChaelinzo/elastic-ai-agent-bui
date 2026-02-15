export type IntegrationType = 'github' | 'jira' | 'pagerduty' | 'slack' | 'teams' | 'datadog' | 'newrelic' | 'grafana'

export interface Integration {
  id: string
  type: IntegrationType
  name: string
  enabled: boolean
  config: Record<string, any>
  lastSync?: number
  status: 'connected' | 'disconnected' | 'error'
  errorMessage?: string
}

export interface IntegrationAction {
  id: string
  integrationId: string
  type: string
  timestamp: number
  success: boolean
  details: string
  metadata?: Record<string, any>
}

export interface GitHubIntegration extends Integration {
  type: 'github'
  config: {
    owner: string
    repo: string
    token: string
    autoCreateIssues: boolean
    autoCreatePRs: boolean
  }
}

export interface JiraIntegration extends Integration {
  type: 'jira'
  config: {
    domain: string
    email: string
    apiToken: string
    projectKey: string
    autoCreateTickets: boolean
  }
}

export interface PagerDutyIntegration extends Integration {
  type: 'pagerduty'
  config: {
    apiKey: string
    serviceId: string
    autoCreateIncidents: boolean
    autoResolve: boolean
  }
}

export interface SlackIntegration extends Integration {
  type: 'slack'
  config: {
    webhookUrl: string
    channel: string
    notifyOnCritical: boolean
    notifyOnResolved: boolean
  }
}

export const defaultIntegrations: Integration[] = []

export function createIntegration(
  type: IntegrationType,
  name: string,
  config: Record<string, any>
): Integration {
  return {
    id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    enabled: false,
    config,
    status: 'disconnected'
  }
}

export async function testIntegrationConnection(integration: Integration): Promise<{
  success: boolean
  message: string
  latency?: number
}> {
  const startTime = Date.now()
  
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
  
  const success = Math.random() > 0.1
  
  return {
    success,
    message: success 
      ? `Successfully connected to ${integration.name}`
      : `Failed to connect to ${integration.name}: Invalid credentials or network error`,
    latency: Date.now() - startTime
  }
}

export async function syncIntegration(integration: Integration): Promise<{
  success: boolean
  itemsSynced: number
  errors: string[]
}> {
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500))
  
  const success = Math.random() > 0.15
  
  if (!success) {
    return {
      success: false,
      itemsSynced: 0,
      errors: ['Sync failed: API rate limit exceeded']
    }
  }
  
  return {
    success: true,
    itemsSynced: Math.floor(Math.random() * 50 + 10),
    errors: []
  }
}

export async function executeIntegrationAction(
  integration: Integration,
  action: string,
  params: Record<string, any>
): Promise<IntegrationAction> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
  
  const success = Math.random() > 0.1
  
  const actionRecord: IntegrationAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    integrationId: integration.id,
    type: action,
    timestamp: Date.now(),
    success,
    details: success 
      ? `Successfully executed ${action} on ${integration.name}`
      : `Failed to execute ${action}: ${['Network timeout', 'Invalid parameters', 'Permission denied'][Math.floor(Math.random() * 3)]}`,
    metadata: params
  }
  
  return actionRecord
}

export async function createGitHubIssue(
  integration: GitHubIntegration,
  title: string,
  body: string,
  labels: string[]
): Promise<{ success: boolean; issueUrl?: string; error?: string }> {
  const action = await executeIntegrationAction(integration, 'create-issue', {
    title,
    body,
    labels
  })
  
  if (action.success) {
    return {
      success: true,
      issueUrl: `https://github.com/${integration.config.owner}/${integration.config.repo}/issues/${Math.floor(Math.random() * 1000 + 1)}`
    }
  }
  
  return {
    success: false,
    error: action.details
  }
}

export async function createJiraTicket(
  integration: JiraIntegration,
  summary: string,
  description: string,
  priority: string
): Promise<{ success: boolean; ticketKey?: string; error?: string }> {
  const action = await executeIntegrationAction(integration, 'create-ticket', {
    summary,
    description,
    priority
  })
  
  if (action.success) {
    return {
      success: true,
      ticketKey: `${integration.config.projectKey}-${Math.floor(Math.random() * 1000 + 1)}`
    }
  }
  
  return {
    success: false,
    error: action.details
  }
}

export async function createPagerDutyIncident(
  integration: PagerDutyIntegration,
  title: string,
  urgency: 'low' | 'high',
  details: string
): Promise<{ success: boolean; incidentId?: string; error?: string }> {
  const action = await executeIntegrationAction(integration, 'create-incident', {
    title,
    urgency,
    details
  })
  
  if (action.success) {
    return {
      success: true,
      incidentId: `PD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }
  }
  
  return {
    success: false,
    error: action.details
  }
}

export async function sendSlackNotification(
  integration: SlackIntegration,
  message: string,
  attachments?: Array<{
    title: string
    text: string
    color: string
  }>
): Promise<{ success: boolean; error?: string }> {
  const action = await executeIntegrationAction(integration, 'send-notification', {
    message,
    attachments
  })
  
  return {
    success: action.success,
    error: action.success ? undefined : action.details
  }
}

export function getIntegrationIcon(type: IntegrationType): string {
  const icons: Record<IntegrationType, string> = {
    github: '🐙',
    jira: '📋',
    pagerduty: '🚨',
    slack: '💬',
    teams: '👥',
    datadog: '🐕',
    newrelic: '📊',
    grafana: '📈'
  }
  return icons[type]
}

export function getIntegrationDescription(type: IntegrationType): string {
  const descriptions: Record<IntegrationType, string> = {
    github: 'Automatically create issues and PRs for incidents',
    jira: 'Create and update Jira tickets for incident tracking',
    pagerduty: 'Trigger and manage PagerDuty incidents',
    slack: 'Send real-time notifications to Slack channels',
    teams: 'Post updates to Microsoft Teams channels',
    datadog: 'Pull metrics and send events to Datadog',
    newrelic: 'Monitor performance and track incidents in New Relic',
    grafana: 'Visualize incident data in Grafana dashboards'
  }
  return descriptions[type]
}

export function getSuggestedActions(type: IntegrationType): string[] {
  const actions: Record<IntegrationType, string[]> = {
    github: [
      'Create issue for incident',
      'Create PR with fix',
      'Update issue status',
      'Add labels to issue',
      'Assign to team member'
    ],
    jira: [
      'Create ticket',
      'Update ticket status',
      'Add comment',
      'Change priority',
      'Assign to user'
    ],
    pagerduty: [
      'Create incident',
      'Acknowledge incident',
      'Resolve incident',
      'Add note',
      'Escalate to team'
    ],
    slack: [
      'Send notification',
      'Post to channel',
      'Send direct message',
      'Create thread',
      'Upload file'
    ],
    teams: [
      'Post message',
      'Send adaptive card',
      'Create task',
      'Schedule meeting',
      'Upload document'
    ],
    datadog: [
      'Send event',
      'Create monitor',
      'Update dashboard',
      'Query metrics',
      'Create SLO'
    ],
    newrelic: [
      'Send custom event',
      'Create deployment marker',
      'Query NRQL',
      'Update alert policy',
      'Create dashboard'
    ],
    grafana: [
      'Create annotation',
      'Update dashboard',
      'Query data source',
      'Create alert',
      'Generate snapshot'
    ]
  }
  return actions[type]
}
