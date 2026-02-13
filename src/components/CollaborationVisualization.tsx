import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AgentCollaborationGraph } from '@/components/AgentCollaborationGraph'
import { Agent, ReasoningStep, Incident, AgentType } from '@/lib/types'
import { GitBranch, ArrowRight, CheckCircle, Clock, Brain, Database } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface CollaborationVisualizationProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  incident: Incident | null
}

export function CollaborationVisualization({
  isOpen,
  onClose,
  agents,
  incident
}: CollaborationVisualizationProps) {
  const [selectedStep, setSelectedStep] = useState<ReasoningStep | null>(null)

  if (!incident) return null

  const agentSequence: AgentType[] = ['detector', 'analyzer', 'resolver', 'verifier']
  const completedAgents = incident.assignedAgents
  const activeAgent = agents.find(a => a.status === 'thinking')

  const getToolIcon = (tool?: string) => {
    switch (tool) {
      case 'esql':
        return <Database size={16} weight="duotone" />
      case 'search':
        return <Brain size={16} weight="duotone" />
      case 'workflow':
        return <GitBranch size={16} weight="duotone" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch size={24} weight="duotone" className="text-primary" />
            Agent Collaboration Network
          </DialogTitle>
          <DialogDescription>
            Real-time visualization of multi-agent data flow and reasoning for: {incident.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AgentCollaborationGraph
            agents={agents}
            activeAgent={activeAgent?.type}
            reasoningSteps={incident.reasoningSteps}
            className="h-[350px]"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Agent Pipeline</h3>
                <Badge variant="outline">
                  {completedAgents.length} / {agentSequence.length} Complete
                </Badge>
              </div>

              <div className="space-y-3">
                {agentSequence.map((agentType, index) => {
                  const agent = agents.find(a => a.type === agentType)
                  const isCompleted = completedAgents.includes(agentType)
                  const isActive = activeAgent?.type === agentType
                  const isUpcoming = !isCompleted && !isActive

                  return (
                    <div key={agentType} className="space-y-2">
                      <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-all",
                        isActive && "bg-primary/10 border-2 border-primary",
                        isCompleted && "bg-success/10 border border-success/30",
                        isUpcoming && "bg-muted/50 border border-border opacity-50"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            isActive && "bg-primary text-primary-foreground animate-pulse",
                            isCompleted && "bg-success text-success-foreground",
                            isUpcoming && "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? (
                              <CheckCircle size={18} weight="bold" />
                            ) : isActive ? (
                              <Clock size={18} weight="bold" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div>
                            <div className="font-semibold capitalize">{agent?.name}</div>
                            <div className="text-xs text-muted-foreground">{agent?.description}</div>
                          </div>
                        </div>
                        {agent?.confidence && (
                          <Badge 
                            variant={agent.confidence >= 80 ? "default" : "secondary"}
                            className="font-mono"
                          >
                            {agent.confidence}%
                          </Badge>
                        )}
                      </div>
                      {index < agentSequence.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowRight 
                            size={20} 
                            className={cn(
                              "text-muted-foreground",
                              isCompleted && "text-success"
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Reasoning Timeline</h3>
                <Badge variant="outline">
                  {incident.reasoningSteps.length} Steps
                </Badge>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {incident.reasoningSteps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No reasoning steps yet. Analysis will appear here.
                  </div>
                ) : (
                  incident.reasoningSteps.map((step, index) => {
                    const agent = agents.find(a => a.type === step.agentType)
                    const isSelected = selectedStep?.id === step.id

                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(isSelected ? null : step)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all hover:shadow-md",
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-1"
                            style={{ backgroundColor: agent?.status === 'complete' ? '#10b981' : '#3b82f6' }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold capitalize">{step.agentType}</span>
                              {step.tool && (
                                <Badge variant="outline" className="text-xs gap-1">
                                  {getToolIcon(step.tool)}
                                  {step.tool}
                                </Badge>
                              )}
                              <Badge 
                                variant={step.confidence >= 80 ? "default" : "secondary"}
                                className="text-xs font-mono ml-auto"
                              >
                                {step.confidence}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {step.thought}
                            </p>
                            {isSelected && step.result && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <div className="font-semibold mb-1">Result:</div>
                                <div className="text-muted-foreground">{step.result}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Data Flow Statistics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{incident.reasoningSteps.length}</div>
                <div className="text-xs text-muted-foreground">Total Reasoning Steps</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-accent">{completedAgents.length}</div>
                <div className="text-xs text-muted-foreground">Agents Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-success">
                  {incident.reasoningSteps.length > 0
                    ? Math.round(
                        incident.reasoningSteps.reduce((sum, step) => sum + step.confidence, 0) /
                          incident.reasoningSteps.length
                      )
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-warning">
                  {incident.reasoningSteps.filter(s => s.tool).length}
                </div>
                <div className="text-xs text-muted-foreground">Tools Invoked</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
