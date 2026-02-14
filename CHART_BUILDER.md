# ES|QL Visual Chart Builder

## Overview

The ES|QL Visual Chart Builder transforms query results into interactive, professional-quality visualizations with just a few clicks. This feature eliminates the need for external charting tools and makes data insights immediately accessible.

## Features

### Chart Types

**Bar Chart**
- Perfect for comparing categorical data
- Supports multiple color schemes
- Customizable grid lines and legends
- Rounded corners for modern appearance
- Animated transitions (optional)
- Ideal for: Status distributions, severity counts, resource usage by category

**Line Chart**
- Best for time-series and trend analysis
- Smooth monotone curves
- Interactive hover tooltips
- Animated line drawing (optional)
- Active data point highlighting
- Ideal for: Performance metrics over time, incident trends, throughput analysis

**Pie Chart**
- Visualizes proportional data
- Percentage labels for each segment
- Automatic "Others" grouping for top-N (top 9 items displayed)
- Color-coded segments
- Optional legend positioning
- Ideal for: Severity distribution, status breakdown, resource allocation

### Auto-Detection

The chart builder includes intelligent auto-detection that:
- Identifies numeric vs categorical columns
- Suggests optimal chart type based on data shape
- Recommends appropriate field mappings
- Provides instant visualization setup with one click

**Auto-Detection Logic:**
- Analyzes first 100 rows to determine column types
- Numeric columns: >50% of values are valid numbers
- Categorical columns: All non-numeric columns
- Chart type suggestions:
  - ≤10 rows: Bar chart (easy comparison)
  - ≤50 rows: Line chart (trend visibility)
  - >50 rows: Bar chart with aggregation

### Field Configuration

**X-Axis / Category Field**
- Select from any available column
- Automatic categorical field detection
- Badge indicators show field types
- Quick axis swap button
- Used for grouping and categorization

**Y-Axis / Value Field**
- Select from numeric columns
- Automatic aggregation by X-axis values
- Badge indicators show numeric columns
- Smart data summation for duplicates
- Used for measurements and counts

### Color Schemes

Seven professionally designed color palettes:

1. **Default** - Professional blue tones
   - `#2563eb → #dbeafe`
   - Best for: General purpose, business reports

2. **Ocean** - Cool cyan and teal
   - `#0891b2 → #a5f3fc`
   - Best for: Water/network metrics, calm visualizations

3. **Forest** - Natural green spectrum
   - `#059669 → #a7f3d0`
   - Best for: Growth metrics, success rates, environmental data

4. **Sunset** - Warm red to yellow
   - `#dc2626 → #fde68a`
   - Best for: Alert data, temperature metrics, warnings

5. **Purple** - Vibrant purple range
   - `#7c3aed → #ddd6fe`
   - Best for: Premium features, distinctive charts

6. **Gradient** - Rainbow spectrum
   - `#6366f1 → #f43f5e`
   - Best for: Multi-category data, presentations

7. **Monochrome** - Grayscale tones
   - `#1f2937 → #d1d5db`
   - Best for: Print-ready charts, minimal design

Each scheme includes 5 colors that cycle through data points, ensuring visual distinction even with many categories.

### Display Options

**Legend**
- Toggle on/off
- Shows data labels and colors
- Vertical layout for pie charts
- Horizontal layout for bar/line charts

**Grid Lines** (Bar & Line charts only)
- Toggle cartesian grid
- Dashed line style
- 30% opacity for subtlety
- Helps with value estimation

**Animations**
- Enable/disable transitions
- 750ms smooth animations
- Entrance animations on load
- Smooth transitions on config changes

### Data Aggregation

The chart builder intelligently aggregates data:

**Automatic Grouping**
- Groups rows by X-axis field
- Sums Y-axis values for each group
- Handles duplicate categories gracefully

**Top-N Filtering (Pie Charts)**
- Limits display to top 9 items
- Groups remaining items as "Others"
- Sorts by value (largest first)
- Prevents overcrowded pie charts

