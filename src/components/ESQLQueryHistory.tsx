import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Clock, Check, X, Play, Copy, Trash, MagnifyingGlass, ArrowCounterClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type { ESQLQueryHistoryItem } from '@/lib/esql-utils'
import { cn } from '@/lib/utils'

interface ESQLQueryHistoryProps {
  history: ESQLQueryHistoryItem[]
  onSelectQuery: (query: string) => void
  onClearHistory: () => void
  onDeleteItem: (id: string) => void
  className?: string
}

export function ESQLQueryHistory({ 
  history, 
  onSelectQuery, 
  onClearHistory, 
  onDeleteItem,
  className 
}: ESQLQueryHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const filteredHistory = history.filter(item => 
    item.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLoadQuery = (query: string) => {
    onSelectQuery(query)
    toast.success('Query loaded')
  }

  const handleCopyQuery = (query: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(query)
    toast.success('Query copied to clipboard')
  }

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteItem(id)
    toast.success('Query deleted from history')
  }

  const handleClearAll = () => {
    if (history.length === 0) return
    
    if (confirm(`Are you sure you want to clear all ${history.length} queries from history?`)) {
      onClearHistory()
      toast.success('Query history cleared')
    }
  }

  const sortedHistory = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <Card className={cn('relative', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock size={24} weight="duotone" className="text-primary" />
              Query History
            </CardTitle>
            <CardDescription>
              {history.length} {history.length === 1 ? 'query' : 'queries'} saved
            </CardDescription>
          </div>
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            disabled={history.length === 0}
          >
            <Trash size={16} className="mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <MagnifyingGlass 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search query history..."
            className="pl-10"
          />
        </div>

        {sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock size={48} weight="duotone" className="text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No queries found' : 'No query history yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {searchQuery ? 'Try a different search term' : 'Execute a query to see it here'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 pr-4">
              {sortedHistory.map((item) => (
                <Card
                  key={item.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedItem === item.id && 'border-primary',
                    !item.success && 'border-destructive/50'
                  )}
                  onClick={() => {
                    setSelectedItem(item.id)
                    handleLoadQuery(item.query)
                  }}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {item.success ? (
                            <Badge variant="secondary" className="bg-success/20 text-success">
                              <Check size={12} className="mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                              <X size={12} className="mr-1" />
                              Failed
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        
                        {item.success && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {item.executionTime !== undefined && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {item.executionTime}ms
                              </span>
                            )}
                            {item.rowCount !== undefined && (
                              <span>{item.rowCount} rows</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={(e) => handleCopyQuery(item.query, e)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    <pre className="text-xs font-mono bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap break-words">
                      {item.query}
                    </pre>
                    
                    {!item.success && item.error && (
                      <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                        <strong>Error:</strong> {item.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {history.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {sortedHistory.length} of {history.length} {history.length === 1 ? 'query' : 'queries'}
            </div>
            <Button
              onClick={() => setSearchQuery('')}
              variant="ghost"
              size="sm"
              disabled={!searchQuery}
            >
              <ArrowCounterClockwise size={14} className="mr-2" />
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
