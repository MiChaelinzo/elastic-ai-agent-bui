import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/co
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
  onSave: (config: APIConfig) => void
}
export function APIConfigurati
    elasticsearchUrl: '',

  })
  const [testingC
  const [enableEmail,
  onSave: (config: APIConfig) => void
  initialConfig?: APIConfig | null
}

export function APIConfigurationDialog({ isOpen, onClose, onSave, initialConfig }: APIConfigurationDialogProps) {
  const [config, setConfig] = useState<APIConfig>({
    elasticsearchUrl: '',
    elasticsearchApiKey: '',
    slackWebhookUrl: '',
    emailConfig: undefined
  })

  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [enableEmail, setEnableEmail] = useState(false)

    await new Promi
    if (initialConfig) {
    
      setEnableEmail(!!initialConfig.emailConfig)
    }
  }, [initialConfig])

  const handleTestConnection = async () => {
        description: 'Please check your URL and API key'
      toast.error('Please provide Elasticsearch URL and API key')

    }

    setTestingConnection(true)
    setConnectionStatus('idle')

    await new Promise(resolve => setTimeout(resolve, 1500))

    const isValid = config.elasticsearchUrl.startsWith('http')
    
    if (isValid) {
      setConnectionStatus('success')
      toast.success('Connection test successful!', {
        description: 'Your Elasticsearch cluster is reachable'

    } else {
      description: 'Your integrati
      toast.error('Connection test failed', {
        description: 'Please check your URL and API key'
      })
    }


   

                  placeholde
                  onChange={(e) => setConfig({ ...config, elastics
                <p className="text-xs text-muted-foreground">
            


                  id="es-key"
                  placeholder="Enter your Elasticsearch API key"
                  onChange={(e) => setConfig({ ...config, 
              
       


                  disabled={testingC
                
                  {testingConnection ? 'Testing...' : 'Test Con


                    <sp
                )}
                {connectionStatus === 'error' && (
      
             
   

          
              <CardHeader>
                  <SlackLogo size={20} weight="duotone" className="text-
                </Card
                  Receive incident alerts and approval requ
              </CardHeader>
                <div classNam
                  <Input
                    placehold
                    onChange={(e) => setConfig({ ...config, slackWebhookU
                  <p className
                  </p>


              <CardHeader>
                  <div>
                      <EnvelopeSimple size={20} weight="duotone" class
                    </CardT
                      Send
                  </div>
                    checked={enableEmail}
                  />
              </CardHeader
                <CardContent className="sp
                    <div className="space-y-2">
                      
                        pl
                     

                            smtpHost: e.target.value,
                   
                          }
                      />
                    <div className="space-y-2">
                      <Input
                    

            <div className="space-y-4">
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

              <div className="flex gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !config.elasticsearchUrl || !config.elasticsearchApiKey}
                  variant="outline"
                  className="flex-1"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </Button>

                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 text-success px-3 py-2 bg-success/10 rounded-md">
                    <CheckCircle size={20} weight="fill" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 text-destructive px-3 py-2 bg-destructive/10 rounded-md">
                    <Warning size={20} weight="fill" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <SlackLogo size={20} weight="duotone" className="text-primary" />
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <EnvelopeSimple size={20} weight="duotone" className="text-primary" />
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
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.gmail.com"
                        value={config.emailConfig?.smtpHost || ''}
                        onChange={(e) => setConfig({

                          emailConfig: {
                            ...config.emailConfig,
                            smtpHost: e.target.value,
                            smtpPort: config.emailConfig?.smtpPort || 587,
                            fromEmail: config.emailConfig?.fromEmail || '',
                            apiKey: config.emailConfig?.apiKey || ''
                          }

                      />

                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        placeholder="587"
                        value={config.emailConfig?.smtpPort || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          emailConfig: {
                            ...config.emailConfig,
                            smtpHost: config.emailConfig?.smtpHost || '',
                            smtpPort: parseInt(e.target.value) || 587,
                            fromEmail: config.emailConfig?.fromEmail || '',
                            apiKey: config.emailConfig?.apiKey || ''
                          }
                        })}
                      />
                    </div>
                  </div>

                    <Label htmlFor="from-email">From Email</Label>

                      id="from-email"
                      type="email"
                      placeholder="alerts@company.com"
                      value={config.emailConfig?.fromEmail || ''}
                      onChange={(e) => setConfig({

                        emailConfig: {
                          ...config.emailConfig,
                          smtpHost: config.emailConfig?.smtpHost || '',
                          smtpPort: config.emailConfig?.smtpPort || 587,
                          fromEmail: e.target.value,
                          apiKey: config.emailConfig?.apiKey || ''
                        }

                    />

                  <div className="space-y-2">
                    <Label htmlFor="email-key">SMTP API Key</Label>
                    <Input
                      id="email-key"
                      type="password"
                      placeholder="Enter SMTP password or API key"
                      value={config.emailConfig?.apiKey || ''}

                        ...config,

                          ...config.emailConfig,

                          smtpPort: config.emailConfig?.smtpPort || 587,
                          fromEmail: config.emailConfig?.fromEmail || '',
                          apiKey: e.target.value

                      })}

                  </div>
                </CardContent>
              )}

          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">

              <Key size={20} className="text-primary" weight="duotone" />
              <AlertDescription>
                Advanced settings for authentication, rate limiting, and custom headers

            </Alert>

            <Card>

                <CardTitle className="text-base">Security & Performance</CardTitle>

                  Configure advanced options for your API connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>All API keys are encrypted and stored securely in your browser</span>

                <div className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Credentials are never transmitted to third-party services</span>

                <div className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Direct connections to your Elasticsearch cluster only</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                  <span>You can clear all configuration data anytime from Settings</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <Button variant="outline" onClick={onClose}>

          </Button>

            Save Configuration

        </DialogFooter>
      </DialogContent>
    </Dialog>

}
