import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Play, Clock, Check, Warning, MagicWand, Code, Copy, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  tokenizeESQL, 
  validateESQLQuery, 
  formatESQLQuery,
  ESQL_SAMPLE_QUERIES,
  type ESQLToken
} from '@/lib/esql-utils'
import { cn } from '@/lib/utils'

interface ESQLQueryBuilderProps {
  onExecuteQuery: (query: string) => Promise<{ success: boolean; executionTime?: number; rowCount?: number; error?: string; data?: any[] }>
  defaultQuery?: string
  className?: string
}

export function ESQLQueryBuilder({ onExecuteQuery, defaultQuery, className }: ESQLQueryBuilderProps) {
  const [query, setQuery] = useState(defaultQuery || '')
  const [isExecuting, setIsExecuting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [tokens, setTokens] = useState<ESQLToken[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cursorPosition, setCursorPosition] = useState(0)

  useEffect(() => {
    if (query) {
      const newTokens = tokenizeESQL(query)
      setTokens(newTokens)
      
      const validation = validateESQLQuery(query)
      setValidationErrors(validation.errors)
    } else {
      setTokens([])
      setValidationErrors([])
    }
  }, [query])

  const handleExecute = async () => {
    const validation = validateESQLQuery(query)
    if (!validation.valid) {
      toast.error('Invalid query', {
        description: validation.errors[0]
      })
      return
    }

    setIsExecuting(true)
    try {
      const result = await onExecuteQuery(query)
      
      if (result.success) {
        toast.success('Query executed successfully', {
          description: `${result.rowCount || 0} rows in ${result.executionTime || 0}ms`
        })
      } else {
        toast.error('Query execution failed', {
          description: result.error || 'Unknown error'
        })
      }
    } catch (error) {
      toast.error('Query execution error', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleFormat = () => {
    const formatted = formatESQLQuery(query)
    setQuery(formatted)
    toast.success('Query formatted')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(query)
    toast.success('Query copied to clipboard')
  }

  const handleClear = () => {
    setQuery('')
    toast.success('Query cleared')
  }

  const handleLoadSample = (sampleQuery: string) => {
    setQuery(sampleQuery)
    toast.success('Sample query loaded')
  }

  const getTokenColor = (type: ESQLToken['type']): string => {
    switch (type) {
      case 'keyword':
        return 'text-blue-600 dark:text-blue-400 font-semibold'
      case 'function':
        return 'text-purple-600 dark:text-purple-400 font-semibold'
      case 'operator':
        return 'text-orange-600 dark:text-orange-400'
      case 'string':
        return 'text-green-600 dark:text-green-400'
      case 'number':
        return 'text-cyan-600 dark:text-cyan-400'
      case 'pipe':
        return 'text-gray-600 dark:text-gray-400 font-bold'
      case 'comment':
        return 'text-gray-500 dark:text-gray-500 italic'
      default:
        return 'text-foreground'
    }
  }

  return (
    <Card className={cn('relative', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code size={24} weight="duotone" className="text-primary" />
              ES|QL Query Builder
            </CardTitle>
            <CardDescription>
              Build and execute ES|QL queries with syntax highlighting
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {validationErrors.length === 0 && query.trim() && (
              <Badge variant="secondary" className="bg-success/20 text-success">
                <Check size={14} className="mr-1" />
                Valid
              </Badge>
            )}
            {validationErrors.length > 0 && (
              <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                <Warning size={14} className="mr-1" />
                {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Query</label>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleFormat}
                variant="outline"
                size="sm"
                disabled={!query.trim()}
              >
                <MagicWand size={16} className="mr-2" />
                Format
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                disabled={!query.trim()}
              >
                <Copy size={16} className="mr-2" />
                Copy
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={!query.trim()}
              >
                <Trash size={16} className="mr-2" />
                Clear
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 pointer-events-none z-10 p-3 font-mono text-sm overflow-auto rounded-md border border-input bg-transparent">
              <pre className="whitespace-pre-wrap break-words">
                {tokens.map((token, i) => (
                  <span
                    key={i}
                    className={cn(getTokenColor(token.type))}
                  >
                    {token.value}
                  </span>
                ))}
              </pre>
            </div>
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setCursorPosition(e.target.selectionStart)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleExecute()
                }
              }}
              placeholder="FROM logs-* | WHERE @timestamp >= NOW() - 1 hour | LIMIT 100"
              className="font-mono text-sm min-h-[200px] resize-y relative z-20 text-transparent caret-foreground bg-transparent selection:bg-primary/20"
              spellCheck={false}
              style={{ caretColor: 'var(--color-foreground)' }}
            />
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <Warning size={20} />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded">Cmd/Ctrl + Enter</kbd> to execute
          </div>
          <Button
            onClick={handleExecute}
            disabled={isExecuting || validationErrors.length > 0 || !query.trim()}
            size="lg"
            className="relative"
          >
            <Play size={20} className="mr-2" weight="fill" />
            {isExecuting ? 'Executing...' : 'Execute Query'}
          </Button>
        </div>

        <Tabs defaultValue="samples" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="samples">Sample Queries</TabsTrigger>
            <TabsTrigger value="reference">Quick Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="samples" className="space-y-2">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 pr-4">
                {ESQL_SAMPLE_QUERIES.map((sample, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleLoadSample(sample.query)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-semibold">
                        {sample.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {sample.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                        {sample.query}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reference" className="space-y-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4 pr-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Commands</h4>
                  <div className="flex flex-wrap gap-2">
                    {['FROM', 'WHERE', 'LIMIT', 'SORT', 'STATS', 'KEEP', 'DROP', 'EVAL', 'RENAME'].map(cmd => (
                      <Badge key={cmd} variant="secondary" className="font-mono">
                        {cmd}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Aggregation Functions</h4>
                  <div className="flex flex-wrap gap-2">
                    {['AVG', 'COUNT', 'MAX', 'MIN', 'SUM', 'MEDIAN', 'PERCENTILE'].map(func => (
                      <Badge key={func} variant="secondary" className="font-mono text-purple-600 dark:text-purple-400">
                        {func}()
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">String Functions</h4>
                  <div className="flex flex-wrap gap-2">
                    {['CONCAT', 'LENGTH', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER'].map(func => (
                      <Badge key={func} variant="secondary" className="font-mono text-purple-600 dark:text-purple-400">
                        {func}()
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Date Functions</h4>
                  <div className="flex flex-wrap gap-2">
                    {['NOW', 'DATE_EXTRACT', 'DATE_FORMAT', 'DATE_PARSE', 'DATE_TRUNC'].map(func => (
                      <Badge key={func} variant="secondary" className="font-mono text-purple-600 dark:text-purple-400">
                        {func}()
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Examples</h4>
                  <div className="space-y-2 text-xs">
                    <div className="bg-muted/50 p-2 rounded">
                      <code className="text-blue-600 dark:text-blue-400">FROM</code> logs-*
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <code className="text-blue-600 dark:text-blue-400">WHERE</code> @timestamp {'>'}= <code className="text-purple-600 dark:text-purple-400">NOW</code>() - 1 hour
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <code className="text-blue-600 dark:text-blue-400">STATS</code> count = <code className="text-purple-600 dark:text-purple-400">COUNT</code>(*) <code className="text-blue-600 dark:text-blue-400">BY</code> status
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
