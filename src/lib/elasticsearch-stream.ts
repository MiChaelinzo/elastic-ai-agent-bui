import type { ElasticsearchConnection } from './elasticsearch-connection'

export interface MetricStreamConfig {
  index: string
  metricField: string
  timestampField: string
  interval: number
  filters?: Record<string, any>
}

export interface StreamedDataPoint {
  timestamp: number
  value: number
  metadata?: Record<string, any>
}

export type MetricStreamCallback = (dataPoint: StreamedDataPoint) => void
export type ErrorCallback = (error: Error) => void

export class ElasticsearchStreamService {
  private connection: ElasticsearchConnection
  private activeStreams: Map<string, NodeJS.Timeout> = new Map()
  private streamConfigs: Map<string, MetricStreamConfig> = new Map()

  constructor(connection: ElasticsearchConnection) {
    this.connection = connection
  }

  async startMetricStream(
    streamId: string,
    config: MetricStreamConfig,
    onData: MetricStreamCallback,
    onError?: ErrorCallback
  ): Promise<void> {
    if (this.activeStreams.has(streamId)) {
      this.stopStream(streamId)
    }

    this.streamConfigs.set(streamId, config)

    const pollData = async () => {
      try {
        const now = Date.now()
        const from = now - config.interval * 2

        const query = {
          size: 1,
          sort: [{ [config.timestampField]: { order: 'desc' } }],
          query: {
            bool: {
              must: [
                {
                  range: {
                    [config.timestampField]: {
                      gte: from,
                      lte: now
                    }
                  }
                },
                ...(config.filters ? [config.filters] : [])
              ]
            }
          },
          _source: [config.metricField, config.timestampField]
        }

        const response = await this.connection.search(config.index, query)

        if (response.hits.hits.length > 0) {
          const hit = response.hits.hits[0]
          const source = hit._source

          const dataPoint: StreamedDataPoint = {
            timestamp: new Date(source[config.timestampField]).getTime(),
            value: parseFloat(source[config.metricField]) || 0,
            metadata: source
          }

          onData(dataPoint)
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Stream error'))
        }
      }
    }

    await pollData()

    const intervalId = setInterval(pollData, config.interval)
    this.activeStreams.set(streamId, intervalId)
  }

  async startAggregatedStream(
    streamId: string,
    config: MetricStreamConfig & { aggregation: 'avg' | 'sum' | 'max' | 'min' | 'count' },
    onData: MetricStreamCallback,
    onError?: ErrorCallback
  ): Promise<void> {
    if (this.activeStreams.has(streamId)) {
      this.stopStream(streamId)
    }

    this.streamConfigs.set(streamId, config)

    const pollData = async () => {
      try {
        const now = Date.now()
        const from = now - config.interval

        const query = {
          size: 0,
          query: {
            bool: {
              must: [
                {
                  range: {
                    [config.timestampField]: {
                      gte: from,
                      lte: now
                    }
                  }
                },
                ...(config.filters ? [config.filters] : [])
              ]
            }
          },
          aggs: {
            metric_value: {
              [config.aggregation]: {
                field: config.metricField
              }
            }
          }
        }

        const response = await this.connection.search(config.index, query)

        if (response.aggregations?.metric_value?.value !== undefined) {
          const dataPoint: StreamedDataPoint = {
            timestamp: now,
            value: response.aggregations.metric_value.value
          }

          onData(dataPoint)
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('Stream error'))
        }
      }
    }

    await pollData()

    const intervalId = setInterval(pollData, config.interval)
    this.activeStreams.set(streamId, intervalId)
  }

  async startESQLStream(
    streamId: string,
    query: string,
    interval: number,
    onData: (result: any) => void,
    onError?: ErrorCallback
  ): Promise<void> {
    if (this.activeStreams.has(streamId)) {
      this.stopStream(streamId)
    }

    const pollData = async () => {
      try {
        const result = await this.connection.esqlQuery(query)
        onData(result)
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error : new Error('ES|QL stream error'))
        }
      }
    }

    await pollData()

    const intervalId = setInterval(pollData, interval)
    this.activeStreams.set(streamId, intervalId)
  }

  stopStream(streamId: string): void {
    const intervalId = this.activeStreams.get(streamId)
    if (intervalId) {
      clearInterval(intervalId)
      this.activeStreams.delete(streamId)
      this.streamConfigs.delete(streamId)
    }
  }

  stopAllStreams(): void {
    this.activeStreams.forEach((_, streamId) => {
      this.stopStream(streamId)
    })
  }

  isStreamActive(streamId: string): boolean {
    return this.activeStreams.has(streamId)
  }

  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys())
  }

  getStreamConfig(streamId: string): MetricStreamConfig | undefined {
    return this.streamConfigs.get(streamId)
  }
}

export function createStreamService(connection: ElasticsearchConnection): ElasticsearchStreamService {
  return new ElasticsearchStreamService(connection)
}
