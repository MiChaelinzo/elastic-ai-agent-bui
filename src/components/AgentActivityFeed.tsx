import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ReasoningStep, AgentType } from '@/lib/types'
import { Database, Brain, GitBranch, CheckCircle, Lightning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AgentActivityFeedProps {
  reasoningSteps: ReasoningStep[]
  maxItems?: number
  className?: string
}

const agentColors: Record<AgentType, string> = {
  detector: 'bg-blue-500',
  analyzer: 'bg-purple-500',
  resolver: 'bg-green-500',
  verifier: 'bg-amber-500'
}

const toolIcons = {
  esql: Database,
  search: Brain,
  workflow: GitBranch
}

export function AgentActivityFeed({ 
  reasoningSteps, 
  maxItems = 10,
  className 
}: AgentActivityFeedProps) {
  const [visibleSteps, setVisibleSteps] = useState<ReasoningStep[]>([])

  useEffect(() => {
    const latestSteps = [...reasoningSteps].reverse().slice(0, maxItems)
    setVisibleSteps(latestSteps)
  }, [reasoningSteps, maxItems])

  if (visibleSteps.length === 0) {
    return null
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Lightning size={20} weight="duotone" className="text-primary" />
          Live Agent Activity
        </h3>
        <Badge variant="outline">{reasoningSteps.length} total events</Badge>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {visibleSteps.map((step, index) => {
            const isLatest = index === 0
            const ToolIcon = step.tool ? toolIcons[step.tool] : null
            const timeAgo = getTimeAgo(step.timestamp)

            return (
              <div
                key={step.id}
                className={cn(
                  "relative pl-6 pb-3 border-l-2 transition-all",
                  isLatest ? "border-primary animate-pulse" : "border-border",
                  index === visibleSteps.length - 1 && "pb-0"
                )}
              >
                <div 
                  className={cn(
                    "absolute left-0 top-0 w-3 h-3 rounded-full -translate-x-[7px] ring-4 ring-background",
                    agentColors[step.agentType],
                    isLatest && "animate-pulse"
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm capitalize">
                        {step.agentType}
                      </span>
                      {ToolIcon && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <ToolIcon size={12} weight="duotone" />
                          {step.tool}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={step.confidence >= 80 ? "default" : "secondary"}
                        className="text-xs font-mono"
                      >
                        {step.confidence}%
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.thought}
                  </p>

                  {step.query && (
                    <div className="text-xs font-mono bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Query:</span>{' '}
                      <span className="text-foreground">{step.query}</span>
                    </div>
                  )}

                  {step.result && (
                    <div className="flex items-start gap-2 text-xs p-2 bg-success/10 border border-success/20 rounded">
                      <CheckCircle size={14} weight="bold" className="text-success mt-0.5 flex-shrink-0" />
                      <span className="text-success-foreground">{step.result}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
