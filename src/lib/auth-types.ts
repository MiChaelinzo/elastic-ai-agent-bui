export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'operator' | 'viewer'
  createdAt: number
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  mode: 'demo' | 'api'
  hasCompletedOnboarding: boolean
}

export interface APIConfig {
  elasticsearchUrl: string
  elasticsearchApiKey: string
  slackWebhookUrl?: string
  emailConfig?: {
    smtpHost?: string
    smtpPort?: number
    fromEmail?: string
    apiKey?: string
  }
}

export interface DemoDataConfig {
  autoGenerateIncidents: boolean
  incidentFrequency: number
  enableRealTimeSimulation: boolean
}
