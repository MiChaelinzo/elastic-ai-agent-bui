import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChartBar, 
  ChartLine, 
  ChartPie, 
  Download, 
  MagicWand,
  Info,
  Swap,
  Palette
} from '@phosphor-icons/react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ChartType = 'bar' | 'line' | 'pie'

interface ChartConfig {
  type: ChartType
  xAxisField: string
  yAxisField: string
  groupByField?: string
  colorScheme: string
  showLegend: boolean
  showGrid: boolean
  animate: boolean
}

interface ESQLChartBuilderProps {
  data: any[]
  columns: string[]
  className?: string
}

const COLOR_SCHEMES = {
  default: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
  ocean: ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
  forest: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  sunset: ['#dc2626', '#f97316', '#fbbf24', '#fcd34d', '#fde68a'],
  purple: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
  gradient: ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'],
  monochrome: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db']
}

export function ESQLChartBuilder({ data, columns, className }: ESQLChartBuilderProps) {
  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    xAxisField: columns[0] || '',
    yAxisField: columns[1] || '',
    colorScheme: 'default',
    showLegend: true,
    showGrid: true,
    animate: true
  })

  const numericColumns = useMemo(() => {
    if (data.length === 0) return []
    
    return columns.filter(col => {
      const sampleValues = data.slice(0, 100).map(row => row[col])
      const numericCount = sampleValues.filter(val => 
        typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val))
      ).length
      return numericCount / sampleValues.length > 0.5
    })
  }, [data, columns])

  const categoricalColumns = useMemo(() => {
    return columns.filter(col => !numericColumns.includes(col))
  }, [columns, numericColumns])

  const chartData = useMemo(() => {
    if (!config.xAxisField || !config.yAxisField) return []

    const aggregated = new Map<string, number>()
    
    data.forEach(row => {
      const xValue = String(row[config.xAxisField] || 'Unknown')
      const yValue = parseFloat(row[config.yAxisField]) || 0
      
      if (aggregated.has(xValue)) {
        aggregated.set(xValue, aggregated.get(xValue)! + yValue)
      } else {
        aggregated.set(xValue, yValue)
      }
    })

    const result = Array.from(aggregated.entries()).map(([name, value]) => ({
      name,
      value,
      [config.yAxisField]: value
    }))

    if (config.type === 'pie' && result.length > 10) {
      const sorted = result.sort((a, b) => b.value - a.value)
      const top9 = sorted.slice(0, 9)
      const others = sorted.slice(9).reduce((sum, item) => sum + item.value, 0)
      return [...top9, { name: 'Others', value: others, [config.yAxisField]: others }]
    }

    return result
  }, [data, config.xAxisField, config.yAxisField, config.type])

  const handleAutoDetect = () => {
    const suggestedConfig: Partial<ChartConfig> = {}

    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      suggestedConfig.xAxisField = categoricalColumns[0]
      suggestedConfig.yAxisField = numericColumns[0]
      
      if (data.length <= 10) {
        suggestedConfig.type = 'bar'
      } else if (data.length <= 50) {
        suggestedConfig.type = 'line'
      } else {
        suggestedConfig.type = 'bar'
      }
    } else if (numericColumns.length >= 2) {
      suggestedConfig.xAxisField = columns[0]
      suggestedConfig.yAxisField = numericColumns[0]
      suggestedConfig.type = 'line'
    }

    if (Object.keys(suggestedConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...suggestedConfig }))
      toast.success('Chart configuration auto-detected', {
        description: `Using ${suggestedConfig.type} chart with ${suggestedConfig.xAxisField} vs ${suggestedConfig.yAxisField}`
      })
    } else {
      toast.warning('Unable to auto-detect chart configuration', {
        description: 'Please select fields manually'
      })
    }
  }

  const handleExportChart = () => {
    toast.success('Chart export', {
      description: 'Chart would be exported as PNG (feature requires canvas rendering)'
    })
  }

  const handleSwapAxes = () => {
    setConfig(prev => ({
      ...prev,
      xAxisField: prev.yAxisField,
      yAxisField: prev.xAxisField
    }))
    toast.success('Axes swapped')
  }

  const colors = COLOR_SCHEMES[config.colorScheme as keyof typeof COLOR_SCHEMES]

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Alert>
          <Info size={20} />
          <AlertDescription>
            No data available for visualization. Configure the chart fields to see results.
          </AlertDescription>
        </Alert>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    }

    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              {config.showLegend && <Legend />}
              <Bar 
                dataKey="value" 
                fill={colors[0]}
                animationDuration={config.animate ? 750 : 0}
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              {config.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colors[0]}
                strokeWidth={3}
                dot={{ fill: colors[0], r: 6 }}
                activeDot={{ r: 8 }}
                animationDuration={config.animate ? 750 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
                fill={colors[0]}
                dataKey="value"
                animationDuration={config.animate ? 750 : 0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px'
                }}
              />
              {config.showLegend && (
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  if (data.length === 0 || columns.length === 0) {
    return (
      <Alert className={className}>
        <Info size={20} />
        <AlertDescription>
          Execute a query to visualize results as charts
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={cn('relative', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChartBar size={24} weight="duotone" className="text-primary" />
              Visual Chart Builder
            </CardTitle>
            <CardDescription>
              Create interactive visualizations from query results
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {chartData.length} data points
            </Badge>
            <Button onClick={handleAutoDetect} variant="outline" size="sm">
              <MagicWand size={16} className="mr-2" />
              Auto-Detect
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={config.type} onValueChange={(value) => setConfig(prev => ({ ...prev, type: value as ChartType }))}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <ChartBar size={18} weight="duotone" />
              Bar Chart
            </TabsTrigger>
            <TabsTrigger value="line" className="flex items-center gap-2">
              <ChartLine size={18} weight="duotone" />
              Line Chart
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <ChartPie size={18} weight="duotone" />
              Pie Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value={config.type} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="x-axis">
                  {config.type === 'pie' ? 'Category Field' : 'X-Axis Field'}
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={config.xAxisField} 
                    onValueChange={(value) => setConfig(prev => ({ ...prev, xAxisField: value }))}
                  >
                    <SelectTrigger id="x-axis">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                          {categoricalColumns.includes(col) && (
                            <Badge variant="secondary" className="ml-2 text-xs">Categorical</Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {config.type !== 'pie' && (
                    <Button
                      onClick={handleSwapAxes}
                      variant="outline"
                      size="icon"
                      title="Swap axes"
                    >
                      <Swap size={18} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="y-axis">
                  {config.type === 'pie' ? 'Value Field' : 'Y-Axis Field'}
                </Label>
                <Select 
                  value={config.yAxisField} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, yAxisField: value }))}
                >
                  <SelectTrigger id="y-axis">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col}
                        {numericColumns.includes(col) && (
                          <Badge variant="secondary" className="ml-2 text-xs">Numeric</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color-scheme" className="flex items-center gap-2">
                  <Palette size={16} />
                  Color Scheme
                </Label>
                <Select 
                  value={config.colorScheme} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, colorScheme: value }))}
                >
                  <SelectTrigger id="color-scheme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COLOR_SCHEMES).map(scheme => (
                      <SelectItem key={scheme} value={scheme}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {COLOR_SCHEMES[scheme as keyof typeof COLOR_SCHEMES].slice(0, 3).map((color, i) => (
                              <div 
                                key={i} 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Display Options</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showLegend}
                      onChange={(e) => setConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Legend</span>
                  </label>
                  {config.type !== 'pie' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showGrid}
                        onChange={(e) => setConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Grid</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Animation</Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.animate}
                    onChange={(e) => setConfig(prev => ({ ...prev, animate: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable animations</span>
                </label>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-muted/20">
              {renderChart()}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {chartData.length > 0 && (
                  <span>
                    Visualizing {chartData.length} data points
                  </span>
                )}
              </div>
              <Button onClick={handleExportChart} variant="outline">
                <Download size={18} className="mr-2" />
                Export Chart
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
