# Real-Time Metric Streaming from Elasticsearch

## Overview

This feature adds real-time metric streaming capabilities that simulate live data ingestion from Elasticsearch, providing continuous monitoring and live correlation analysis with incidents.

## Key Features

### 1. **Live Metric Streaming Service** (`src/lib/metric-streaming.ts`)

A sophisticated streaming service that simulates real-time metric data from Elasticsearch:

- **Continuous Data Updates**: Metrics update every 2-3 seconds with realistic data patterns
- **Anomaly Detection**: Automatically detects anomalies in streaming data
- **Live Correlation Analysis**: Correlates streaming metrics with active incidents in real-time
- **Configurable Streams**: Each metric can be individually started, paused, or configured
- **Publisher-Subscriber Pattern**: Multiple components can subscribe to metric updates

#### Core Capabilities:

```typescript
// Start streaming all metrics
metricStreamingService.startStreaming(metrics, configs)

// Subscribe to specific metric updates
const unsubscribe = metricStreamingService.subscribeToMetric('cpu-usage', (update) => {
  console.log('CPU Update:', update.value, update.anomaly)
})

// Track incident for live correlation
metricStreamingService.trackIncident(incident)

// Subscribe to correlation updates
metricStreamingService.subscribeToCorrelations((update) => {
  console.log('New correlations:', update.correlations.length)
})
```

### 2. **Live Metric Stream Component** (`src/components/LiveMetricStream.tsx`)

Individual metric visualization with:

- **Real-time Sparkline Charts**: Canvas-based mini charts showing last 50 data points
- **Threshold Indicators**: Visual warning and critical threshold lines
- **Anomaly Highlighting**: Visual alerts when anomalies are detected
- **Trend Indicators**: Shows increasing, decreasing, or stable trends
- **Compact & Full Modes**: Flexible display options for different layouts

### 3. **Live Correlation Dashboard** (`src/components/LiveCorrelationDashboard.tsx`)

Comprehensive streaming dashboard with 4 tabs:

#### **Live Streams Tab**
- Grid of all active metric streams
- Individual start/pause controls for each metric
- Real-time sparklines and current values
- Anomaly highlighting and severity badges

#### **Correlations Tab**
- Live correlation analysis with selected incident
- Strongest correlations highlighted
- Multi-metric pattern detection
- Correlation update history
- Confidence scores and suggested causes

#### **Anomalies Tab**
- Real-time anomaly alerts
- Severity classification (low/medium/high/critical)
- Timestamp and value tracking
- Percentage change indicators

#### **ES Queries Tab**
- View actual Elasticsearch queries being executed
- Both standard Query API and ES|QL formats
- Query configuration details (index, interval, aggregation)

### 4. **Live Metric Widget** (`src/components/LiveMetricWidget.tsx`)

Compact widget for dashboard integration:

- Shows top 3-6 metrics in compact format
- Quick access button to full dashboard
- Streaming status indicator
- Responsive grid layout

## Elasticsearch Integration

The system generates realistic Elasticsearch queries for each metric type:

### Standard Query API Example (CPU Metrics):
```json
GET metrics-system.cpu-*/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-30s",
        "lte": "now"
      }
    }
  },
  "aggs": {
    "metric_value": {
      "avg": {
        "field": "system.cpu.total.norm.pct"
      }
    }
  }
}
```

### ES|QL Query Example:
```sql
FROM metrics-system.cpu-*
| WHERE @timestamp >= NOW() - 30s
| STATS metric_value = AVG(system.cpu.total.norm.pct)
```

## Metric Types Supported

1. **CPU Usage** (`metrics-system.cpu-*`)
   - Field: `system.cpu.total.norm.pct`
   - Thresholds: Warning 70%, Critical 90%

2. **Memory Usage** (`metrics-system.memory-*`)
   - Field: `system.memory.actual.used.pct`
   - Thresholds: Warning 80%, Critical 95%

3. **Network Throughput** (`metrics-system.network-*`)
   - Field: `system.network.in.bytes`
   - Thresholds: Warning 800 Mbps, Critical 950 Mbps

4. **Disk I/O** (`metrics-system.diskio-*`)
   - Field: `system.diskio.io.ops`
   - Thresholds: Warning 5000 IOPS, Critical 8000 IOPS

5. **API Latency** (`traces-apm-*`)
   - Field: `transaction.duration.us`
   - Thresholds: Warning 500ms, Critical 1000ms

6. **Error Rate** (`logs-apm.error-*`)
   - Field: `error.count`
   - Thresholds: Warning 10 errors/min, Critical 50 errors/min

## Live Correlation Analysis

The system continuously analyzes correlations between streaming metrics and active incidents:

### Correlation Scoring Algorithm:
1. **Deviation Score** (35%): Statistical deviation from mean (Z-score)
2. **Change Ratio** (35%): Before/after incident value change
3. **Time Proximity** (30%): How close the metric spike is to incident time

### Multi-Metric Pattern Detection:

The system recognizes complex patterns:
- **Resource Exhaustion**: CPU + Memory spikes
- **Service Degradation**: Latency + Error Rate
- **Network Bottleneck**: Network + Latency
- **I/O Bottleneck**: Disk + Latency

## Real-Time Features

### Streaming Updates:
- Metrics update every 2-3 seconds
- Correlation re-analysis every 5 seconds when anomalies detected
- Update history maintained (last 100 updates per metric)
- Anomaly counter tracks all detected anomalies

### Subscription Management:
```typescript
// Components can subscribe to specific metrics
useEffect(() => {
  const unsubscribe = metricStreamingService.subscribeToMetric(
    'cpu-usage',
    (update) => {
      setCurrentValue(update.value)
      if (update.anomaly) {
        showAlert(update)
      }
    }
  )
  return () => unsubscribe()
}, [])
```

## Performance Considerations

### Canvas Optimization:
- Uses device pixel ratio for crisp rendering
- Maintains only last 50 data points per sparkline
- Gradient fills cached per render
- Efficient redraw only on data changes

### Memory Management:
- Circular buffer limits (1000 points per metric)
- Automatic cleanup of old correlation updates
- Unsubscribe cleanup in useEffect hooks

### Stream Control:
- Individual stream pause/resume
- Global stop all streams
- Automatic cleanup on component unmount

## User Experience

### Visual Indicators:
- **Pulsing Dot**: Shows active streaming status
- **Color Coding**: Blue (normal), Yellow (warning), Orange (high), Red (critical)
- **Animations**: Smooth chart updates, slide-in transitions
- **Badges**: Clear severity and status indicators

### Responsive Design:
- Grid layouts adapt to screen size
- Compact mode for constrained spaces
- Scrollable areas for long lists
- Full-screen modal for detailed analysis

## Integration Points

### In Main Dashboard:
1. **Header Button**: "Live Streaming" button (appears when metrics exist)
2. **Live Metric Widget**: Shows top 6 metrics with quick access
3. **Full Dashboard Modal**: Comprehensive streaming interface

### With Incident Tracking:
- Automatically tracks selected incident
- Live correlation updates
- Anomaly alerts linked to incidents
- Multi-metric pattern recognition

## Future Enhancements

Potential additions for production use:

1. **Real Elasticsearch Connection**: Replace mock data with actual ES client
2. **WebSocket Support**: True real-time streaming via WebSocket
3. **Custom Metric Definitions**: User-defined metrics and queries
4. **Alert Rules**: Configure custom alert conditions
5. **Historical Playback**: Replay past metric data
6. **Export Capabilities**: Download streaming data and charts
7. **Advanced Analytics**: Machine learning on streaming data
8. **Metric Forecasting**: Predict future metric values

## Code Organization

```
src/
├── lib/
│   ├── metric-streaming.ts          # Core streaming service
│   └── external-metrics.ts           # Metric types and correlation
├── components/
│   ├── LiveMetricStream.tsx          # Individual metric display
│   ├── LiveCorrelationDashboard.tsx  # Full streaming dashboard
│   └── LiveMetricWidget.tsx          # Compact widget
└── App.tsx                           # Integration
```

## Usage Example

```typescript
import { LiveCorrelationDashboard } from '@/components/LiveCorrelationDashboard'

function App() {
  const [showLiveStreaming, setShowLiveStreaming] = useState(false)
  const [externalMetrics, setExternalMetrics] = useState<ExternalMetric[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  return (
    <>
      <Button onClick={() => setShowLiveStreaming(true)}>
        Open Live Streaming
      </Button>
      
      <LiveCorrelationDashboard
        isOpen={showLiveStreaming}
        onClose={() => setShowLiveStreaming(false)}
        incident={selectedIncident}
        metrics={externalMetrics}
      />
    </>
  )
}
```

## Technical Requirements

- React 19.x
- TypeScript 5.x
- Canvas API support
- Modern browser (Chrome, Firefox, Safari, Edge)

## Benefits

1. **Proactive Monitoring**: Catch issues before they become incidents
2. **Faster Root Cause Analysis**: See metric correlations in real-time
3. **Better Context**: Understand system state during incidents
4. **Operational Awareness**: Live view of system health
5. **Pattern Recognition**: Identify recurring metric patterns
6. **Reduced MTTR**: Faster incident resolution with live data

This feature transforms the incident response system from reactive to proactive, providing DevOps teams with the real-time insights they need to prevent and resolve issues quickly.
