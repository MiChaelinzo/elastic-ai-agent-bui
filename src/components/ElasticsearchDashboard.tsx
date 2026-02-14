import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ElasticsearchConnectionUI } from '@/components/ElasticsearchConnectionUI'
import { StreamConfigurationUI } from '@/components/StreamConfigurationUI'
import { Database, ChartLine, Code } from '@phosphor-icons/react'
import type { UseElasticsearchReturn } from '@/hooks/use-elasticsearch'

interface ElasticsearchDashboardProps {
  isOpen: boolean
  onClose: () => void
  elasticsearch: UseElasticsearchReturn
}

export function ElasticsearchDashboard({
  isOpen,
  onClose,
  elasticsearch
}: ElasticsearchDashboardProps) {
  const {
    isConnected,
    connectionInfo,
    config,
    availableIndices,
    streams,
    connect,
    disconnect,
    addStream,
    removeStream,
    startStream,
    stopStream
  } = elasticsearch

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database size={28} weight="duotone" className="text-primary" />
            Elasticsearch Integration
          </DialogTitle>
          <DialogDescription>
            Connect to your Elasticsearch cluster and configure real-time data streams for production monitoring
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connection" className="py-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Database size={18} weight="duotone" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="streams" className="flex items-center gap-2" disabled={!isConnected}>
              <ChartLine size={18} weight="duotone" />
              Data Streams ({streams.length})
            </TabsTrigger>
            <TabsTrigger value="queries" className="flex items-center gap-2" disabled={!isConnected}>
              <Code size={18} weight="duotone" />
              ES|QL Queries
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4 mt-6">
            <ElasticsearchConnectionUI
              config={config}
              isConnected={isConnected}
              connectionInfo={connectionInfo}
              onConnect={connect}
              onDisconnect={disconnect}
            />
          </TabsContent>

          <TabsContent value="streams" className="space-y-4 mt-6">
            <StreamConfigurationUI
              availableIndices={availableIndices}
              streams={streams}
              onAddStream={addStream}
              onRemoveStream={removeStream}
              onStartStream={startStream}
              onStopStream={stopStream}
              isConnected={isConnected}
            />
          </TabsContent>

          <TabsContent value="queries" className="space-y-4 mt-6">
            <div className="text-sm text-muted-foreground">
              ES|QL query interface coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
