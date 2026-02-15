import type { ChatMessage, ChatRecommendation, ChatAttachment } from './chatbot-types'
import type { Incident } from './types'

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  attachments?: ChatAttachment[]
): Promise<string> {
  const context = history
    .slice(-5)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n')

  const attachmentContext = attachments && attachments.length > 0
    ? `\n\nUser has attached ${attachments.length} file(s): ${attachments.map(a => `${a.name} (${a.type})`).join(', ')}`
    : ''

  const promptText = `You are an AI assistant for the Elastic Agent Orchestrator, a DevOps incident response platform. Help users with:
- Creating and analyzing incidents
- Understanding agent workflows
- Interpreting ES|QL queries
- Analyzing metrics and anomalies
- Troubleshooting issues

Previous conversation:
${context}

User message: ${message}${attachmentContext}

Provide a helpful, concise response focused on the Elastic Agent Orchestrator platform.`

  const response = await window.spark.llm(promptText, 'gpt-4o-mini')
  return response
}

export function generateRecommendations(
  incidents: Incident[],
  recentMessages: ChatMessage[]
): ChatRecommendation[] {
  const recommendations: ChatRecommendation[] = []

  const pendingIncidents = incidents.filter(i => i.status === 'pending-approval')
  if (pendingIncidents.length > 0) {
    recommendations.push({
      id: 'rec-pending-approval',
      title: 'Review Pending Approvals',
      description: `${pendingIncidents.length} incident${pendingIncidents.length > 1 ? 's' : ''} waiting for approval`,
      action: 'open-pending-approvals',
      category: 'incident'
    })
  }

  const newIncidents = incidents.filter(i => i.status === 'new')
  if (newIncidents.length > 0) {
    recommendations.push({
      id: 'rec-new-incidents',
      title: 'Process New Incidents',
      description: `${newIncidents.length} new incident${newIncidents.length > 1 ? 's' : ''} ready for analysis`,
      action: 'process-new-incidents',
      category: 'incident'
    })
  }

  const hasAnomalies = incidents.some(i => 
    i.title.toLowerCase().includes('anomaly') || 
    i.description.toLowerCase().includes('spike')
  )
  if (hasAnomalies) {
    recommendations.push({
      id: 'rec-anomaly-detection',
      title: 'Check Anomaly Detection',
      description: 'Review ML-powered anomaly detection insights',
      action: 'open-anomaly-dashboard',
      category: 'analysis'
    })
  }

  if (incidents.length > 5) {
    recommendations.push({
      id: 'rec-analytics',
      title: 'View Analytics Dashboard',
      description: 'Analyze incident patterns and trends',
      action: 'open-analytics',
      category: 'analysis'
    })
  }

  recommendations.push({
    id: 'rec-esql-query',
    title: 'Run ES|QL Query',
    description: 'Query Elasticsearch data with ES|QL',
    action: 'open-esql-console',
    category: 'query'
  })

  recommendations.push({
    id: 'rec-workflow-template',
    title: 'Use Workflow Template',
    description: 'Create incident from pre-configured template',
    action: 'open-workflow-templates',
    category: 'workflow'
  })

  return recommendations.slice(0, 6)
}

export function processVoiceTranscript(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function simulateFileUpload(file: File): Promise<ChatAttachment> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const attachment: ChatAttachment = {
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: file.type.startsWith('image/') ? 'image' :
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'file',
        name: file.name,
        size: file.size,
        url: reader.result as string,
        mimeType: file.type,
        uploadedAt: Date.now()
      }
      
      setTimeout(() => resolve(attachment), 500)
    }
    
    reader.readAsDataURL(file)
  })
}
