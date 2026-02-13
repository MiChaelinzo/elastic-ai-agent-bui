import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, ChatCircleDots, Plus, X, CheckCircle, Warning, PaperPlaneTilt } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { NotificationSettings } from '@/lib/notification-service'
import { sendApprovalNotifications } from '@/lib/notification-service'
import type { Incident } from '@/lib/types'

interface NotificationSettingsProps {
  settings: NotificationSettings
  onChange: (settings: NotificationSettings) => void
}

export function NotificationSettingsComponent({ settings, onChange }: NotificationSettingsProps) {
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)

  const addEmailRecipient = () => {
    const email = newEmail.trim()
    
    if (!email) {
      setEmailError('Email address is required')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    if (settings.emailRecipients.includes(email)) {
      setEmailError('This email is already in the list')
      return
    }
    
    onChange({
      ...settings,
      emailRecipients: [...settings.emailRecipients, email]
    })
    
    setNewEmail('')
    setEmailError('')
  }

  const removeEmailRecipient = (email: string) => {
    onChange({
      ...settings,
      emailRecipients: settings.emailRecipients.filter(e => e !== email)
    })
  }

  const toggleChannel = (channel: 'email' | 'slack') => {
    const hasChannel = settings.channels.includes(channel)
    
    if (hasChannel) {
      onChange({
        ...settings,
        channels: settings.channels.filter(c => c !== channel)
      })
    } else {
      onChange({
        ...settings,
        channels: [...settings.channels, channel]
      })
    }
  }

  const sendTestNotification = async () => {
    if (!settings.enabled || settings.channels.length === 0) {
      toast.error('Please enable notifications and configure at least one channel')
      return
    }

    setIsSendingTest(true)

    const testIncident: Incident = {
      id: 'test-incident-' + Date.now(),
      title: 'Test Notification - API Service High Latency',
      description: 'This is a test notification to verify your notification settings are configured correctly.',
      severity: 'medium',
      status: 'pending-approval',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignedAgents: ['detector', 'analyzer', 'resolver', 'verifier'],
      reasoningSteps: [],
      requiresApproval: true,
      approvalReason: 'Low confidence detected: Analyzer agent confidence is 75%, below the 80% threshold',
      lowestConfidence: 75,
      proposedSolution: 'Scale up API service replicas from 3 to 6 and apply rate limiting rules'
    }

    try {
      const result = await sendApprovalNotifications(settings, {
        incident: testIncident,
        reason: testIncident.approvalReason || 'Test notification',
        lowestConfidence: testIncident.lowestConfidence,
        approvalUrl: window.location.origin + window.location.pathname
      })

      if (result.success) {
        const channelNames = result.results.map(r => r.channel).join(' and ')
        toast.success(`Test notification sent successfully via ${channelNames}!`, {
          description: 'Check your configured channels'
        })
      } else {
        const failedChannels = result.results
          .filter(r => !r.success)
          .map(r => `${r.channel}: ${r.message}`)
        
        toast.error('Test notification failed', {
          description: failedChannels.join(', ')
        })
      }
    } catch (error) {
      toast.error('Failed to send test notification', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const isEmailConfigured = settings.emailRecipients.length > 0
  const isSlackConfigured = settings.slackWebhookUrl.length > 0
  const hasAnyChannel = settings.channels.length > 0
  const canSendTest = settings.enabled && hasAnyChannel && (
    (settings.channels.includes('email') && isEmailConfigured) ||
    (settings.channels.includes('slack') && isSlackConfigured)
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enable Notifications</CardTitle>
              <CardDescription>
                Receive alerts when incidents require approval
              </CardDescription>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => onChange({ ...settings, enabled: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {!settings.enabled && (
        <Alert>
          <Warning size={20} className="text-muted-foreground" />
          <AlertDescription>
            Notifications are currently disabled. Enable them to receive alerts for incidents requiring approval.
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notification Channels</h3>
        
        <Card className={!settings.enabled ? 'opacity-50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <EnvelopeSimple size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Email Notifications</CardTitle>
                  <CardDescription>
                    Send alerts via email to team members
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEmailConfigured && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle size={14} className="mr-1" weight="bold" />
                    Configured
                  </Badge>
                )}
                <Switch
                  checked={settings.channels.includes('email')}
                  onCheckedChange={() => toggleChannel('email')}
                  disabled={!settings.enabled || !isEmailConfigured}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipients">Email Recipients</Label>
              <div className="flex gap-2">
                <Input
                  id="email-recipients"
                  type="email"
                  placeholder="team@example.com"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value)
                    setEmailError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addEmailRecipient()
                    }
                  }}
                  disabled={!settings.enabled}
                />
                <Button
                  onClick={addEmailRecipient}
                  disabled={!settings.enabled || !newEmail.trim()}
                  size="default"
                >
                  <Plus size={18} weight="bold" />
                </Button>
              </div>
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>

            {settings.emailRecipients.length > 0 && (
              <div className="space-y-2">
                <Label>Configured Recipients ({settings.emailRecipients.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.emailRecipients.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="pr-1 pl-3 py-1.5"
                    >
                      <span className="mr-2">{email}</span>
                      <button
                        onClick={() => removeEmailRecipient(email)}
                        className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        disabled={!settings.enabled}
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {settings.emailRecipients.length === 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  Add at least one email recipient to enable email notifications
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className={!settings.enabled ? 'opacity-50' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ChatCircleDots size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Slack Notifications</CardTitle>
                  <CardDescription>
                    Send alerts to a Slack channel via webhook
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSlackConfigured && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle size={14} className="mr-1" weight="bold" />
                    Configured
                  </Badge>
                )}
                <Switch
                  checked={settings.channels.includes('slack')}
                  onCheckedChange={() => toggleChannel('slack')}
                  disabled={!settings.enabled || !isSlackConfigured}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
              <Input
                id="slack-webhook"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={settings.slackWebhookUrl}
                onChange={(e) => onChange({ ...settings, slackWebhookUrl: e.target.value })}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Create an incoming webhook in your Slack workspace settings
              </p>
            </div>

            {!isSlackConfigured && (
              <Alert>
                <AlertDescription className="text-sm">
                  Add a Slack webhook URL to enable Slack notifications
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card className={!settings.enabled ? 'opacity-50' : ''}>
        <CardHeader>
          <CardTitle>Notification Triggers</CardTitle>
          <CardDescription>
            Choose when to send notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Approval Required</Label>
              <p className="text-sm text-muted-foreground">
                Notify when incidents need manual approval
              </p>
            </div>
            <Switch
              checked={settings.notifyOnApprovalRequired}
              onCheckedChange={(checked) =>
                onChange({ ...settings, notifyOnApprovalRequired: checked })
              }
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Confidence Detected</Label>
              <p className="text-sm text-muted-foreground">
                Notify when agent confidence is below threshold
              </p>
            </div>
            <Switch
              checked={settings.notifyOnLowConfidence}
              onCheckedChange={(checked) =>
                onChange({ ...settings, notifyOnLowConfidence: checked })
              }
              disabled={!settings.enabled}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Critical Incidents</Label>
              <p className="text-sm text-muted-foreground">
                Always notify for critical severity incidents
              </p>
            </div>
            <Switch
              checked={settings.notifyOnCriticalIncidents}
              onCheckedChange={(checked) =>
                onChange({ ...settings, notifyOnCriticalIncidents: checked })
              }
              disabled={!settings.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {settings.enabled && !hasAnyChannel && (
        <Alert className="border-warning">
          <Warning size={20} className="text-warning" />
          <AlertDescription>
            Notifications are enabled but no channels are active. Configure and enable at least one notification channel.
          </AlertDescription>
        </Alert>
      )}

      {settings.enabled && hasAnyChannel && (
        <Alert className="border-success">
          <CheckCircle size={20} className="text-success" />
          <AlertDescription>
            Notifications are active on {settings.channels.length} channel{settings.channels.length !== 1 ? 's' : ''}: {settings.channels.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {canSendTest && (
        <Card>
          <CardHeader>
            <CardTitle>Test Notifications</CardTitle>
            <CardDescription>
              Send a test notification to verify your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={sendTestNotification}
              disabled={isSendingTest}
              className="w-full"
              size="lg"
            >
              <PaperPlaneTilt size={20} className="mr-2" weight="bold" />
              {isSendingTest ? 'Sending Test...' : 'Send Test Notification'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