**Example:**
```
Query results: 50 different statuses with incident counts
Chart display: Top 9 statuses individually + "Others" (sum of remaining 41)
```

### Export Capabilities

**Chart Export**
- Export as PNG image (via canvas rendering)
- Maintains current configuration
- Full resolution output
- Ready for reports and presentations

**Data Export**
- Export underlying data as CSV
- Includes all query result columns
- Proper escaping for special characters
- Compatible with Excel and data tools

## Usage Guide

### Quick Start

1. **Execute a Query**
   ```
   FROM logs-*
   | STATS count = COUNT(*) BY status
   | LIMIT 100
   ```

2. **Switch to Chart View**
   - Click "Chart" tab in query results
   - Results automatically appear in chart builder

3. **Auto-Detect Configuration**
   - Click "Auto-Detect" button
   - System suggests optimal chart type and fields
   - Preview appears instantly

4. **Customize (Optional)**
   - Change chart type (Bar/Line/Pie)
   - Select different fields
   - Choose color scheme
   - Toggle display options

5. **Export**
   - Click "Export Chart" for PNG image
   - Click "Export CSV" for raw data

### Advanced Configuration

**Manual Field Selection**
```
1. Choose chart type first (determines available options)
2. Select X-axis field (categorical data)
3. Select Y-axis field (numeric data)
4. Adjust color scheme to match your brand
5. Fine-tune display options (legend, grid, animations)
```

**Field Type Indicators**
- Numeric columns show "Numeric" badge
- Categorical columns show "Categorical" badge
- Helps with appropriate field selection

**Axis Swapping**
- Click swap button to reverse X and Y axes
- Useful for horizontal bar charts
- Changes perspective on data

## Examples

### Example 1: Incident Status Distribution

**Query:**
```sql
FROM incidents-*
| STATS total = COUNT(*) BY status
| SORT total DESC
```

**Chart Configuration:**
- Type: Bar Chart
- X-Axis: status
- Y-Axis: total
- Color Scheme: Forest (green for success emphasis)
- Display: Legend on, Grid on

**Result:** Clear comparison of incident volumes by status

### Example 2: Performance Metrics Over Time

**Query:**
```sql
FROM metrics-*
| WHERE @timestamp >= NOW() - 24 hours
| STATS avg_latency = AVG(latency_ms) BY hour = DATE_TRUNC(1 hour, @timestamp)
| SORT hour ASC
```

**Chart Configuration:**
- Type: Line Chart
- X-Axis: hour
- Y-Axis: avg_latency
- Color Scheme: Default (professional blue)
- Display: Grid on, Animations on

**Result:** Smooth trend line showing latency patterns throughout the day

### Example 3: Error Distribution by Severity

**Query:**
```sql
FROM errors-*
| STATS error_count = COUNT(*) BY severity
```

**Chart Configuration:**
- Type: Pie Chart
- Category: severity
- Value: error_count
- Color Scheme: Sunset (warm colors for severity)
- Display: Legend on (right side)

**Result:** Clear proportional view of error severity distribution

## Technical Details

### Data Processing

**Numeric Column Detection:**
```typescript
// Samples first 100 rows
// Counts valid numeric values
// Column is numeric if >50% values are numbers
numericCount / totalSamples > 0.5
```

**Aggregation Algorithm:**
```typescript
// Groups data by X-axis field
// Sums Y-axis values for each unique X value
// Returns array of { name, value } objects
Map<xValue, sum(yValues)>
```

**Pie Chart Optimization:**
```typescript
// Sorts by value (descending)
// Takes top 9 items
// Sums remaining items as "Others"
// Prevents visual clutter
```

### Chart Components

Built with **Recharts** library:
- `BarChart` - Column/bar visualizations
- `LineChart` - Line and area charts  
- `PieChart` - Pie and donut charts
- `ResponsiveContainer` - Automatic sizing
- `CartesianGrid` - Grid lines
- `XAxis / YAxis` - Axis components
- `Tooltip` - Hover interactions
- `Legend` - Data labels

