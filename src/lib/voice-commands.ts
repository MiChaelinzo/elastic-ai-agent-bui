export type VoiceCommandCategory = 
  | 'navigation' 
  | 'incident' 
  | 'agent' 
  | 'analytics' 
  | 'settings' 
  | 'system'
  | 'knowledge'

export interface VoiceCommand {
  id: string
  phrases: string[]
  category: VoiceCommandCategory
  description: string
  action: string
  parameters?: string[]
  requiresConfirmation?: boolean
}

export interface VoiceRecognitionSettings {
  enabled: boolean
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  confidenceThreshold: number
  wakeWord?: string
  autoExecute: boolean
  voiceFeedback: boolean
}

export const defaultVoiceSettings: VoiceRecognitionSettings = {
  enabled: true,
  language: 'en-US',
  continuous: true,
  interimResults: true,
  maxAlternatives: 3,
  confidenceThreshold: 0.7,
  wakeWord: 'elastic',
  autoExecute: false,
  voiceFeedback: true
}

export const voiceCommands: VoiceCommand[] = [
  {
    id: 'create-incident',
    phrases: [
      'create new incident',
      'create incident',
      'new incident',
      'report incident',
      'add incident'
    ],
    category: 'incident',
    description: 'Open the create incident dialog',
    action: 'create-incident'
  },
  {
    id: 'show-incidents',
    phrases: [
      'show incidents',
      'list incidents',
      'view incidents',
      'display incidents',
      'show all incidents'
    ],
    category: 'incident',
    description: 'Navigate to incidents list',
    action: 'show-incidents'
  },
  {
    id: 'show-active',
    phrases: [
      'show active incidents',
      'active incidents',
      'view active',
      'show active'
    ],
    category: 'incident',
    description: 'Filter to active incidents',
    action: 'show-active'
  },
  {
    id: 'show-pending',
    phrases: [
      'show pending',
      'pending approvals',
      'show pending approvals',
      'view pending',
      'pending incidents'
    ],
    category: 'incident',
    description: 'Show incidents awaiting approval',
    action: 'show-pending'
  },
  {
    id: 'show-resolved',
    phrases: [
      'show resolved',
      'resolved incidents',
      'view resolved',
      'completed incidents'
    ],
    category: 'incident',
    description: 'Show resolved incidents',
    action: 'show-resolved'
  },
  {
    id: 'open-analytics',
    phrases: [
      'show analytics',
      'open analytics',
      'view analytics',
      'analytics dashboard',
      'show metrics'
    ],
    category: 'analytics',
    description: 'Open analytics dashboard',
    action: 'open-analytics'
  },
  {
    id: 'open-queue',
    phrases: [
      'show queue',
      'priority queue',
      'open queue',
      'view queue'
    ],
    category: 'incident',
    description: 'Show priority queue',
    action: 'open-queue'
  },
  {
    id: 'open-predictions',
    phrases: [
      'show predictions',
      'predictive analytics',
      'open predictions',
      'view predictions'
    ],
    category: 'analytics',
    description: 'Show predictive insights',
    action: 'open-predictions'
  },
  {
    id: 'open-anomalies',
    phrases: [
      'show anomalies',
      'anomaly detection',
      'view anomalies',
      'open anomalies'
    ],
    category: 'analytics',
    description: 'Show anomaly detection',
    action: 'open-anomalies'
  },
  {
    id: 'open-elasticsearch',
    phrases: [
      'open elasticsearch',
      'elasticsearch dashboard',
      'connect elasticsearch',
      'show elasticsearch'
    ],
    category: 'system',
    description: 'Open Elasticsearch connection',
    action: 'open-elasticsearch'
  },
  {
    id: 'open-esql',
    phrases: [
      'open es ql',
      'esql console',
      'query console',
      'open query builder'
    ],
    category: 'system',
    description: 'Open ES|QL console',
    action: 'open-esql'
  },
  {
    id: 'open-streaming',
    phrases: [
      'live streaming',
      'open streaming',
      'show live data',
      'stream metrics'
    ],
    category: 'analytics',
    description: 'Open live streaming dashboard',
    action: 'open-streaming'
  },
  {
    id: 'open-templates',
    phrases: [
      'workflow templates',
      'show templates',
      'open templates',
      'view templates'
    ],
    category: 'system',
    description: 'Open workflow templates',
    action: 'open-templates'
  },
  {
    id: 'open-settings',
    phrases: [
      'open settings',
      'show settings',
      'system settings',
      'preferences'
    ],
    category: 'settings',
    description: 'Open system settings',
    action: 'open-settings'
  },
  {
    id: 'start-agent-analysis',
    phrases: [
      'start analysis',
      'analyze incident',
      'run agents',
      'process incident',
      'start agents'
    ],
    category: 'agent',
    description: 'Start agent analysis on selected incident',
    action: 'start-agent-analysis',
    requiresConfirmation: true
  },
  {
    id: 'approve-incident',
    phrases: [
      'approve',
      'approve incident',
      'execute resolution',
      'confirm resolution'
    ],
    category: 'incident',
    description: 'Approve pending incident',
    action: 'approve-incident',
    requiresConfirmation: true
  },
  {
    id: 'reject-incident',
    phrases: [
      'reject',
      'reject incident',
      'cancel resolution',
      'deny resolution'
    ],
    category: 'incident',
    description: 'Reject pending incident',
    action: 'reject-incident',
    requiresConfirmation: true
  },
  {
    id: 'filter-critical',
    phrases: [
      'show critical',
      'critical incidents',
      'filter critical',
      'critical only'
    ],
    category: 'incident',
    description: 'Filter critical severity incidents',
    action: 'filter-critical'
  },
  {
    id: 'filter-high',
    phrases: [
      'show high',
      'high priority',
      'filter high',
      'high severity'
    ],
    category: 'incident',
    description: 'Filter high severity incidents',
    action: 'filter-high'
  },
  {
    id: 'clear-filters',
    phrases: [
      'clear filters',
      'remove filters',
      'show all',
      'reset filters'
    ],
    category: 'incident',
    description: 'Clear all filters',
    action: 'clear-filters'
  },
  {
    id: 'toggle-theme',
    phrases: [
      'toggle theme',
      'switch theme',
      'dark mode',
      'light mode',
      'change theme'
    ],
    category: 'settings',
    description: 'Toggle dark/light theme',
    action: 'toggle-theme'
  },
  {
    id: 'load-sample-data',
    phrases: [
      'load sample data',
      'load demo data',
      'generate sample',
      'add sample incidents'
    ],
    category: 'system',
    description: 'Load sample incident data',
    action: 'load-sample-data'
  },
  {
    id: 'export-data',
    phrases: [
      'export data',
      'export incidents',
      'download data',
      'export to csv'
    ],
    category: 'system',
    description: 'Export incident data',
    action: 'export-data'
  },
  {
    id: 'open-chatbot',
    phrases: [
      'open chatbot',
      'show chatbot',
      'open assistant',
      'help me'
    ],
    category: 'system',
    description: 'Open AI chatbot assistant',
    action: 'open-chatbot'
  },
  {
    id: 'refresh-data',
    phrases: [
      'refresh',
      'reload',
      'refresh data',
      'update data'
    ],
    category: 'system',
    description: 'Refresh dashboard data',
    action: 'refresh-data'
  },
  {
    id: 'help',
    phrases: [
      'help',
      'show commands',
      'what can you do',
      'voice commands',
      'available commands'
    ],
    category: 'system',
    description: 'Show available voice commands',
    action: 'help'
  },
  {
    id: 'stop-listening',
    phrases: [
      'stop listening',
      'stop',
      'cancel',
      'never mind'
    ],
    category: 'system',
    description: 'Stop voice recognition',
    action: 'stop-listening'
  },
  {
    id: 'verify-voice',
    phrases: [
      'verify my voice',
      'verify identity',
      'authenticate',
      'biometric verification',
      'voice authentication'
    ],
    category: 'system',
    description: 'Verify identity with voice biometrics',
    action: 'verify-voice'
  },
  {
    id: 'open-biometrics',
    phrases: [
      'open biometrics',
      'voice biometrics',
      'biometric settings',
      'manage voice profiles'
    ],
    category: 'settings',
    description: 'Open voice biometrics manager',
    action: 'open-biometrics'
  },
  {
    id: 'open-knowledge-base',
    phrases: [
      'open knowledge base',
      'show knowledge base',
      'view articles',
      'browse knowledge',
      'knowledge articles'
    ],
    category: 'knowledge',
    description: 'Open the knowledge base dashboard',
    action: 'open-knowledge-base'
  },
  {
    id: 'generate-article',
    phrases: [
      'generate article',
      'create article',
      'generate knowledge article',
      'create knowledge base entry',
      'document incident'
    ],
    category: 'knowledge',
    description: 'Generate a knowledge article from a resolved incident',
    action: 'generate-article'
  }
]

