import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface IndexSuggestionBoxProps {
  indices: string[]
  onSelectIndex: (index: string) => void
  className?: string
}

export function IndexSuggestionBox({ indices, onSelectIndex, className }: IndexSuggestionBoxProps) {
  if (indices.length === 0) {
    return null
  }

  const handleCopyIndex = (index: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(index)
    toast.success('Index name copied')
  }

  const groupedIndices = indices.reduce((acc, index) => {
    const prefix = index.split('-')[0] || 'other'
    if (!acc[prefix]) {
      acc[prefix] = []
    }
    acc[prefix].push(index)
    return acc
  }, {} as Record<string, string[]>)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database size={20} weight="duotone" className="text-primary" />
          Available Indices
        </CardTitle>
        <CardDescription>
          Click an index to insert it into your query
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {Object.entries(groupedIndices).map(([prefix, indexList]) => (
              <div key={prefix}>
                <div className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                  {prefix}
                  <Badge variant="secondary" className="ml-2">
                    {indexList.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {indexList.map((index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between group p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => onSelectIndex(index)}
                    >
                      <span className="text-sm font-mono">{index}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={(e) => handleCopyIndex(index, e)}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
