import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code, Table as TableIcon, ChartBar, Download, Check, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ESQLQueryBuilder } from '@/components/ESQLQueryBuilder'
import { ESQLQueryHistory } from '@/components/ESQLQueryHistory'
import { IndexSuggestionBox } from '@/components/IndexSuggestionBox'
import { QueryResultAnalyzer } from '@/components/QueryResultAnalyzer'
import { ESQLChartBuilder } from '@/components/ESQLChartBuilder'
import { saveQueryToHistory, type ESQLQueryHistoryItem } from '@/lib/esql-utils'
import { useElasticsearch } from '@/hooks/use-elasticsearch'
import type { ElasticsearchConnection } from '@/lib/elasticsearch-connection'

interface ESQLDashboardProps {
  isOpen: boolean
  onClose: () => void
  elasticsearch: ReturnType<typeof useElasticsearch>
}

interface QueryResult {
  success: boolean
  executionTime?: number
  rowCount?: number
  error?: string
  data?: any[]
  columns?: string[]
}

function parseESQLResponse(response: any): { data: any[]; columns: string[] } {
  if (!response) {
    return { data: [], columns: [] }
  }

  if (response.columns && response.values) {
    const columns = response.columns.map((col: any) => col.name || col)
    const data = response.values.map((row: any[]) => {
      const obj: any = {}
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i]
      })
      return obj
    })
    return { data, columns }
  }

  if (response.rows && response.columns) {
    const columns = response.columns.map((col: any) => col.name || col)
    const data = response.rows.map((row: any) => {
      if (Array.isArray(row)) {
        const obj: any = {}
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i]
        })
        return obj
      }
      return row
    })
    return { data, columns }
  }

  if (Array.isArray(response)) {
    const columns = response.length > 0 ? Object.keys(response[0]) : []
    return { data: response, columns }
  }

  if (response.hits?.hits) {
    const data = response.hits.hits.map((hit: any) => ({
      _id: hit._id,
      _index: hit._index,
      ...hit._source
    }))
    const columns = data.length > 0 ? Object.keys(data[0]) : []
    return { data, columns }
  }

  return { data: [], columns: [] }
}

