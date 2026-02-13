import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Detective, MagnifyingGlass, Wrench, ShieldCheck } from '@phosphor-icons/react'
import type { Agent, AgentType } from '@/lib/types'
import { cn } from '@/lib/utils'

const agentIcons: Record<AgentType, React.ElementType> = {
  detector: Detective,
  analyzer: MagnifyingGlass,
  resolver: Wrench,
  verifier: ShieldCheck
}

const agentColors = {
  detector: 'text-primary',
  analyzer: 'text-blue-400',
  resolver: 'text-accent',
  verifier: 'text-purple-400'
}

const statusColors = {
  idle: 'bg-muted text-muted-foreground',
  thinking: 'bg-primary text-primary-foreground animate-pulse',
  executing: 'bg-accent text-accent-foreground',
  complete: 'bg-success text-success-foreground',
  error: 'bg-destructive text-destructive-foreground'
}

interface AgentCardProps {
  agent: Agent
  onClick?: () => void
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const Icon = agentIcons[agent.type]
  
  return (
    <Card
      className={cn(
        'p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl border-2',
        agent.status === 'thinking' && 'animate-pulse-glow border-primary',
        agent.status === 'executing' && 'border-accent',
        agent.status === 'complete' && 'border-success',
        agent.status === 'error' && 'border-destructive'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-lg bg-secondary/50', agentColors[agent.type])}>
          <Icon size={32} weight="duotone" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <Badge className={statusColors[agent.status]}>
              {agent.status}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {agent.description}
          </p>
          
          {agent.confidence !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-mono font-medium">{agent.confidence}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    agent.confidence >= 80 ? 'bg-success' : 
                    agent.confidence >= 60 ? 'bg-warning' : 'bg-destructive'
                  )}
                  style={{ width: `${agent.confidence}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
