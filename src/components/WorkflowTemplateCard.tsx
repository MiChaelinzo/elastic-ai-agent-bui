import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChartLine, 
  Database, 
  Warning, 
  HardDrives, 
  GitBranch, 
  ShieldWarning, 
  CloudSlash, 
  Gauge,
  Clock,
  Lightning
} from '@phosphor-icons/react'
import type { WorkflowTemplate } from '@/lib/workflow-templates'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  ChartLine,
  Database,
  Warning,
  HardDrives,
  GitBranch,
  ShieldWarning,
  CloudSlash,
  Gauge
}

const severityColors = {
  critical: 'bg-destructive/20 text-destructive border-destructive',
  high: 'bg-warning/20 text-warning border-warning',
  medium: 'bg-primary/20 text-primary border-primary',
  low: 'bg-muted text-muted-foreground border-muted'
}

const automationLevelColors = {
  full: 'bg-success/20 text-success',
  semi: 'bg-warning/20 text-warning',
  manual: 'bg-muted text-muted-foreground'
}

interface WorkflowTemplateCardProps {
  template: WorkflowTemplate
  onSelect: (template: WorkflowTemplate) => void
}

export function WorkflowTemplateCard({ template, onSelect }: WorkflowTemplateCardProps) {
  const Icon = iconMap[template.icon] || Lightning
  const highestSeverity = template.severity[0]
  
  return (
    <Card className="p-6 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group" onClick={() => onSelect(template)}>
      <div className="flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-lg transition-colors',
          severityColors[highestSeverity]
        )}>
          <Icon size={32} weight="duotone" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={16} />
                <span className="font-mono">{Math.floor(template.estimatedTime / 60)}m {template.estimatedTime % 60}s</span>
              </div>
              
              <Badge className={automationLevelColors[template.automationLevel]}>
                {template.automationLevel === 'full' ? 'Fully Automated' : 
                 template.automationLevel === 'semi' ? 'Semi-Automated' : 'Manual'}
              </Badge>
            </div>
            
            <Button 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(template)
              }}
            >
              <Lightning size={16} className="mr-1.5" weight="bold" />
              Use Template
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
