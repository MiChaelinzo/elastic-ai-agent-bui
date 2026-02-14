# ES|QL Query Execution with Real Elasticsearch Integration

This document describes the ES|QL query execution feature that enables users to run ES|QL queries directly against connected Elasticsearch clusters with full syntax highlighting, validation, and result analysis.

## Overview

The ES|QL Query Console provides a professional query building experience with:
- Real-time syntax highlighting
- Query validation before execution
- Connection to real Elasticsearch clusters
- Automatic result parsing and analysis
- Query history tracking
- CSV export capabilities
- Index suggestions
- Sample queries and quick reference

## Features

### 1. Real Elasticsearch Connection

The query console integrates with the main Elasticsearch connection system to execute queries against live clusters:

```typescript
// Queries are executed via the elasticsearch connection
const response = await elasticsearch.connection.esqlQuery(query)
```

**Supported Authentication Methods:**
- API Key
- Basic Auth (username/password)
- Elastic Cloud ID

**Connection Indicators:**
- Real-time connection status badge
- Cluster name and version display
- Available indices count

### 2. ES|QL Endpoint Detection

The system automatically tries multiple ES|QL API endpoints with intelligent fallback:

```typescript
const endpoints = [
  `${baseUrl}/_query`,        // Primary ES|QL endpoint
  `${baseUrl}/_esql/query`,   // Alternative endpoint
  `${baseUrl}/_sql`,          // SQL compatibility endpoint
]
```

This ensures compatibility across different Elasticsearch versions.

### 3. Response Format Normalization

Different Elasticsearch versions return ES|QL results in various formats. The system normalizes all formats:

**Format 1: columns/values**
```json
{
  "columns": [{"name": "timestamp", "type": "date"}, {"name": "level", "type": "keyword"}],
  "values": [["2024-01-01T00:00:00Z", "error"], ["2024-01-01T00:01:00Z", "warn"]]
}
```

**Format 2: rows/columns**
```json
{
  "columns": ["timestamp", "level"],
  "rows": [["2024-01-01T00:00:00Z", "error"], ["2024-01-01T00:01:00Z", "warn"]]
}
```

**Format 3: Standard Search**
```json
{
  "hits": {
    "hits": [
      {"_id": "1", "_source": {"timestamp": "2024-01-01T00:00:00Z", "level": "error"}}
    ]
  }
}
```

All formats are converted to a consistent structure for display.

### 4. Syntax Highlighting

Real-time syntax highlighting for ES|QL queries with color-coded tokens:

- **Keywords** (blue): FROM, WHERE, LIMIT, SORT, STATS, KEEP, DROP, etc.
- **Functions** (purple): AVG, COUNT, MAX, MIN, SUM, PERCENTILE, etc.
- **Strings** (green): "log message", 'value'
- **Numbers** (cyan): 100, 42.5, 3.14
- **Operators** (orange): ==, !=, >, <, +, -, *, /
- **Pipe** (accent): |

### 5. Query Validation

Pre-execution validation catches common errors:

- Empty queries
- Missing FROM or ROW command
- Mismatched parentheses
- Unclosed quotes
- Invalid pipe operators

### 6. Query Result Analyzer

Automatic statistical analysis of query results:

**Numeric Columns:**
- Average value
- Minimum value
- Maximum value

**Categorical Columns:**
- Unique value count
- Null count

**Overall Statistics:**
- Total row count
- Column count
- Execution time
- Data size in KB

### 7. Index Suggestions

When connected to Elasticsearch, the console displays available indices grouped by prefix:

```
logs-*
  logs-application
  logs-system
  logs-network
  
metrics-*
  metrics-cpu
  metrics-memory
  metrics-disk
```

Clicking an index inserts it into the query, replacing the FROM clause intelligently.

### 8. Query History

All executed queries are saved with metadata:

```typescript
interface ESQLQueryHistoryItem {
  id: string
  query: string
  timestamp: number
  executionTime?: number
  rowCount?: number
  success: boolean
  error?: string
}
```

History features:
- Persistent storage (max 100 queries)
- Search through past queries
- Filter by success/failure
- Click to reload query
- Copy to clipboard
- Delete individual entries
- Clear all history

### 9. Sample Queries

Pre-built query templates for common use cases:

1. **Basic log search** - Search logs with filters
2. **Aggregation by status** - Count events by status code
3. **Error rate analysis** - Calculate error percentage
4. **Top users by requests** - Find most active users
5. **Performance metrics** - Analyze response times
6. **Network traffic analysis** - Analyze network data by destination

