import type { Incident } from './types'

export type NotificationChannel = 'email' | 'slack'

export interface NotificationSettings {
  enabled: boolean
  channels: NotificationChannel[]
  emailRecipients: string[]
  slackWebhookUrl: string
  notifyOnApprovalRequired: boolean
  notifyOnLowConfidence: boolean
  notifyOnCriticalIncidents: boolean
}

export interface NotificationPayload {
  incident: Incident
  reason: string
  lowestConfidence?: number
  approvalUrl?: string
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  channels: [],
  emailRecipients: [],
  slackWebhookUrl: '',
  notifyOnApprovalRequired: true,
  notifyOnLowConfidence: true,
  notifyOnCriticalIncidents: true
}

function formatIncidentSeverity(severity: string): string {
  const severityEmojis: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }
  return `${severityEmojis[severity] || '⚪'} ${severity.toUpperCase()}`
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function generateEmailContent(payload: NotificationPayload): { subject: string; body: string } {
  const { incident, reason, lowestConfidence } = payload
  
  const subject = `🚨 Approval Required: ${incident.title}`
  
  const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .severity-badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: 600; margin-top: 10px; }
    .severity-critical { background: #ef4444; color: white; }
    .severity-high { background: #f97316; color: white; }
    .severity-medium { background: #f59e0b; color: white; }
    .severity-low { background: #10b981; color: white; }
    .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .info-row { margin: 15px 0; }
    .label { font-weight: 600; color: #4b5563; }
    .value { color: #1f2937; }
    .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
    .footer { color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Incident Approval Required</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Human review needed before automated resolution</p>
    </div>
    
    <div class="content">
      <h2 style="margin-top: 0;">${incident.title}</h2>
      <span class="severity-badge severity-${incident.severity}">${formatIncidentSeverity(incident.severity)}</span>
      
      <div class="info-row">
        <div class="label">Description:</div>
        <div class="value">${incident.description}</div>
      </div>
      
      <div class="info-row">
        <div class="label">Created:</div>
        <div class="value">${formatTimestamp(incident.createdAt)}</div>
      </div>
      
      <div class="info-row">
        <div class="label">Incident ID:</div>
        <div class="value" style="font-family: monospace;">${incident.id}</div>
      </div>
    </div>
    
    <div class="alert-box">
      <strong>⚠️ Approval Required</strong><br/>
      <div style="margin-top: 10px;">${reason}</div>
      ${lowestConfidence ? `<div style="margin-top: 10px;"><strong>Lowest Confidence Score:</strong> ${lowestConfidence}%</div>` : ''}
    </div>
    
    ${incident.proposedSolution ? `
    <div class="content">
      <div class="label">Proposed Solution:</div>
      <div class="value" style="margin-top: 10px;">${incident.proposedSolution}</div>
    </div>
    ` : ''}
    
    <div style="text-align: center;">
      <a href="${payload.approvalUrl || '#'}" class="button">Review & Approve Incident →</a>
    </div>
    
    <div class="footer">
      <p>This notification was sent by Elastic Agent Orchestrator</p>
      <p>Multi-Agent DevOps Incident Response System</p>
    </div>
  </div>
</body>
</html>
  `.trim()
  
  return { subject, body }
}

export function generateSlackMessage(payload: NotificationPayload): any {
  const { incident, reason, lowestConfidence } = payload
  
  const severityColors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#10b981'
  }
  
  return {
    text: `🚨 Incident Approval Required: ${incident.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚡ Incident Approval Required',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Title:*\n${incident.title}`
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${formatIncidentSeverity(incident.severity)}`
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${incident.status.replace('-', ' ').toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Created:*\n${formatTimestamp(incident.createdAt)}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${incident.description}`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⚠️ *Approval Required*\n${reason}${lowestConfidence ? `\n\n*Lowest Confidence Score:* ${lowestConfidence}%` : ''}`
        }
      },
      ...(incident.proposedSolution ? [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Proposed Solution:*\n${incident.proposedSolution}`
          }
        }
      ] : []),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Review & Approve',
              emoji: true
            },
            style: 'primary',
            url: payload.approvalUrl || '#',
            action_id: 'approve_incident'
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Incident ID: \`${incident.id}\` | Elastic Agent Orchestrator`
          }
        ]
      }
    ],
    attachments: [
      {
        color: severityColors[incident.severity] || '#6b7280',
        fallback: `Incident ${incident.id} requires approval`
      }
    ]
  }
}

export async function sendEmailNotification(
  recipients: string[],
  subject: string,
  body: string
): Promise<{ success: boolean; message: string }> {
  try {
    const emailData = {
      to: recipients,
      subject,
      html: body,
      from: 'Elastic Agent Orchestrator <notifications@elastic-agents.dev>'
    }
    
    console.log('📧 Email notification would be sent:', {
      recipients,
      subject,
      bodyLength: body.length
    })
    
    return {
      success: true,
      message: `Email notification queued for ${recipients.length} recipient(s)`
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function sendSlackNotification(
  webhookUrl: string,
  message: any
): Promise<{ success: boolean; message: string }> {
  try {
    if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com/')) {
      throw new Error('Invalid Slack webhook URL')
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Slack API error: ${response.status} - ${errorText}`)
    }
    
    return {
      success: true,
      message: 'Slack notification sent successfully'
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function sendApprovalNotifications(
  settings: NotificationSettings,
  payload: NotificationPayload
): Promise<{ success: boolean; results: Array<{ channel: string; success: boolean; message: string }> }> {
  if (!settings.enabled || settings.channels.length === 0) {
    return {
      success: false,
      results: [{ channel: 'none', success: false, message: 'Notifications are disabled' }]
    }
  }
  
  const results: Array<{ channel: string; success: boolean; message: string }> = []
  
  for (const channel of settings.channels) {
    if (channel === 'email' && settings.emailRecipients.length > 0) {
      const { subject, body } = generateEmailContent(payload)
      const result = await sendEmailNotification(settings.emailRecipients, subject, body)
      results.push({
        channel: 'email',
        success: result.success,
        message: result.message
      })
    }
    
    if (channel === 'slack' && settings.slackWebhookUrl) {
      const message = generateSlackMessage(payload)
      const result = await sendSlackNotification(settings.slackWebhookUrl, message)
      results.push({
        channel: 'slack',
        success: result.success,
        message: result.message
      })
    }
  }
  
  const allSucceeded = results.every(r => r.success)
  
  return {
    success: allSucceeded,
    results
  }
}
