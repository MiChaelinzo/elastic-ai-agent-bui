# Example Elasticsearch Stream Configurations

This file contains example stream configurations for common monitoring scenarios. Copy and adapt these for your Elasticsearch setup.

## System Monitoring

### CPU Usage
```json
{
  "name": "CPU Usage",
  "index": "metrics-system.cpu-*",
  "metricField": "system.cpu.total.norm.pct",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 5000
}
```

### Memory Usage
```json
{
  "name": "Memory Usage",
  "index": "metrics-system.memory-*",
  "metricField": "system.memory.used.pct",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 5000
}
```

### Disk I/O
```json
{
  "name": "Disk Write IOPS",
  "index": "metrics-system.diskio-*",
  "metricField": "system.diskio.write.count",
  "timestampField": "@timestamp",
  "aggregation": "sum",
  "interval": 10000
}
```

### Network Throughput
```json
{
  "name": "Network In (bytes/sec)",
  "index": "metrics-system.network-*",
  "metricField": "system.network.in.bytes",
  "timestampField": "@timestamp",
  "aggregation": "sum",
  "interval": 5000
}
```

## Application Monitoring

### HTTP Request Rate
```json
{
  "name": "HTTP Requests/sec",
  "index": "logs-apm.app.*",
  "metricField": "transaction.duration.us",
  "timestampField": "@timestamp",
  "aggregation": "count",
  "interval": 3000
}
```

### API Response Time
```json
{
  "name": "API Latency (avg)",
  "index": "logs-apm.app.*",
  "metricField": "transaction.duration.us",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 5000
}
```

### Error Rate
```json
{
  "name": "Error Count",
  "index": "logs-apm.error-*",
  "metricField": "error.id",
  "timestampField": "@timestamp",
  "aggregation": "count",
  "interval": 5000
}
```

## Database Monitoring

### Query Latency
```json
{
  "name": "DB Query Time (ms)",
  "index": "logs-mysql.slowlog-*",
  "metricField": "mysql.slowlog.query_time.sec",
  "timestampField": "@timestamp",
  "aggregation": "max",
  "interval": 10000
}
```

### Connection Count
```json
{
  "name": "DB Active Connections",
  "index": "metrics-mysql.status-*",
  "metricField": "mysql.status.threads.connected",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 10000
}
```

## Kubernetes Monitoring

### Pod CPU
```json
{
  "name": "Pod CPU Usage",
  "index": "metrics-kubernetes.pod-*",
  "metricField": "kubernetes.pod.cpu.usage.nanocores",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 5000
}
```

### Pod Memory
```json
{
  "name": "Pod Memory Usage",
  "index": "metrics-kubernetes.pod-*",
  "metricField": "kubernetes.pod.memory.usage.bytes",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 5000
}
```

### Container Restarts
```json
{
  "name": "Container Restarts",
  "index": "metrics-kubernetes.state_container-*",
  "metricField": "kubernetes.container.restarts",
  "timestampField": "@timestamp",
  "aggregation": "sum",
  "interval": 30000
}
```

## Cloud Provider Metrics

### AWS EC2 CPU
```json
{
  "name": "EC2 CPU Utilization",
  "index": "metrics-aws.ec2_metrics-*",
  "metricField": "aws.ec2.cpu.total.pct",
  "timestampField": "@timestamp",
  "aggregation": "avg",
  "interval": 60000
}
```

### AWS RDS Connections
```json
{
  "name": "RDS Database Connections",
  "index": "metrics-aws.rds-*",
  "metricField": "aws.rds.database_connections",
  "timestampField": "@timestamp",
  "aggregation": "max",
  "interval": 60000
}
```

## Usage Tips

1. **Adjust Intervals**: Use longer intervals (10-30s) for slower-changing metrics like disk space
2. **Use Aggregations**: For high-volume data, aggregations reduce query load
3. **Index Patterns**: Use specific patterns to limit query scope (faster queries)
4. **Field Names**: Verify exact field names in your Elasticsearch indices
5. **Timestamp Field**: Most Elastic integrations use `@timestamp`, but verify your setup

## Testing Streams

Before creating production streams:

1. Test your queries in Kibana Dev Tools first
2. Start with longer intervals (30s+) to test behavior
3. Monitor your Elasticsearch cluster load
4. Gradually decrease intervals as needed
5. Use aggregations for high-cardinality data

## Common Field Names by Integration

### Elastic Agent System Integration
- CPU: `system.cpu.total.norm.pct`
- Memory: `system.memory.used.pct`
- Disk: `system.diskio.write.count`
- Network: `system.network.in.bytes`

### Elastic APM
- Duration: `transaction.duration.us`
- Status: `http.response.status_code`
- Error: `error.id`

### MySQL Integration
- Query Time: `mysql.slowlog.query_time.sec`
- Connections: `mysql.status.threads.connected`

### Kubernetes Integration
- CPU: `kubernetes.pod.cpu.usage.nanocores`
- Memory: `kubernetes.pod.memory.usage.bytes`
- Restarts: `kubernetes.container.restarts`

Refer to [Elastic Integrations documentation](https://www.elastic.co/guide/en/integrations/) for complete field reference.
