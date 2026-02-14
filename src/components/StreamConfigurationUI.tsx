import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Database, Play, Pause, Trash, CheckCircle, Warning, ChartLine } from '@phosphor-icons/react'
import type { MetricStreamConfig } from '@/lib/elasticsearch-stream'

export interface StreamDefinition extends MetricStreamConfig {
  id: string
  name: string
  aggregation?: 'avg' | 'sum' | 'max' | 'min' | 'count'
  isActive: boolean
  lastValue?: number
  lastUpdate?: number
  error?: string
}

interface StreamConfigurationUIProps {
  availableIndices: string[]
  streams: StreamDefinition[]
  onAddStream: (stream: Omit<StreamDefinition, 'id' | 'isActive'>) => void
  onRemoveStream: (id: string) => void
  onStartStream: (id: string) => void
  onStopStream: (id: string) => void
  isConnected: boolean
}

export function StreamConfigurationUI({
  availableIndices,
  streams,
  onAddStream,
  onRemoveStream,
  onStartStream,
  onStopStream,
  isConnected
}: StreamConfigurationUIProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    index: '',
    metricField: '',
    timestampField: '@timestamp',
    interval: 5000,
    aggregation: 'avg' as 'avg' | 'sum' | 'max' | 'min' | 'count'
  })

  const handleAddStream = () => {
    if (!formData.name || !formData.index || !formData.metricField) {
      return
    }

    onAddStream({
      name: formData.name,
      index: formData.index,
      metricField: formData.metricField,
      timestampField: formData.timestampField,
      interval: formData.interval,
      aggregation: formData.aggregation
    })

    setFormData({
      name: '',
      index: '',
      metricField: '',
      timestampField: '@timestamp',
      interval: 5000,
      aggregation: 'avg'
    })
    setShowAddForm(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChartLine size={28} weight="duotone" className="text-primary" />
            <div>
              <CardTitle>Data Streams</CardTitle>
              <CardDescription>
                Configure real-time metric streams from Elasticsearch indices
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
              {showAddForm ? 'Cancel' : 'Add Stream'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert className="border-warning">
            <Warning size={20} className="text-warning" />
            <AlertDescription>
              Connect to Elasticsearch to configure data streams
            </AlertDescription>
          </Alert>
        )}

        {showAddForm && isConnected && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-base">New Stream Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-name">Stream Name</Label>
                <Input
                  id="stream-name"
                  placeholder="CPU Usage Stream"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream-index">Index Pattern</Label>
                {availableIndices.length > 0 ? (
                  <Select value={formData.index} onValueChange={(v) => setFormData(prev => ({ ...prev, index: v }))}>
                    <SelectTrigger id="stream-index">
                      <SelectValue placeholder="Select index" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIndices.map(index => (
                        <SelectItem key={index} value={index}>
                          {index}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="stream-index"
                    placeholder="metrics-*"
                    value={formData.index}
                    onChange={(e) => setFormData(prev => ({ ...prev, index: e.target.value }))}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric-field">Metric Field</Label>
                  <Input
                    id="metric-field"
                    placeholder="system.cpu.percent"
                    value={formData.metricField}
                    onChange={(e) => setFormData(prev => ({ ...prev, metricField: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timestamp-field">Timestamp Field</Label>
                  <Input
                    id="timestamp-field"
                    placeholder="@timestamp"
                    value={formData.timestampField}
                    onChange={(e) => setFormData(prev => ({ ...prev, timestampField: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aggregation">Aggregation</Label>
                  <Select 
                    value={formData.aggregation} 
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, aggregation: v }))}
                  >
                    <SelectTrigger id="aggregation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Update Interval (ms)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1000"
                    step="1000"
                    value={formData.interval}
                    onChange={(e) => setFormData(prev => ({ ...prev, interval: parseInt(e.target.value) || 5000 }))}
                  />
                </div>
              </div>

              <Button onClick={handleAddStream} className="w-full">
                Add Stream
              </Button>
            </CardContent>
          </Card>
        )}

        {streams.length === 0 && !showAddForm && isConnected && (
          <Alert>
            <Database size={20} />
            <AlertDescription>
              No streams configured. Click "Add Stream" to create your first data stream.
            </AlertDescription>
          </Alert>
        )}

        {streams.length > 0 && (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {streams.map(stream => (
                <Card key={stream.id} className={stream.isActive ? 'border-primary' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{stream.name}</h4>
                          {stream.isActive ? (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              <Play size={12} weight="fill" className="mr-1" />
                              Streaming
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Stopped</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div><strong>Index:</strong> {stream.index}</div>
                          <div><strong>Field:</strong> {stream.metricField}</div>
                          <div><strong>Aggregation:</strong> {stream.aggregation || 'Latest Value'}</div>
                          <div><strong>Interval:</strong> {stream.interval}ms</div>
                        </div>

                        {stream.lastValue !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle size={16} className="text-success" />
                            <span>Last value: <strong>{stream.lastValue.toFixed(2)}</strong></span>
                            {stream.lastUpdate && (
                              <span className="text-muted-foreground">
                                ({new Date(stream.lastUpdate).toLocaleTimeString()})
                              </span>
                            )}
                          </div>
                        )}

                        {stream.error && (
                          <Alert className="border-destructive mt-2">
                            <Warning size={16} className="text-destructive" />
                            <AlertDescription className="text-xs">{stream.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {stream.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStopStream(stream.id)}
                          >
                            <Pause size={16} weight="bold" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStartStream(stream.id)}
                            disabled={!isConnected}
                          >
                            <Play size={16} weight="bold" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRemoveStream(stream.id)}
                        >
                          <Trash size={16} weight="bold" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
