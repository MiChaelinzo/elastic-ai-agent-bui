import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Detective, 
  MagnifyingGlass, 
  Wrench, 
  ShieldCheck,
  Clock,
  ArrowRight,
  Code
} from '@phosphor-icons/react'
import type { WorkflowTemplate, WorkflowTemplateStep } from '@/lib/workflow-templates'
import type { AgentType, ToolType } from '@/lib/types'
import { cn } from '@/lib/utils'

const agentIcons: Record<AgentType, React.ElementType> = {
  detector: Detective,
  analyzer: MagnifyingGlass,
  resolver: Wrench,
  verifier: ShieldCheck
}

const agentColors = {
  detector: 'text-primary bg-primary/10 border-primary',
  analyzer: 'text-blue-400 bg-blue-400/10 border-blue-400',
  resolver: 'text-accent bg-accent/10 border-accent',
  verifier: 'text-purple-400 bg-purple-400/10 border-purple-400'
}

const toolBadgeColors: Record<ToolType, string> = {
  esql: 'bg-primary/20 text-primary',
  search: 'bg-blue-400/20 text-blue-400',
  workflow: 'bg-accent/20 text-accent'
}

interface WorkflowTemplateDetailProps {
  template: WorkflowTemplate
}

export function WorkflowTemplateDetail({ template }: WorkflowTemplateDetailProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">{template.name}</h3>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Category:</span>
          <Badge variant="outline">{template.category}</Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Est. Time:</span>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-muted-foreground" />
            <span className="font-mono font-medium">
              {Math.floor(template.estimatedTime / 60)}m {template.estimatedTime % 60}s
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Automation:</span>
          <Badge>
            {template.automationLevel === 'full' ? 'Fully Automated' : 
             template.automationLevel === 'semi' ? 'Semi-Automated' : 'Manual'}
          </Badge>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-semibold mb-4">Workflow Steps ({template.steps.length})</h4>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {template.steps.map((step, index) => (
              <WorkflowStepCard 
                key={index} 
                step={step} 
                stepNumber={index + 1}
                isLast={index === template.steps.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

interface WorkflowStepCardProps {
  step: WorkflowTemplateStep
  stepNumber: number
  isLast: boolean
}

function WorkflowStepCard({ step, stepNumber, isLast }: WorkflowStepCardProps) {
  const Icon = agentIcons[step.agentType]
  
  return (
    <div className="relative">
      <div className={cn(
        'border-2 rounded-lg p-4 transition-all hover:shadow-md',
        agentColors[step.agentType]
      )}>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-mono font-bold text-sm">
            {stepNumber}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={20} weight="duotone" />
              <h5 className="font-semibold">{step.name}</h5>
              <Badge className={toolBadgeColors[step.tool]} variant="secondary">
                {step.tool.toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {step.description}
            </p>
            
            {(step.esqlQuery || step.searchQuery || step.workflowAction) && (
              <div className="bg-secondary/50 rounded p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Code size={14} />
                  <span>
                    {step.esqlQuery ? 'ES|QL Query' : 
                     step.searchQuery ? 'Search Query' : 'Workflow Action'}
                  </span>
                </div>
                <pre className="text-xs font-mono overflow-x-auto text-foreground/90 whitespace-pre-wrap break-words">
                  {step.esqlQuery || step.searchQuery || step.workflowAction}
                </pre>
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Clock size={14} />
              <span className="font-mono">~{step.estimatedDuration}s</span>
            </div>
          </div>
        </div>
      </div>
      
      {!isLast && (
        <div className="flex justify-center py-2">
          <ArrowRight size={24} className="text-muted-foreground" weight="bold" />
        </div>
      )}
    </div>
  )
}