export function ESQLDashboard({ isOpen, onClose, elasticsearch }: ESQLDashboardProps) {
  const [queryHistory, setQueryHistory] = useKV<ESQLQueryHistoryItem[]>('esql-query-history', [])
  const [currentQuery, setCurrentQuery] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder')
  const [resultView, setResultView] = useState<'table' | 'chart'>('table')

  const executeQuery = async (query: string): Promise<QueryResult> => {
    if (!elasticsearch.isConnected || !elasticsearch.connection) {
      const result = {
        success: false,
        error: 'Not connected to Elasticsearch. Please configure connection in settings.'
      }
      
      const historyItem = saveQueryToHistory(query, result)
      setQueryHistory(current => [historyItem, ...(current || [])])
      setQueryResult(result)
      
      return result
    }

    const startTime = Date.now()
    
    try {
      const response = await elasticsearch.connection.esqlQuery(query)
      const executionTime = Date.now() - startTime
      
      const { data, columns } = parseESQLResponse(response)
      
      const result: QueryResult = {
        success: true,
        executionTime,
        rowCount: data.length,
        data,
        columns
      }

      const historyItem = saveQueryToHistory(query, {
        success: result.success,
        executionTime: result.executionTime,
        rowCount: result.rowCount
      })
      
      setQueryHistory(current => [historyItem, ...(current || [])].slice(0, 100))
      setQueryResult(result)
      
      toast.success('Query executed successfully', {
        description: `${data.length} rows returned in ${executionTime}ms`
      })
      
      return result
    } catch (error) {
      const result: QueryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }

      const historyItem = saveQueryToHistory(query, result)
      setQueryHistory(current => [historyItem, ...(current || [])])
      setQueryResult(result)
      
      toast.error('Query execution failed', {
        description: result.error
      })
      
      return result
    }
  }

  const handleClearHistory = () => {
    setQueryHistory([])
  }

  const handleDeleteHistoryItem = (id: string) => {
    setQueryHistory(current => (current || []).filter(item => item.id !== id))
  }

  const handleSelectQuery = (query: string) => {
    setCurrentQuery(query)
    setActiveTab('builder')
  }

  const handleSelectIndex = (index: string) => {
    const newQuery = currentQuery.trim() 
      ? currentQuery.replace(/FROM\s+\S+/i, `FROM ${index}`)
      : `FROM ${index}\n| LIMIT 100`
    setCurrentQuery(newQuery)
    toast.success('Index inserted into query')
  }

  const handleExportResults = () => {
    if (!queryResult?.data || queryResult.data.length === 0) {
      toast.error('No data to export')
      return
    }

    const csv = convertToCSV(queryResult.data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `esql-results-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Results exported to CSV')
  }

  const statistics = useMemo(() => {
    const history = queryHistory || []
    return {
      total: history.length,
      successful: history.filter(q => q.success).length,
      failed: history.filter(q => !q.success).length,
      avgExecutionTime: history.filter(q => q.success && q.executionTime)
        .reduce((sum, q) => sum + (q.executionTime || 0), 0) / (history.filter(q => q.success && q.executionTime).length || 1)
    }
  }, [queryHistory])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Code size={28} weight="duotone" className="text-primary" />
                ES|QL Query Console
              </DialogTitle>
              <DialogDescription>
                Build, execute, and analyze ES|QL queries with full syntax highlighting and history tracking
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              {elasticsearch.isConnected ? (
                <>
                  <Badge variant="default" className="bg-success text-success-foreground">
                    <span className="h-2 w-2 bg-success-foreground rounded-full animate-pulse mr-2" />
                    Connected
                  </Badge>
                  {elasticsearch.connectionInfo && (
                    <div className="text-xs text-muted-foreground">
                      {elasticsearch.connectionInfo.cluster_name} v{elasticsearch.connectionInfo.version?.number}
                    </div>
                  )}
                  {elasticsearch.availableIndices.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {elasticsearch.availableIndices.length} indices available
                    </div>
                  )}
                </>
              ) : (
                <Badge variant="secondary">
                  Not Connected
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Total Queries</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Check size={16} className="text-success" />
                Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-success">{statistics.successful}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Warning size={16} className="text-destructive" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-destructive">{statistics.failed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Avg Time</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {Math.round(statistics.avgExecutionTime)}ms
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'builder' | 'history')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="builder">Query Builder</TabsTrigger>
              <TabsTrigger value="history" className="relative">
                Query History
                {(queryHistory || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {(queryHistory || []).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="builder" className="flex-1 overflow-auto mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ESQLQueryBuilder
                    onExecuteQuery={executeQuery}
                    defaultQuery={currentQuery}
                  />
                </div>
                {elasticsearch.availableIndices.length > 0 && (
                  <div className="lg:col-span-1">
                    <IndexSuggestionBox
                      indices={elasticsearch.availableIndices}
                      onSelectIndex={handleSelectIndex}
                    />
                  </div>
                )}
              </div>

              {queryResult && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {queryResult.success ? (
                            <>
                              <TableIcon size={24} weight="duotone" className="text-success" />
                              Query Results
                            </>
                          ) : (
                            <>
                              <Warning size={24} weight="duotone" className="text-destructive" />
                              Query Error
                            </>
                          )}
                        </CardTitle>
                        {queryResult.success && (
                          <CardDescription>
                            {queryResult.rowCount} rows returned in {queryResult.executionTime}ms
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {queryResult.success && queryResult.data && queryResult.data.length > 0 && (
                          <>
                            <Tabs value={resultView} onValueChange={(v) => setResultView(v as 'table' | 'chart')}>
                              <TabsList>
                                <TabsTrigger value="table" className="flex items-center gap-2">
                                  <TableIcon size={16} weight="duotone" />
                                  Table
                                </TabsTrigger>
                                <TabsTrigger value="chart" className="flex items-center gap-2">
                                  <ChartBar size={16} weight="duotone" />
                                  Chart
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                            <Button onClick={handleExportResults} variant="outline">
                              <Download size={18} className="mr-2" />
                              Export CSV
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {queryResult.success ? (
                      queryResult.data && queryResult.data.length > 0 ? (
                        <>
                          {queryResult.columns && queryResult.executionTime && (
                            <QueryResultAnalyzer
                              data={queryResult.data}
                              columns={queryResult.columns}
                              executionTime={queryResult.executionTime}
                              className="mb-6"
                            />
                          )}
                          
                          {resultView === 'table' ? (
                            <ScrollArea className="h-[400px]">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    {queryResult.columns?.map(col => (
                                      <TableHead key={col} className="font-mono">
                                        {col}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {queryResult.data.map((row, i) => (
                                    <TableRow key={i}>
                                      {queryResult.columns?.map(col => (
                                        <TableCell key={col} className="font-mono text-sm">
                                          {formatCellValue(row[col])}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                          ) : (
                            <ESQLChartBuilder
                              data={queryResult.data}
                              columns={queryResult.columns || []}
                              className="mt-4"
                            />
                          )}
                        </>
                      ) : (
                        <Alert>
                          <AlertDescription>
                            Query executed successfully but returned no results.
                          </AlertDescription>
                        </Alert>
                      )
                    ) : (
                      <Alert variant="destructive">
                        <Warning size={20} />
                        <AlertDescription>
                          <div className="font-semibold mb-1">Execution Error</div>
                          <div className="text-sm font-mono">{queryResult.error}</div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto mt-4">
              <ESQLQueryHistory
                history={queryHistory || []}
                onSelectQuery={handleSelectQuery}
                onClearHistory={handleClearHistory}
                onDeleteItem={handleDeleteHistoryItem}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return String(value)
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}
