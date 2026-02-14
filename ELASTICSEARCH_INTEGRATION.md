# Elasticsearch Production Integration

## Overview

The Elastic Agent Orchestrator now includes full production integration with Elasticsearch, enabling real-time data streaming from your infrastructure monitoring setup. This feature transforms the application from using mock data to working with actual production metrics from your Elasticsearch cluster.

## Features

### 🔌 Flexible Authentication
Connect to Elasticsearch using multiple authentication methods:
- **API Key Authentication**: Recommended for production use with fine-grained access control
- **Username/Password (Basic Auth)**: Simple authentication for development/testing
- **Elastic Cloud ID**: Seamless connection to Elastic Cloud deployments

### 📊 Real-Time Data Streams
Configure unlimited metric streams from any Elasticsearch index:
- Auto-discover available indices from your cluster
- Support for custom index patterns (e.g., `metrics-*`, `logs-system-*`)
- Configurable update intervals (1-60 seconds)
- Multiple aggregation types: Average, Sum, Maximum, Minimum, Count
- Custom field mapping for metrics and timestamps

### 🎯 Production Integration
- Persistent connections across browser sessions
- Automatic reconnection on connection loss
- Graceful error handling with user-friendly messages
- Stream health monitoring with last update timestamps
- Bulk stream management (start/stop/delete multiple streams)

## Getting Started

### 1. Open Elasticsearch Dashboard

Click the **"Elasticsearch"** button in the header to open the integration dashboard.

### 2. Configure Connection

#### Option A: API Key (Recommended)
```
Host: https://your-cluster.example.com:9200
API Key: Your_Base64_Encoded_API_Key
```

#### Option B: Username/Password
```
Host: https://your-cluster.example.com:9200
Username: elastic
Password: your_password
```

#### Option C: Elastic Cloud
```
Cloud ID: cluster-name:base64EncodedCloudId
API Key: Your_Cloud_API_Key
```

### 3. Test Connection

Click **"Connect to Elasticsearch"**. Upon successful connection, you'll see:
- ✅ Connection status badge
- Cluster name and version
- Available indices list

### 4. Create Data Streams

Navigate to the **"Data Streams"** tab:

1. Click **"Add Stream"**
2. Configure your stream:
   ```
   Stream Name: CPU Usage
   Index Pattern: metrics-system-*
   Metric Field: system.cpu.percent
   Timestamp Field: @timestamp
   Aggregation: Average
   Update Interval: 5000ms
   ```
3. Click **"Add Stream"**
4. Click the ▶️ play button to start streaming

## Example Configurations

### System Metrics

#### CPU Usage Stream
```yaml
Name: CPU Usage
Index: metrics-system-*
Field: system.cpu.percent
Timestamp: @timestamp
Aggregation: avg
Interval: 5000ms
```

#### Memory Usage Stream
```yaml
Name: Memory Usage
Index: metrics-system-*
Field: system.memory.used.pct
Timestamp: @timestamp
Aggregation: avg
Interval: 5000ms
```

#### Network Throughput Stream
```yaml
Name: Network In
Index: metrics-system-*
Field: system.network.in.bytes
Timestamp: @timestamp
Aggregation: sum
Interval: 10000ms
```

### Application Metrics

#### API Latency Stream
```yaml
Name: API Response Time
Index: logs-api-*
Field: http.response.time
Timestamp: @timestamp
Aggregation: avg
Interval: 3000ms
```

#### Error Rate Stream
```yaml
Name: Error Count
Index: logs-api-*
Field: http.response.status_code
Timestamp: @timestamp
Aggregation: count
Interval: 5000ms
Filter: { "term": { "http.response.status_code": 500 } }
```

### Database Metrics

#### Query Performance Stream
```yaml
Name: DB Query Time
Index: logs-database-*
Field: database.query.duration
Timestamp: @timestamp
Aggregation: max
Interval: 10000ms
```

## Integration with Existing Features

### Incident Correlation
Real-time streams automatically integrate with the incident correlation engine:
- Streaming metrics are analyzed for correlation with active incidents
- Strong correlations (≥50%) trigger alerts
- Multi-metric pattern detection identifies complex issues

### Anomaly Detection
Streamed data feeds into the ML-powered anomaly detection system:
- Real-time anomaly detection on streaming metrics
- Configurable sensitivity thresholds
- Multiple detection algorithms (Z-Score, IQR, MAD, Isolation Forest)

### Predictive Analytics
Historical streaming data enhances predictive insights:
- Pattern recognition across time series
- Trend analysis and forecasting
- Proactive incident prevention

## Architecture

### Connection Layer
```typescript
ElasticsearchConnection
├── Authentication (API Key, Basic, Cloud ID)
├── Connection Testing
├── Index Discovery
└── Query Execution (Search API, ES|QL)
```

