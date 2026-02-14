import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Database, CheckCircle, Warning, Plug } from '@phosphor-icons/react'
import type { ElasticsearchConfig } from '@/lib/elasticsearch-connection'

interface ElasticsearchConnectionUIProps {
  config: ElasticsearchConfig | null
  isConnected: boolean
  connectionInfo?: any
  onConnect: (config: ElasticsearchConfig) => Promise<void>
  onDisconnect: () => void
}

export function ElasticsearchConnectionUI({
  config,
  isConnected,
  connectionInfo,
  onConnect,
  onDisconnect
}: ElasticsearchConnectionUIProps) {
  const [authMethod, setAuthMethod] = useState<'apiKey' | 'basic' | 'cloud'>('apiKey')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ElasticsearchConfig>({
    host: config?.host || 'https://localhost:9200',
    apiKey: config?.apiKey || '',
    username: config?.username || '',
    password: config?.password || '',
    cloudId: config?.cloudId || ''
  })

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const configToUse: ElasticsearchConfig = {
        host: formData.host
      }

      if (authMethod === 'apiKey') {
        configToUse.apiKey = formData.apiKey
      } else if (authMethod === 'basic') {
        configToUse.username = formData.username
        configToUse.password = formData.password
      } else if (authMethod === 'cloud') {
        configToUse.cloudId = formData.cloudId
        configToUse.apiKey = formData.apiKey
      }

      await onConnect(configToUse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={28} weight="duotone" className="text-primary" />
            <div>
              <CardTitle>Elasticsearch Connection</CardTitle>
              <CardDescription>
                Connect to your Elasticsearch cluster for real-time data streaming
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="default" className="bg-success text-success-foreground">
              <CheckCircle size={16} className="mr-1" weight="bold" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isConnected && connectionInfo && (
          <Alert className="border-success">
            <CheckCircle size={20} className="text-success" />
            <AlertDescription>
              <div className="space-y-1">
                <div><strong>Cluster:</strong> {connectionInfo.cluster_name}</div>
                <div><strong>Version:</strong> {connectionInfo.version?.number}</div>
                <div><strong>Status:</strong> {connectionInfo.tagline || 'Running'}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-destructive">
            <Warning size={20} className="text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected && (
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apiKey">API Key</TabsTrigger>
              <TabsTrigger value="basic">Username/Password</TabsTrigger>
              <TabsTrigger value="cloud">Elastic Cloud</TabsTrigger>
            </TabsList>

            <TabsContent value="apiKey" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="host-apikey">Elasticsearch Host</Label>
                <Input
                  id="host-apikey"
                  placeholder="https://localhost:9200"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apikey">API Key</Label>
                <Input
                  id="apikey"
                  type="password"
                  placeholder="Your API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="host-basic">Elasticsearch Host</Label>
                <Input
                  id="host-basic"
                  placeholder="https://localhost:9200"
                  value={formData.host}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="elastic"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="cloud" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cloudid">Cloud ID</Label>
                <Input
                  id="cloudid"
                  placeholder="cluster:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJA..."
                  value={formData.cloudId}
                  onChange={(e) => setFormData(prev => ({ ...prev, cloudId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cloud-apikey">API Key</Label>
                <Input
                  id="cloud-apikey"
                  type="password"
                  placeholder="Your API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <CardFooter>
        {isConnected ? (
          <Button onClick={onDisconnect} variant="destructive" className="w-full">
            <Plug size={18} className="mr-2" weight="bold" />
            Disconnect
          </Button>
        ) : (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
          >
            <Plug size={18} className="mr-2" weight="bold" />
            {isConnecting ? 'Connecting...' : 'Connect to Elasticsearch'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