export function findMatchingCommand(
  transcript: string,
  confidence: number,
  threshold: number = 0.7
): VoiceCommand | null {
  if (confidence < threshold) return null

  const normalizedTranscript = transcript.toLowerCase().trim()

  for (const command of voiceCommands) {
    for (const phrase of command.phrases) {
      const normalizedPhrase = phrase.toLowerCase()
      
      if (normalizedTranscript === normalizedPhrase) {
        return command
      }
      
      if (normalizedTranscript.includes(normalizedPhrase)) {
        return command
      }
      
      const words = normalizedTranscript.split(' ')
      const phraseWords = normalizedPhrase.split(' ')
      
      if (phraseWords.every(word => words.includes(word))) {
        return command
      }
    }
  }

  return null
}

export function extractParameters(
  transcript: string,
  command: VoiceCommand
): Record<string, string> {
  const params: Record<string, string> = {}
  
  if (!command.parameters) return params

  const words = transcript.toLowerCase().split(' ')

  if (command.parameters.includes('title')) {
    const titleMatch = transcript.match(/titled? ["']?([^"']+)["']?/i)
    if (titleMatch) {
      params.title = titleMatch[1]
    }
  }

  if (command.parameters.includes('severity')) {
    const severities = ['critical', 'high', 'medium', 'low']
    const foundSeverity = severities.find(s => words.includes(s))
    if (foundSeverity) {
      params.severity = foundSeverity
    }
  }

  if (command.parameters.includes('status')) {
    const statuses = ['new', 'active', 'pending', 'resolved', 'failed']
    const foundStatus = statuses.find(s => words.includes(s))
    if (foundStatus) {
      params.status = foundStatus
    }
  }

  return params
}

export function getCommandsByCategory(category: VoiceCommandCategory): VoiceCommand[] {
  return voiceCommands.filter(cmd => cmd.category === category)
}

export function searchCommands(query: string): VoiceCommand[] {
  const normalizedQuery = query.toLowerCase()
  
  return voiceCommands.filter(cmd => 
    cmd.description.toLowerCase().includes(normalizedQuery) ||
    cmd.phrases.some(phrase => phrase.toLowerCase().includes(normalizedQuery)) ||
    cmd.category.toLowerCase().includes(normalizedQuery)
  )
}

export const voiceCommandCategories: Record<VoiceCommandCategory, string> = {
  navigation: 'Navigation',
  incident: 'Incident Management',
  agent: 'Agent Operations',
  analytics: 'Analytics & Insights',
  settings: 'Settings & Preferences',
  system: 'System Controls',
  knowledge: 'Knowledge Base'
}