### 10. CSV Export

Export query results to CSV format with proper escaping:

```csv
@timestamp,level,message,service
2024-01-01T00:00:00Z,error,"Error message, with comma",api-service
2024-01-01T00:01:00Z,warn,"Warning message",web-service
```

Features:
- Automatic header row
- Comma escaping
- Quote escaping (doubled quotes)
- Null value handling
- Timestamp: `esql-results-{timestamp}.csv`

## Usage Examples

### Basic Query

```esql
FROM logs-*
| WHERE @timestamp >= NOW() - 1 hour
| KEEP @timestamp, message, level
| LIMIT 100
```

### Aggregation Query

```esql
FROM logs-*
| STATS count = COUNT(*) BY status_code
| SORT count DESC
```

### Complex Analysis

```esql
FROM logs-*
| WHERE @timestamp >= NOW() - 1 hour
| STATS 
    total = COUNT(*), 
    errors = COUNT(*) WHERE level == "error"
| EVAL error_rate = errors / total * 100
```

### Performance Metrics

```esql
FROM logs-*
| WHERE @timestamp >= NOW() - 1 hour
| STATS 
    avg_duration = AVG(duration), 
    p95 = PERCENTILE(duration, 95), 
    p99 = PERCENTILE(duration, 99)
| EVAL avg_duration_ms = ROUND(avg_duration)
```

## Error Handling

The system provides detailed error messages for common issues:

### Connection Errors

```
Network error connecting to https://localhost:9200/_query. 
Check CORS settings.
```

### Syntax Errors

```
ES|QL query failed: line 2:3: Unknown column [nonexistent_field]
```

### Missing Index

```
no such index [logs-missing]
```

### Authentication Errors

```
Connection failed: 401 Unauthorized
```

## Integration with Incident Response

ES|QL queries can be used to:

1. **Detect Incidents** - Query logs for error patterns
2. **Analyze Root Cause** - Aggregate metrics around incident time
3. **Verify Resolution** - Confirm error rates decreased
4. **Generate Reports** - Export incident data for analysis

## Performance Considerations

- Large result sets are limited in UI display but fully exportable via CSV
- Query execution time is tracked and displayed
- Failed queries don't impact UI performance
- History limited to 100 queries to prevent storage issues

## Security

- All authentication credentials stored securely
- API keys never logged or exposed in UI
- HTTPS enforced for Elastic Cloud connections
- CORS must be configured on Elasticsearch for browser access

## Future Enhancements

- Query autocomplete with field suggestions
- Visual query builder (drag-and-drop)
- Query result visualization (charts/graphs)
- Saved query templates
- Query scheduling and alerts
- Multi-query execution
- Query performance profiling
- Result pagination for large datasets

## Technical Implementation

### Connection Management

```typescript
class ElasticsearchConnection {
  async esqlQuery(query: string, format: 'json' | 'csv' | 'txt' = 'json'): Promise<any> {
    // Try multiple endpoints
    // Normalize response format
    // Handle errors gracefully
  }
}
```

### Response Parsing

```typescript
function parseESQLResponse(response: any): { data: any[]; columns: string[] } {
  // Handle columns/values format
  // Handle rows/columns format
  // Handle standard search format
  // Return normalized structure
}
```

### Query Execution Flow

1. User types query in editor
2. Real-time syntax highlighting applied
3. Query validated before execution
4. On Cmd/Ctrl+Enter or Execute button:
   - Check Elasticsearch connection
   - Send query to ES|QL endpoint
   - Parse response format
   - Display results in table
   - Run result analyzer
   - Save to history
   - Show success/error toast

## Troubleshooting

### Query Not Executing

- Verify Elasticsearch connection is active (green badge)
- Check console for network errors
- Ensure CORS configured on Elasticsearch
- Validate query syntax

### No Results Returned

- Check query time range
- Verify index exists
- Confirm field names are correct
- Review WHERE clause filters

### Connection Issues

- Verify Elasticsearch URL
- Check authentication credentials
- Ensure network access to Elasticsearch
- Confirm CORS headers allow browser requests

### Slow Queries

- Add time range filters
- Use LIMIT clause
- Avoid SELECT * on large indices
- Consider aggregations instead of full results

## Resources

- [ES|QL Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/esql.html)
- [ES|QL Functions](https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-functions-operators.html)
- [ES|QL Commands](https://www.elastic.co/guide/en/elasticsearch/reference/current/esql-commands.html)
