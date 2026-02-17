import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Warning, SlackLogo, EnvelopeSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

export interface APIConfig {
  elasticsearchUrl: string
  elasticsearchApiKey: string
  slackWebhookUrl?: string
  emailConfig?: {
    smtpHost: string
    smtpPort: number
    fromEmail: string
    apiKey: string
  }
}

interface APIConfigurationDialogProps {
  isOpen: boolean
  onClose: () => void
  initialConfig?: APIConfig | null
  onSave: (config: APIConfig) => void
}

const DEFAULT_CONFIG: APIConfig = {
  elasticsearchUrl: '',
  elasticsearchApiKey: '',
  slackWebhookUrl: '',
  emailConfig: {
    smtpHost: '',
    smtpPort: 587,
    fromEmail: '',
    apiKey: ''
  }
}

export function APIConfigurationDialog({
  isOpen,
  onClose,
  initialConfig,
  onSave
}: APIConfigurationDialogProps) {
  const [config, setConfig] = useState<APIConfig>(DEFAULT_CONFIG)
  const [enableEmail, setEnableEmail] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState('elasticsearch')

  // Load initial config when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setConfig({
          ...DEFAULT_CONFIG,
          ...initialConfig,
          emailConfig: { ...DEFAULT_CONFIG.emailConfig, ...(initialConfig.emailConfig || {}) }
        })
        // Enable email switch if smtp host is present
        setEnableEmail(!!initialConfig.emailConfig?.smtpHost)
      } else {
        setConfig(DEFAULT_CONFIG)
        setEnableEmail(false)
      }
      setConnectionStatus('idle')
    }
  }, [isOpen, initialConfig])

  const handleTestConnection = async () => {
    if (!config.elasticsearchUrl || !config.elasticsearchApiKey) {
      toast.error('Missing Credentials', {
        description: 'Please enter both URL and API Key'
      })
      return
    }

    setConnectionStatus('testing')

    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Basic validation simulation for the demo
      const isValid = config.elasticsearchUrl.startsWith('http')
      
      if (isValid) {
        setConnectionStatus('success')
        toast.success('Connected', { description: 'Successfully connected to Elasticsearch' })
      } else {
        throw new Error('Invalid URL protocol')
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error('Connection Failed', {
        description: 'Please check your URL and API key'
      })
    }
  }

  const handleSave = () => {
    if (!config.elasticsearchUrl) {
      setActiveTab('elasticsearch')
      toast.error('Configuration Invalid', { description: 'Elasticsearch URL is required' })
      return
    }

    const finalConfig: APIConfig = {
      ...config,
      // If email is disabled, we might want to clear or ignore that part of the config
      emailConfig: enableEmail ? config.emailConfig : undefined
    }

    onSave(finalConfig)
    toast.success('Configuration Saved', { description: 'Your system settings have been updated' })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>System Configuration</DialogTitle>
          <DialogDescription>
            Connect to your Elasticsearch cluster and setup notifications.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="elasticsearch">Elasticsearch</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="elasticsearch" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="es-url">Elasticsearch URL *</Label>
              <Input
                id="es-url"
                placeholder="https://your-cluster.es.io:9200"
                value={config.elasticsearchUrl}
                onChange={(e) => setConfig({ ...config, elasticsearchUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Your Elasticsearch cluster endpoint (include protocol and port)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="es-key">API Key *</Label>
              <Input
                id="es-key"
                type="password"
                placeholder="Enter your Elasticsearch API key"
                value={config.elasticsearchApiKey}
                onChange={(e) => setConfig({ ...config, elasticsearchApiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Generate an API key from your Elasticsearch deployment
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing' || !config.elasticsearchUrl || !config.elasticsearchApiKey}
                variant="outline"
                className="flex-1"
              >
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </Button>

              {connectionStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 px-3 py-2 bg-green-50 rounded-md border border-green-200">
                  <CheckCircle size={20} weight="fill" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 text-destructive px-3 py-2 bg-destructive/10 rounded-md border border-destructive/20">
                  <Warning size={20} weight="fill" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SlackLogo size={20} weight="duotone" className="text-blue-500" />
                  Slack Integration
                </CardTitle>
                <CardDescription>
                  Receive incident alerts and approval requests in Slack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Webhook URL (Optional)</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={config.slackWebhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, slackWebhookUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create an incoming webhook in your Slack workspace settings
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <EnvelopeSimple size={20} weight="duotone" className="text-orange-500" />
                      Email Integration
                    </CardTitle>
                    <CardDescription>
                      Send email notifications for critical incidents
                    </CardDescription>
                  </div>
                  <Switch
                    checked={enableEmail}
                    onCheckedChange={setEnableEmail}
                  />
                </div>
              </CardHeader>
              
              {enableEmail && (
                <CardContent className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.example.com"
                        value={config.emailConfig?.smtpHost || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          emailConfig: { ...config.emailConfig!, smtpHost: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        placeholder="587"
                        value={config.emailConfig?.smtpPort || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          emailConfig: { ...config.emailConfig!, smtpPort: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from">From Email</Label>
                    <Input
                      id="smtp-from"
                      placeholder="notifications@example.com"
                      value={config.emailConfig?.fromEmail || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        emailConfig: { ...config.emailConfig!, fromEmail: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-api-key">API Key / Password</Label>
                    <Input
                      id="smtp-api-key"
                      type="password"
                      placeholder="••••••••"
                      value={config.emailConfig?.apiKey || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        emailConfig: { ...config.emailConfig!, apiKey: e.target.value }
                      })}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            <Alert>
              <Warning size={16} className="text-amber-500" />
              <AlertDescription className="text-xs ml-2">
                Make sure your firewall allows outbound connections to these services.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}