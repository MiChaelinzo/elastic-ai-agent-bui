import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table as TableIcon, Clock, Database, ChartBar } from '@phosphor-icons/react'

interface QueryResultAnalyzerProps {
  data: any[]
  columns: string[]
  executionTime: number
  className?: string
}

export function QueryResultAnalyzer({ data, columns, executionTime, className }: QueryResultAnalyzerProps) {
  const analysis = useMemo(() => {
    if (data.length === 0) {
      return null
    }

    const columnTypes: Record<string, Set<string>> = {}
    const columnStats: Record<string, { nulls: number; unique: Set<any>; numeric: number[] }> = {}

    columns.forEach(col => {
      columnTypes[col] = new Set()
      columnStats[col] = { nulls: 0, unique: new Set(), numeric: [] }
    })

    data.forEach(row => {
      columns.forEach(col => {
        const value = row[col]
        
        if (value === null || value === undefined) {
          columnStats[col].nulls++
        } else {
          columnTypes[col].add(typeof value)
          columnStats[col].unique.add(JSON.stringify(value))
          
          if (typeof value === 'number') {
            columnStats[col].numeric.push(value)
          }
        }
      })
    })

    const numericColumns = columns.filter(col => columnStats[col].numeric.length > 0)
    const categoricalColumns = columns.filter(col => 
      columnStats[col].unique.size < data.length * 0.5 && 
      columnStats[col].unique.size > 1
    )

    return {
      rowCount: data.length,
      columnCount: columns.length,
      executionTime,
      columnStats,
      columnTypes,
      numericColumns,
      categoricalColumns,
      dataSize: JSON.stringify(data).length
    }
  }, [data, columns, executionTime])

  if (!analysis) {
    return null
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <TableIcon size={14} />
              Rows
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{analysis.rowCount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Database size={14} />
              Columns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{analysis.columnCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock size={14} />
              Execution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{analysis.executionTime}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <ChartBar size={14} />
              Data Size
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">
              {(analysis.dataSize / 1024).toFixed(1)}KB
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysis.numericColumns.length > 0 && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Numeric Columns</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {analysis.numericColumns.map(col => {
                  const values = analysis.columnStats[col].numeric
                  const avg = values.reduce((a, b) => a + b, 0) / values.length
                  const min = Math.min(...values)
                  const max = Math.max(...values)
                  
                  return (
                    <div key={col} className="text-xs">
                      <div className="font-mono font-semibold mb-1">{col}</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          avg: {avg.toFixed(2)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          min: {min}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          max: {max}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {analysis.categoricalColumns.length > 0 && (
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Categorical Columns</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {analysis.categoricalColumns.map(col => {
                  const uniqueCount = analysis.columnStats[col].unique.size
                  const nullCount = analysis.columnStats[col].nulls
                  
                  return (
                    <div key={col} className="text-xs">
                      <div className="font-mono font-semibold mb-1">{col}</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {uniqueCount} unique
                        </Badge>
                        {nullCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {nullCount} nulls
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
