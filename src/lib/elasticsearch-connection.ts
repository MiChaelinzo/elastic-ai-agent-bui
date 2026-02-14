export interface ElasticsearchConfig {
  host: string
  apiKey?: string
  username?: string
  password?: string
  cloudId?: string
}

export interface ElasticsearchDocument {
  _index: string
  _id: string
  _source: Record<string, any>
  _score?: number
}

export interface SearchResponse {
  hits: {
    total: { value: number; relation: string }
    hits: ElasticsearchDocument[]
  }
  aggregations?: Record<string, any>
}

export interface AggregationResponse {
  aggregations?: Record<string, any>
}

export class ElasticsearchConnection {
  private config: ElasticsearchConfig
  private baseUrl: string
  private headers: HeadersInit

  constructor(config: ElasticsearchConfig) {
    this.config = config
    this.baseUrl = this.buildBaseUrl()
    this.headers = this.buildHeaders()
  }

  private buildBaseUrl(): string {
    if (this.config.cloudId) {
      const decoded = atob(this.config.cloudId.split(':')[1])
      const [domain, uuid] = decoded.split('$')
      return `https://${uuid}.${domain}`
    }
    return this.config.host
  }

  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `ApiKey ${this.config.apiKey}`
    } else if (this.config.username && this.config.password) {
      const credentials = btoa(`${this.config.username}:${this.config.password}`)
      headers['Authorization'] = `Basic ${credentials}`
    }

    return headers
  }

  async testConnection(): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Connection failed: ${response.status} ${response.statusText}`
        }
      }

      const info = await response.json()
      return { success: true, info }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async search(index: string, query: any): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/${index}/_search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(query)
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  async esqlQuery(query: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/_query`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        query
      })
    })

    if (!response.ok) {
      throw new Error(`ES|QL query failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  async getIndices(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/_cat/indices?format=json`, {
      method: 'GET',
      headers: this.headers
    })

    if (!response.ok) {
      throw new Error(`Failed to get indices: ${response.status} ${response.statusText}`)
    }

    const indices = await response.json()
    return indices.map((idx: any) => idx.index).filter((name: string) => !name.startsWith('.'))
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getHeaders(): HeadersInit {
    return this.headers
  }
}

export function createElasticsearchConnection(config: ElasticsearchConfig): ElasticsearchConnection {
  return new ElasticsearchConnection(config)
}
