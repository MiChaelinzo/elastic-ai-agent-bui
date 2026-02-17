import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Database, Gear, CheckCircle, Warning } from '@phosphor-icons/react'
import type { APIConfig } from '@/lib/auth-types'

interface ModeSwitcherProps {
  currentMode: 'demo' | 'api'
  apiConfig: APIConfig | null
  onSwitchToDemo: () => void
  onConfigureAPI: () => void
}

export function ModeSwitcher({ currentMode, apiConfig, onSwitchToDemo, onConfigureAPI }: ModeSwitcherProps) {
  const hasValidAPIConfig = apiConfig && apiConfig.elasticsearchUrl && apiConfig.elasticsearchApiKey

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Data Source Mode</h3>
        <p className="text-sm text-muted-foreground">
          Choose between demo data or connecting to your Elasticsearch cluster
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`relative ${currentMode === 'demo' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Play size={20} weight="duotone" className="text-primary" />
                Demo Mode
              </CardTitle>
              {currentMode === 'demo' && (
                <Badge variant="default">Active</Badge>
              )}
            </div>
            <CardDescription>
              Explore with sample data and simulated incidents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                <span>Pre-loaded sample incidents</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                <span>Full feature access</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle size={16} weight="fill" className="text-accent mt-0.5 flex-shrink-0" />
                <span>No configuration needed</span>
              </div>
              {currentMode !== 'demo' && (
                <Button 
                  onClick={onSwitchToDemo} 
                  variant="outline" 
                  className="w-full mt-2"
                >
                  Switch to Demo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`relative ${currentMode === 'api' ? 'ring-2 ring-accent' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Database size={20} weight="duotone" className="text-accent" />
                API Mode
              </CardTitle>
              {currentMode === 'api' && (
                <Badge variant="secondary" className={hasValidAPIConfig ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                  {hasValidAPIConfig ? 'Connected' : 'Not Configured'}
                </Badge>
              )}
            </div>
            <CardDescription>
              Connect to your Elasticsearch deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hasValidAPIConfig ? (
                <>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle size={16} weight="fill" className="text-success mt-0.5 flex-shrink-0" />
                    <span>Connected to {new URL(apiConfig.elasticsearchUrl).hostname}</span>
                  </div>
                  {apiConfig.slackWebhookUrl && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle size={16} weight="fill" className="text-success mt-0.5 flex-shrink-0" />
                      <span>Slack notifications enabled</span>
                    </div>
                  )}
                  {apiConfig.emailConfig && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle size={16} weight="fill" className="text-success mt-0.5 flex-shrink-0" />
                      <span>Email notifications enabled</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Warning size={16} weight="fill" className="text-warning mt-0.5 flex-shrink-0" />
                    <span>No API configuration found</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Gear size={16} weight="duotone" className="mt-0.5 flex-shrink-0" />
                    <span>Configure to use real data</span>
                  </div>
                </>
              )}
              <Button 
                onClick={onConfigureAPI} 
                variant="outline"
                className="w-full mt-2"
              >
                <Gear size={16} className="mr-2" weight="duotone" />
                {hasValidAPIConfig ? 'Update Configuration' : 'Configure API'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
