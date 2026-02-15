import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plugs, 
  CheckCircle, 
  Warning, 
  Lightning,
  ArrowsClockwise,
  Plus,
  Trash
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Integration, IntegrationType } from '@/lib/integration-hub'
import { 
  createIntegration,
  testIntegrationConnection,
  syncIntegration,
  getIntegrationIcon,
  getIntegrationDescription,
  getSuggestedActions
} from '@/lib/integration-hub'

interface IntegrationHubProps {
  integrations: Integration[]
  onIntegrationUpdate: (integrations: Integration[]) => void
}

export function IntegrationHub({ integrations, onIntegrationUpdate }: IntegrationHubProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedType, setSelectedType] = useState<IntegrationType>('github')
  const [newIntegrationName, setNewIntegrationName] = useState('')
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  const availableTypes: IntegrationType[] = [
    'github',
    'jira',
    'pagerduty',
    'slack',
    'teams',
    'datadog',
    'newrelic',
    'grafana'
  ]

  const handleAddIntegration = () => {
    if (!newIntegrationName) {
      toast.error('Please enter an integration name')
      return
    }

    const newIntegration = createIntegration(
      selectedType,
      newIntegrationName,
      {}
    )

    onIntegrationUpdate([...integrations, newIntegration])
    setShowAddDialog(false)
    setNewIntegrationName('')
    toast.success(`${newIntegrationName} integration added`)
  }

  const handleToggleIntegration = (integrationId: string, enabled: boolean) => {
    const updated = integrations.map(int =>
      int.id === integrationId
        ? { ...int, enabled, status: enabled ? 'connected' as const : 'disconnected' as const }
        : int
    )
    onIntegrationUpdate(updated)
    
    const integration = integrations.find(int => int.id === integrationId)
    toast.success(`${integration?.name} ${enabled ? 'enabled' : 'disabled'}`)
  }

  const handleTestConnection = async (integration: Integration) => {
    setTestingConnection(integration.id)
    
    try {
      const result = await testIntegrationConnection(integration)
      
      const updated = integrations.map(int =>
        int.id === integration.id
          ? { 
              ...int, 
              status: result.success ? 'connected' as const : 'error' as const,
              errorMessage: result.success ? undefined : result.message
            }
          : int
      )
      onIntegrationUpdate(updated)
      
      if (result.success) {
        toast.success(result.message, {
          description: `Latency: ${result.latency}ms`
        })
      } else {
        toast.error(result.message)
      }
    } finally {
      setTestingConnection(null)
    }
  }

  const handleSync = async (integration: Integration) => {
    setSyncing(integration.id)
    
    try {
      const result = await syncIntegration(integration)
      
      const updated = integrations.map(int =>
        int.id === integration.id
          ? { ...int, lastSync: Date.now() }
          : int
      )
      onIntegrationUpdate(updated)
      
      if (result.success) {
        toast.success(`Synced ${result.itemsSynced} items from ${integration.name}`)
      } else {
        toast.error('Sync failed', {
          description: result.errors.join(', ')
        })
      }
    } finally {
      setSyncing(null)
    }
  }

  const handleDeleteIntegration = (integrationId: string) => {
    const integration = integrations.find(int => int.id === integrationId)
    const updated = integrations.filter(int => int.id !== integrationId)
    onIntegrationUpdate(updated)
    toast.success(`${integration?.name} removed`)
  }

  const connectedIntegrations = integrations.filter(int => int.enabled && int.status === 'connected')
  const errorIntegrations = integrations.filter(int => int.status === 'error')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Plugs size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
            <p className="text-xs text-muted-foreground">
              {connectedIntegrations.length} connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <CheckCircle size={20} className="text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{connectedIntegrations.length}</div>
            <p className="text-xs text-muted-foreground">
              Operating normally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Errors</CardTitle>
            <Warning size={20} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorIntegrations.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Hub</h2>
          <p className="text-muted-foreground">
            Connect external tools and services for automated workflows
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus size={18} className="mr-2" weight="bold" />
          Add Integration
        </Button>
      </div>

      {errorIntegrations.length > 0 && (
        <Alert variant="destructive">
          <Warning size={18} />
          <AlertDescription>
            {errorIntegrations.length} integration{errorIntegrations.length > 1 ? 's have' : ' has'} connection errors. 
            Please check configuration and test connections.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({integrations.length})</TabsTrigger>
          <TabsTrigger value="connected">Connected ({connectedIntegrations.length})</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map(integration => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getIntegrationIcon(integration.type)}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {getIntegrationDescription(integration.type)}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        integration.status === 'connected' ? 'default' :
                        integration.status === 'error' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {integration.status}
                    </Badge>
                    {integration.lastSync && (
                      <span className="text-xs text-muted-foreground">
                        Last sync: {new Date(integration.lastSync).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {integration.errorMessage && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        {integration.errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(integration)}
                      disabled={testingConnection === integration.id || !integration.enabled}
                    >
                      <Lightning size={16} className="mr-2" />
                      {testingConnection === integration.id ? 'Testing...' : 'Test'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(integration)}
                      disabled={syncing === integration.id || !integration.enabled || integration.status !== 'connected'}
                    >
                      <ArrowsClockwise size={16} className="mr-2" />
                      {syncing === integration.id ? 'Syncing...' : 'Sync'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteIntegration(integration.id)}
                    >
                      <Trash size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs font-semibold mb-2">Available Actions</div>
                    <div className="flex flex-wrap gap-1">
                      {getSuggestedActions(integration.type).slice(0, 5).map(action => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {integrations.length === 0 && (
            <Alert>
              <AlertDescription>
                No integrations configured yet. Click "Add Integration" to get started.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="connected" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedIntegrations.map(integration => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getIntegrationIcon(integration.type)}</div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {getIntegrationDescription(integration.type)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    {integration.lastSync && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync</span>
                        <span className="text-xs">
                          {new Date(integration.lastSync).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {connectedIntegrations.length === 0 && (
            <Alert>
              <AlertDescription>
                No active connections. Enable integrations to see them here.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableTypes
              .filter(type => !integrations.some(int => int.type === type))
              .map(type => (
                <Card key={type} className="cursor-pointer hover:border-primary transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getIntegrationIcon(type)}</div>
                      <div>
                        <CardTitle className="text-lg capitalize">{type}</CardTitle>
                        <CardDescription className="text-xs">
                          {getIntegrationDescription(type)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedType(type)
                        setShowAddDialog(true)
                      }}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Integration
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Integration</DialogTitle>
            <DialogDescription>
              Configure a new integration to connect external services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Integration Type</Label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as IntegrationType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <span>{getIntegrationIcon(type)}</span>
                        <span className="capitalize">{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Integration Name</Label>
              <Input
                id="name"
                placeholder="e.g., Production GitHub, Main Slack Channel"
                value={newIntegrationName}
                onChange={(e) => setNewIntegrationName(e.target.value)}
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                {getIntegrationDescription(selectedType)}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIntegration}>
              <Plus size={18} className="mr-2" />
              Add Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