### Streaming Layer
```typescript
ElasticsearchStreamService
├── Metric Streams (latest value queries)
├── Aggregated Streams (avg/sum/max/min/count)
├── ES|QL Streams (advanced queries)
└── Stream Lifecycle Management
```

### React Integration
```typescript
useElasticsearch Hook
├── Connection State Management
├── Stream Configuration Persistence (KV storage)
├── Real-time Data Callbacks
└── Error Handling & Reconnection
```

## API Reference

### useElasticsearch Hook

```typescript
const {
  connection,          // ElasticsearchConnection instance
  streamService,       // ElasticsearchStreamService instance
  isConnected,         // boolean
  connectionInfo,      // cluster info object
  config,              // stored config
  availableIndices,    // string[]
  streams,             // StreamDefinition[]
  connect,             // (config: ElasticsearchConfig) => Promise<void>
  disconnect,          // () => void
  addStream,           // (stream) => void
  removeStream,        // (id: string) => void
  startStream,         // (id: string) => void
  stopStream,          // (id: string) => void
  onStreamData         // (streamId, callback) => void
} = useElasticsearch()
```

### StreamDefinition Interface

```typescript
interface StreamDefinition {
  id: string
  name: string
  index: string
  metricField: string
  timestampField: string
  interval: number
  aggregation?: 'avg' | 'sum' | 'max' | 'min' | 'count'
  filters?: Record<string, any>
  isActive: boolean
  lastValue?: number
  lastUpdate?: number
  error?: string
}
```

## Security Best Practices

### Production Deployments

1. **Use API Keys**: Never use username/password in production
   ```bash
   # Create a restricted API key
   POST /_security/api_key
   {
     "name": "agent-orchestrator-key",
     "role_descriptors": {
       "metrics-reader": {
         "cluster": [],
         "index": [
           {
             "names": ["metrics-*", "logs-*"],
             "privileges": ["read"]
           }
         ]
       }
     }
   }
   ```

2. **Restrict Index Access**: Limit API key to only necessary indices
3. **Enable TLS**: Always use HTTPS connections
4. **Rotate Keys**: Regularly rotate API keys
5. **Monitor Access**: Track API key usage in Elasticsearch security logs

### Development/Testing

- Use separate credentials for dev/test environments
- Never commit credentials to version control
- Use environment variables or secure vaults for credential storage

## Troubleshooting

### Connection Fails

**Problem**: "Connection failed: 401 Unauthorized"
- **Solution**: Verify API key or credentials are correct

**Problem**: "Connection failed: CORS error"
- **Solution**: Configure CORS headers in Elasticsearch:
  ```yaml
  http.cors.enabled: true
  http.cors.allow-origin: "https://your-app-domain.com"
  ```

**Problem**: "Connection failed: Network error"
- **Solution**: Check firewall rules and ensure cluster is reachable

### Stream Errors

**Problem**: "Field not found in index"
- **Solution**: Verify field name matches exactly (case-sensitive)
- **Solution**: Check field mapping in index template

**Problem**: "No data returned"
- **Solution**: Verify timestamp range includes recent data
- **Solution**: Check if index has any documents

**Problem**: Stream shows stale data
- **Solution**: Increase update interval if cluster is under load
- **Solution**: Check if new data is being indexed

## Performance Considerations

### Optimal Stream Configuration

- **Update Interval**: 5-10 seconds for most metrics
- **Concurrent Streams**: Limit to 10-15 active streams
- **Query Complexity**: Use simple aggregations for better performance
- **Index Patterns**: Be specific to reduce query scope

### Cluster Impact

Each stream creates periodic queries to Elasticsearch:
- 5-second interval = 12 queries/minute = 720 queries/hour
- 10 streams = 7,200 queries/hour

Monitor cluster load and adjust intervals accordingly.

## Future Enhancements

- ✨ ES|QL query interface for advanced users
- ✨ Custom query DSL filters in UI
- ✨ Stream templates for common use cases
- ✨ Real-time alerting based on stream thresholds
- ✨ Historical playback of streaming data
- ✨ Multi-cluster support
- ✨ Automatic index pattern detection
- ✨ Field autocomplete from index mappings

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Elasticsearch cluster logs
3. Check browser console for detailed error messages
4. Verify network connectivity to Elasticsearch

## Resources

- [Elasticsearch REST API Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html)
- [Elastic Cloud Getting Started](https://www.elastic.co/guide/en/cloud/current/ec-getting-started.html)
- [API Key Authentication](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-create-api-key.html)
- [ES|QL Query Language](https://www.elastic.co/guide/en/elasticsearch/reference/current/esql.html)