### Performance Optimization

- Lazy rendering (only active tab)
- Memoized data transformations
- Efficient re-aggregation on config changes
- Debounced updates for smooth UX
- Canvas-based rendering for large datasets

## Best Practices

### Choosing Chart Types

**Use Bar Charts when:**
- Comparing discrete categories
- Showing counts or totals
- Data has clear groupings
- Order matters but not continuity

**Use Line Charts when:**
- Showing trends over time
- Data is continuous
- Emphasizing direction of change
- Multiple time periods

**Use Pie Charts when:**
- Showing parts of a whole
- Percentages are important
- 3-10 categories maximum
- Proportions matter more than exact values

### Color Scheme Selection

**Default/Ocean/Forest** - Safe, professional choices
**Sunset** - Use for warnings, alerts, critical data
**Purple** - Premium features, special metrics
**Gradient** - Presentations, multi-category emphasis
**Monochrome** - Print reports, formal documents

### Field Selection Tips

1. **X-Axis should be:**
   - Categorical or discrete
   - Have reasonable cardinality (not too many unique values)
   - Meaningful grouping field

2. **Y-Axis should be:**
   - Numeric
   - Represent measurement or count
   - Have meaningful aggregation (sum works for most cases)

3. **Avoid:**
   - Too many categories (>20) for bar/pie charts
   - Using numeric IDs as categories
   - Non-aggregatable Y-axis fields

## Integration

### In ES|QL Console

The chart builder is seamlessly integrated into the ES|QL Console:

1. Query Builder → Execute query
2. Query Results → Toggle between Table/Chart view
3. Chart view automatically loads with results
4. Configuration persists during session
5. Switch back to table view anytime

### With Query History

Charts can be regenerated from history:

1. Query History → Select past query
2. Query loads in builder
3. Execute to get results
4. Switch to Chart view
5. Previous chart config is retained (if available)

## Troubleshooting

**No data shown in chart:**
- Verify query returned results
- Check that X and Y axis fields are selected
- Ensure Y-axis field contains numeric data

**Chart looks cluttered:**
- Try different chart type
- Reduce number of categories (use LIMIT or TOP)
- For pie charts, auto-grouping creates "Others" category

**Colors don't match brand:**
- Choose different color scheme
- 7 schemes available covering most needs

**Animations feel slow:**
- Disable animations in display options
- Improves performance on slower devices

**Can't see all labels:**
- Bar/Line charts rotate X-axis labels 45°
- Resize window for more space
- Consider reducing categories with LIMIT clause

## Future Enhancements

Potential additions for future versions:

- **More Chart Types**: Area charts, scatter plots, heatmaps
- **Custom Color Palettes**: User-defined color schemes
- **Advanced Aggregations**: Count distinct, percentiles, stddev
- **Chart Combinations**: Multiple Y-axes, combo charts
- **Interactive Filtering**: Click chart elements to filter
- **Saved Chart Configs**: Reuse chart setups
- **Dashboard Integration**: Pin charts to main dashboard
- **Real-time Updates**: Live-updating charts from streams
- **Export Formats**: PDF, SVG, PowerPoint
- **Chart Templates**: Pre-configured chart types for common queries

## Summary

The ES|QL Visual Chart Builder makes data visualization effortless:

✅ **Instant Visualizations** - One click from query to chart
✅ **Professional Quality** - Publication-ready charts
✅ **Zero Configuration** - Auto-detect handles the basics
✅ **Highly Customizable** - Fine-tune every aspect
✅ **Export Ready** - Share charts and data easily
✅ **No External Tools** - Everything in one place
✅ **Responsive Design** - Works on all screen sizes
✅ **Type-Aware** - Understands your data structure

Transform your ES|QL queries into compelling visual stories. Start exploring your data with charts today!
