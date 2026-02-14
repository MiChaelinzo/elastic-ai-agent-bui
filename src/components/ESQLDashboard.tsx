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

export function ESQLDashboard({ isOpen, onClose, elasticsearch }: ESQLDashboardProps) {
  const [queryHistory, setQueryHistory] = useKV<ESQLQueryHistoryItem[]>('esql-query-history', [])
  const [currentQuery, setCurrentQuery] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder')

  const executeQuery = async (query: string): Promise<QueryResult> => {
    if (!elasticsearch.isConnected) {
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
      const mockData = generateMockESQLResults(query)
      const executionTime = Date.now() - startTime + Math.floor(Math.random() * 50)
      
      const result: QueryResult = {
        success: true,
        executionTime,
        rowCount: mockData.length,
        data: mockData,
        columns: mockData.length > 0 ? Object.keys(mockData[0]) : []
      }

      const historyItem = saveQueryToHistory(query, {
        success: result.success,
        executionTime: result.executionTime,
        rowCount: result.rowCount
      })
      
      setQueryHistory(current => [historyItem, ...(current || [])].slice(0, 100))
      setQueryResult(result)
      
      return result
    } catch (error) {
      const result: QueryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }

      const historyItem = saveQueryToHistory(query, result)
      setQueryHistory(current => [historyItem, ...(current || [])])
      setQueryResult(result)
      
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
          <DialogTitle className="flex items-center gap-2">
            <Code size={28} weight="duotone" className="text-primary" />
            ES|QL Query Console
          </DialogTitle>
          <DialogDescription>
            Build, execute, and analyze ES|QL queries with full syntax highlighting and history tracking
          </DialogDescription>
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
              <ESQLQueryBuilder
                onExecuteQuery={executeQuery}
                defaultQuery={currentQuery}
              />

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
                      {queryResult.success && queryResult.data && queryResult.data.length > 0 && (
                        <Button onClick={handleExportResults} variant="outline">
                          <Download size={18} className="mr-2" />
                          Export CSV
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {queryResult.success ? (
                      queryResult.data && queryResult.data.length > 0 ? (
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

function generateMockESQLResults(query: string): any[] {
  const upperQuery = query.toUpperCase()
  
  if (upperQuery.includes('STATS') && upperQuery.includes('COUNT')) {
    return Array.from({ length: 10 }, (_, i) => ({
      category: `Category ${i + 1}`,
      count: Math.floor(Math.random() * 1000),
      avg_value: Math.floor(Math.random() * 100)
    }))
  }
  
  if (upperQuery.includes('STATS') && upperQuery.includes('AVG')) {
    return Array.from({ length: 5 }, (_, i) => ({
      service: `service-${i + 1}`,
      avg_duration: Math.floor(Math.random() * 500),
      p95: Math.floor(Math.random() * 800),
      p99: Math.floor(Math.random() * 1200)
    }))
  }
  
  return Array.from({ length: 20 }, (_, i) => ({
    '@timestamp': new Date(Date.now() - i * 60000).toISOString(),
    level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
    message: `Log message ${i + 1}`,
    service: `service-${Math.floor(Math.random() * 5) + 1}`,
    host: `host-${Math.floor(Math.random() * 10) + 1}`,
    status_code: [200, 201, 400, 404, 500][Math.floor(Math.random() * 5)]
  }))
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
