import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Clock, Terminal, Database, Gear, ArrowRight } from '@phosphor-icons/react'
import type { ReasoningStep, ToolType } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

const toolIcons: Record<ToolType, React.ElementType> = {
  esql: Terminal,
  search: Database,
  workflow: Gear
}

const toolColors: Record<ToolType, string> = {
  esql: 'text-primary',
  search: 'text-blue-400',
  workflow: 'text-accent'
}

interface ReasoningLogProps {
  steps: ReasoningStep[]
  maxHeight?: string
}

export function ReasoningLog({ steps, maxHeight = '400px' }: ReasoningLogProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
        Agent Reasoning Chain
      </h3>
      
      <ScrollArea style={{ height: maxHeight }}>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="animate-slide-in-right">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold',
                    'bg-primary/20 text-primary'
                  )}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                  )}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {step.agentType}
                    </Badge>
                    
                    {step.tool && (
                      <Badge variant="outline" className={cn('text-xs', toolColors[step.tool])}>
                        {(() => {
                          const Icon = toolIcons[step.tool]
                          return <Icon size={12} className="mr-1" />
                        })()}
                        {step.tool.toUpperCase()}
                      </Badge>
                    )}
                    
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(step.timestamp).split(',')[1]?.trim() || new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{step.thought}</p>
                  
                  {step.query && (
                    <div className="bg-muted/50 rounded p-3 mb-2">
                      <code className="text-xs font-mono block whitespace-pre-wrap break-all">
                        {step.query}
                      </code>
                    </div>
                  )}
                  
                  {step.result && (
                    <div className="bg-secondary/30 rounded p-3 mb-2 border border-primary/20">
                      <p className="text-sm">{step.result}</p>
                    </div>
                  )}
                  
                  {step.confidence > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden max-w-[200px]">
                        <div
                          className={cn(
                            'h-full transition-all',
                            step.confidence >= 80 ? 'bg-success' : 
                            step.confidence >= 60 ? 'bg-warning' : 'bg-destructive'
                          )}
                          style={{ width: `${step.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-medium">{step.confidence}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
