import { useState, useEffect, useCallback, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  createElasticsearchConnection, 
  type ElasticsearchConnection, 
  type ElasticsearchConfig 
} from '@/lib/elasticsearch-connection'
import { 
  createStreamService, 
  type ElasticsearchStreamService,
  type MetricStreamConfig,
  type StreamedDataPoint
} from '@/lib/elasticsearch-stream'
import type { StreamDefinition } from '@/components/StreamConfigurationUI'

export interface UseElasticsearchReturn {
  connection: ElasticsearchConnection | null
  streamService: ElasticsearchStreamService | null
  isConnected: boolean
  connectionInfo: any
  config: ElasticsearchConfig | null
  availableIndices: string[]
  streams: StreamDefinition[]
  connect: (config: ElasticsearchConfig) => Promise<void>
  disconnect: () => void
  addStream: (stream: Omit<StreamDefinition, 'id' | 'isActive'>) => void
  removeStream: (id: string) => void
  startStream: (id: string) => void
  stopStream: (id: string) => void
  onStreamData: (streamId: string, callback: (data: StreamedDataPoint) => void) => void
}

export function useElasticsearch(): UseElasticsearchReturn {
  const [config, setConfig] = useKV<ElasticsearchConfig | null>('elasticsearch-config', null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [availableIndices, setAvailableIndices] = useState<string[]>([])
  const [streams, setStreams] = useKV<StreamDefinition[]>('elasticsearch-streams', [])
  
  const connectionRef = useRef<ElasticsearchConnection | null>(null)
  const streamServiceRef = useRef<ElasticsearchStreamService | null>(null)
  const streamCallbacksRef = useRef<Map<string, (data: StreamedDataPoint) => void>>(new Map())

  const connect = useCallback(async (newConfig: ElasticsearchConfig) => {
    try {
      const connection = createElasticsearchConnection(newConfig)
      const testResult = await connection.testConnection()

      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed')
      }

      connectionRef.current = connection
      streamServiceRef.current = createStreamService(connection)
      
      setConfig(newConfig)
      setIsConnected(true)
      setConnectionInfo(testResult.info)

      try {
        const indices = await connection.getIndices()
        setAvailableIndices(indices)
      } catch (error) {
        console.warn('Failed to fetch indices:', error)
        setAvailableIndices([])
      }
    } catch (error) {
      console.error('Connection failed:', error)
      throw error
    }
  }, [setConfig])

  const disconnect = useCallback(() => {
    if (streamServiceRef.current) {
      streamServiceRef.current.stopAllStreams()
    }

    connectionRef.current = null
    streamServiceRef.current = null
    setIsConnected(false)
    setConnectionInfo(null)
    setAvailableIndices([])
    
    setStreams(current => 
      (current || []).map(s => ({ ...s, isActive: false }))
    )
  }, [setStreams])

  const addStream = useCallback((streamDef: Omit<StreamDefinition, 'id' | 'isActive'>) => {
    const newStream: StreamDefinition = {
      ...streamDef,
      id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: false
    }

    setStreams(current => [...(current || []), newStream])
  }, [setStreams])

  const removeStream = useCallback((id: string) => {
    if (streamServiceRef.current?.isStreamActive(id)) {
      streamServiceRef.current.stopStream(id)
    }
    streamCallbacksRef.current.delete(id)
    
    setStreams(current => (current || []).filter(s => s.id !== id))
  }, [setStreams])

  const startStream = useCallback((id: string) => {
    const stream = (streams || []).find(s => s.id === id)
    if (!stream || !streamServiceRef.current) return

    const callback = streamCallbacksRef.current.get(id)
    const onData = (data: StreamedDataPoint) => {
      setStreams(current =>
        (current || []).map(s =>
          s.id === id
            ? { ...s, lastValue: data.value, lastUpdate: data.timestamp, error: undefined }
            : s
        )
      )
      
      if (callback) {
        callback(data)
      }
    }

    const onError = (error: Error) => {
      setStreams(current =>
        (current || []).map(s =>
          s.id === id
            ? { ...s, error: error.message, isActive: false }
            : s
        )
      )
    }

    const streamConfig: MetricStreamConfig = {
      index: stream.index,
      metricField: stream.metricField,
      timestampField: stream.timestampField,
      interval: stream.interval,
      filters: stream.filters
    }

    if (stream.aggregation) {
      streamServiceRef.current.startAggregatedStream(
        id,
        { ...streamConfig, aggregation: stream.aggregation },
        onData,
        onError
      )
    } else {
      streamServiceRef.current.startMetricStream(
        id,
        streamConfig,
        onData,
        onError
      )
    }

    setStreams(current =>
      (current || []).map(s => s.id === id ? { ...s, isActive: true, error: undefined } : s)
    )
  }, [streams, setStreams])

  const stopStream = useCallback((id: string) => {
    if (streamServiceRef.current) {
      streamServiceRef.current.stopStream(id)
    }
    
    setStreams(current =>
      (current || []).map(s => s.id === id ? { ...s, isActive: false } : s)
    )
  }, [setStreams])

  const onStreamData = useCallback((streamId: string, callback: (data: StreamedDataPoint) => void) => {
    streamCallbacksRef.current.set(streamId, callback)
  }, [])

  useEffect(() => {
    if (config && !isConnected) {
      connect(config).catch(console.error)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (streamServiceRef.current) {
        streamServiceRef.current.stopAllStreams()
      }
    }
  }, [])

  return {
    connection: connectionRef.current,
    streamService: streamServiceRef.current,
    isConnected,
    connectionInfo,
    config: config || null,
    availableIndices,
    streams: streams || [],
    connect,
    disconnect,
    addStream,
    removeStream,
    startStream,
    stopStream,
    onStreamData
  }
}
