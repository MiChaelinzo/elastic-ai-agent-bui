import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { AgentCard } from '@/components/AgentCard'
import { IncidentCard } from '@/components/IncidentCard'
import { ReasoningLog } from '@/components/ReasoningLog'
import { WorkflowTemplateCard } from '@/components/WorkflowTemplateCard'
import { WorkflowTemplateDetail } from '@/components/WorkflowTemplateDetail'
import { ConfidenceSettings as ConfidenceSettingsComponent } from '@/components/ConfidenceSettings'
import { ApprovalDialog } from '@/components/ApprovalDialog'
import { Lightning, Plus, GitBranch, ChartLine, CheckCircle, Sparkle, FunnelSimple, Gear, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Incident, Agent, ReasoningStep, AgentType, IncidentSeverity, ConfidenceSettings } from '@/lib/types'
import { simulateAgentReasoning, executeWorkflow, checkConfidenceThresholds } from '@/lib/agent-engine'
import { workflowTemplates, getTemplatesByCategory, searchTemplates, type WorkflowTemplate } from '@/lib/workflow-templates'

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    type: 'detector',
    name: 'Detector Agent',
    description: 'Identifies and classifies incidents using ES|QL queries',
    status: 'idle'
  },
  {
    id: 'agent-2',
    type: 'analyzer',
    name: 'Analyzer Agent',
    description: 'Investigates root causes with Elasticsearch Search',
    status: 'idle'
  },
  {
    id: 'agent-3',
    type: 'resolver',
    name: 'Resolver Agent',
    description: 'Proposes automated solutions via Elastic Workflows',
    status: 'idle'
  },
  {
    id: 'agent-4',
    type: 'verifier',
    name: 'Verifier Agent',
    description: 'Validates solutions before execution',
    status: 'idle'
  }
]

function App() {
  const [incidents, setIncidents] = useKV<Incident[]>('incidents', [])
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showNewIncident, setShowNewIncident] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [workflowProgress, setWorkflowProgress] = useState(0)
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [incidentPendingApproval, setIncidentPendingApproval] = useState<Incident | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  
  const [confidenceSettings, setConfidenceSettings] = useKV<ConfidenceSettings>('confidence-settings', {
    minConfidenceThreshold: 80,
    requireApprovalBelowThreshold: true,
    autoExecuteAboveThreshold: false,
    criticalIncidentThreshold: 90,
    notifyOnLowConfidence: true
  })
  
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium' as IncidentSeverity,
    templateId: ''
  })

  const createIncident = () => {
    if (!newIncident.title || !newIncident.description) {
      toast.error('Please fill in all fields')
      return
    }

    const incident: Incident = {
      id: `incident-${Date.now()}`,
      title: newIncident.title,
      description: newIncident.description,
      severity: newIncident.severity,
      status: 'new',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assignedAgents: [],
      reasoningSteps: [],
      templateId: newIncident.templateId || undefined
    }

    setIncidents(current => [incident, ...(current || [])])
    setShowNewIncident(false)
    setNewIncident({ title: '', description: '', severity: 'medium', templateId: '' })
    
    if (newIncident.templateId) {
      toast.success('Incident created from template', {
        description: 'Ready for automated workflow execution'
      })
    } else {
      toast.success('Incident created successfully')
    }
  }

  const processIncident = async (incident: Incident) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setSelectedIncident(incident)
    
    const agentSequence: AgentType[] = ['detector', 'analyzer', 'resolver', 'verifier']
    
    for (const agentType of agentSequence) {
      setAgents(current => 
        current.map(a => 
          a.type === agentType 
            ? { ...a, status: 'thinking' as const }
            : a
        )
      )

      setIncidents(current =>
        (current || []).map(inc =>
          inc.id === incident.id
            ? { 
                ...inc, 
                status: 'in-progress' as const,
                assignedAgents: [...new Set([...inc.assignedAgents, agentType])],
                updatedAt: Date.now()
              }
            : inc
        )
      )

      const response = await simulateAgentReasoning(
        incident,
        agentType,
        (step: ReasoningStep) => {
          setIncidents(current =>
            (current || []).map(inc =>
              inc.id === incident.id
                ? { ...inc, reasoningSteps: [...inc.reasoningSteps, step] }
                : inc
            )
          )
          
          if (selectedIncident?.id === incident.id) {
            setSelectedIncident(prev => 
              prev ? { ...prev, reasoningSteps: [...prev.reasoningSteps, step] } : null
            )
          }
        }
      )

      const confidence = Math.floor(Math.random() * 20) + 80

      setAgents(current =>
        current.map(a =>
          a.type === agentType
            ? { ...a, status: 'complete' as const, confidence }
            : a
        )
      )

      if (agentType === 'resolver') {
        setIncidents(current =>
          (current || []).map(inc =>
            inc.id === incident.id
              ? { ...inc, proposedSolution: response }
              : inc
          )
        )
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const updatedIncident = (incidents || []).find(inc => inc.id === incident.id)
    if (!updatedIncident || !confidenceSettings) {
      setIsProcessing(false)
      return
    }

    const approvalCheck = checkConfidenceThresholds(updatedIncident, confidenceSettings)
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incident.id
          ? {
              ...inc,
              requiresApproval: approvalCheck.requiresApproval,
              approvalReason: approvalCheck.reason,
              lowestConfidence: approvalCheck.lowestConfidence,
              status: approvalCheck.requiresApproval ? 'pending-approval' as const : inc.status
            }
          : inc
      )
    )

    if (approvalCheck.requiresApproval) {
      const incidentWithApproval = {
        ...updatedIncident,
        requiresApproval: true,
        approvalReason: approvalCheck.reason,
        lowestConfidence: approvalCheck.lowestConfidence,
        status: 'pending-approval' as const
      }
      
      setIncidentPendingApproval(incidentWithApproval)
      setShowApprovalDialog(true)
      
      if (confidenceSettings.notifyOnLowConfidence && approvalCheck.lowestConfidence < confidenceSettings.minConfidenceThreshold) {
        toast.warning('Low confidence detected - Approval required', {
          description: approvalCheck.reason
        })
      } else {
        toast.info('Manual approval required', {
          description: approvalCheck.reason
        })
      }
    } else if (confidenceSettings.autoExecuteAboveThreshold) {
      toast.success('High confidence - Auto-executing resolution', {
        description: `All agents exceeded ${confidenceSettings.minConfidenceThreshold}% confidence threshold`
      })
      await executeResolution(updatedIncident)
    } else {
      toast.success('All agents have completed analysis', {
        description: 'Ready to execute automated resolution'
      })
    }
    
    setIsProcessing(false)
  }

  const executeResolution = async (incident: Incident) => {
    setIsProcessing(true)
    setWorkflowProgress(0)
    
    toast.info('Executing automated workflow...')

    const result = await executeWorkflow(
      incident.id,
      (step, progress) => {
        setCurrentWorkflowStep(step)
        setWorkflowProgress(progress)
      }
    )

    if (result.success) {
      const timeToResolve = Math.floor((Date.now() - incident.createdAt) / 1000)
      
      setIncidents(current =>
        (current || []).map(inc =>
          inc.id === incident.id
            ? {
                ...inc,
                status: 'resolved' as const,
                resolution: result.message,
                updatedAt: Date.now(),
                metricsImpact: {
                  timeToDetect: 12,
                  timeToResolve,
                  stepsAutomated: 6
                }
              }
            : inc
        )
      )

      toast.success('Incident resolved successfully!', {
        description: result.message
      })
    } else {
      toast.error('Workflow execution failed')
    }

    setIsProcessing(false)
    setWorkflowProgress(0)
    setCurrentWorkflowStep('')
  }

  const handleApprove = async () => {
    if (!incidentPendingApproval) return

    const user = await window.spark.user()
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incidentPendingApproval.id
          ? {
              ...inc,
              status: 'in-progress' as const,
              approvedBy: user?.login || 'unknown',
              approvedAt: Date.now()
            }
          : inc
      )
    )

    setShowApprovalDialog(false)
    
    toast.success('Incident approved', {
      description: 'Executing automated resolution workflow...'
    })

    await executeResolution(incidentPendingApproval)
    setIncidentPendingApproval(null)
  }

  const handleReject = async () => {
    if (!incidentPendingApproval) return

    const user = await window.spark.user()
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incidentPendingApproval.id
          ? {
              ...inc,
              status: 'failed' as const,
              resolution: `Manual approval rejected by ${user?.login || 'user'}`,
              updatedAt: Date.now()
            }
          : inc
      )
    )

    setShowApprovalDialog(false)
    setIncidentPendingApproval(null)
    
    toast.error('Incident resolution rejected', {
      description: 'Automated workflow was not executed'
    })
  }

  const activeIncidents = (incidents || []).filter(i => i.status === 'in-progress' || i.status === 'new')
  const pendingApprovalIncidents = (incidents || []).filter(i => i.status === 'pending-approval')
  const resolvedIncidents = (incidents || []).filter(i => i.status === 'resolved')
  const failedIncidents = (incidents || []).filter(i => i.status === 'failed')

  const templatesByCategory = getTemplatesByCategory()
  const categories = ['all', ...Object.keys(templatesByCategory)]
  
  const filteredTemplates = templateSearch
    ? searchTemplates(templateSearch)
    : selectedCategory === 'all'
    ? workflowTemplates
    : templatesByCategory[selectedCategory] || []

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
  }

  const applyTemplateToIncident = () => {
    if (!selectedTemplate) return
    
    setNewIncident({
      title: selectedTemplate.name,
      description: selectedTemplate.description,
      severity: selectedTemplate.severity[0],
      templateId: selectedTemplate.id
    })
    setShowTemplates(false)
    setShowNewIncident(true)
    setSelectedTemplate(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Lightning size={28} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Elastic Agent Orchestrator</h1>
                <p className="text-sm text-muted-foreground">Multi-Agent DevOps Incident Response</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowSettings(true)} variant="outline" size="lg">
                <Gear size={20} className="mr-2" weight="duotone" />
                Settings
              </Button>
              <Button onClick={() => setShowTemplates(true)} variant="outline" size="lg">
                <Sparkle size={20} className="mr-2" weight="duotone" />
                Workflow Templates
              </Button>
              <Button onClick={() => setShowNewIncident(true)} size="lg">
                <Plus size={20} className="mr-2" weight="bold" />
                New Incident
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {agents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeIncidents.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending Approval ({pendingApprovalIncidents.length})
              {pendingApprovalIncidents.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedIncidents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeIncidents.length === 0 ? (
              <Alert>
                <CheckCircle size={20} />
                <AlertDescription>
                  No active incidents. All systems operational.
                </AlertDescription>
              </Alert>
            ) : (
              activeIncidents.map(incident => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingApprovalIncidents.length === 0 ? (
              <Alert>
                <CheckCircle size={20} />
                <AlertDescription>
                  No incidents awaiting approval.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="border-warning">
                  <ShieldCheck size={20} className="text-warning" />
                  <AlertDescription>
                    <strong>{pendingApprovalIncidents.length}</strong> incident{pendingApprovalIncidents.length !== 1 ? 's' : ''} require{pendingApprovalIncidents.length === 1 ? 's' : ''} human approval before automated resolution can proceed.
                  </AlertDescription>
                </Alert>
                {pendingApprovalIncidents.map(incident => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => setSelectedIncident(incident)}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedIncidents.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No resolved incidents yet.
                </AlertDescription>
              </Alert>
            ) : (
              resolvedIncidents.map(incident => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showNewIncident} onOpenChange={setShowNewIncident}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Incident</DialogTitle>
            <DialogDescription>
              Report a new incident for agent analysis and automated resolution
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {newIncident.templateId && (
              <Alert>
                <Sparkle size={20} className="text-primary" />
                <AlertDescription>
                  Using workflow template: <strong>{newIncident.title}</strong>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title</Label>
              <Input
                id="title"
                placeholder="e.g., API Service High Latency"
                value={newIncident.title}
                onChange={e => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident symptoms and impact..."
                value={newIncident.description}
                onChange={e => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={newIncident.severity}
                onValueChange={(value) => 
                  setNewIncident(prev => ({ ...prev, severity: value as IncidentSeverity }))
                }
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewIncident(false)}>
              Cancel
            </Button>
            <Button onClick={createIncident}>Create Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Templates</DialogTitle>
            <DialogDescription>
              Select a pre-configured workflow template for common incident types
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <FunnelSimple size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredTemplates.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No templates found matching your criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                filteredTemplates.map(template => (
                  <WorkflowTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                  />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedTemplate !== null} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>Workflow Template Details</DialogTitle>
              </DialogHeader>
              
              <WorkflowTemplateDetail template={selectedTemplate} />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={applyTemplateToIncident}>
                  <Sparkle size={18} className="mr-2" weight="bold" />
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={selectedIncident !== null} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedIncident.title}</DialogTitle>
                <DialogDescription>{selectedIncident.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {selectedIncident.reasoningSteps.length > 0 && (
                  <ReasoningLog steps={selectedIncident.reasoningSteps} maxHeight="500px" />
                )}

                {selectedIncident.proposedSolution && (
                  <Alert className="border-accent">
                    <GitBranch size={20} className="text-accent" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Proposed Solution:</div>
                      <div className="text-sm">{selectedIncident.proposedSolution}</div>
                    </AlertDescription>
                  </Alert>
                )}

                {isProcessing && workflowProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{currentWorkflowStep}</span>
                      <span className="font-mono font-semibold">{Math.round(workflowProgress)}%</span>
                    </div>
                    <Progress value={workflowProgress} />
                  </div>
                )}

                {selectedIncident.resolution && (
                  <Alert className="border-success">
                    <CheckCircle size={20} className="text-success" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">Resolution:</div>
                      <div className="text-sm">{selectedIncident.resolution}</div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                {selectedIncident.status === 'new' && (
                  <Button
                    onClick={() => processIncident(selectedIncident)}
                    disabled={isProcessing}
                  >
                    <Lightning size={18} className="mr-2" weight="bold" />
                    Start Agent Analysis
                  </Button>
                )}

                {selectedIncident.status === 'in-progress' && 
                 selectedIncident.proposedSolution && 
                 !selectedIncident.requiresApproval &&
                 !isProcessing && (
                  <Button
                    onClick={() => executeResolution(selectedIncident)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <CheckCircle size={18} className="mr-2" weight="bold" />
                    Execute Resolution
                  </Button>
                )}

                {selectedIncident.status === 'pending-approval' && (
                  <Button
                    onClick={() => {
                      setIncidentPendingApproval(selectedIncident)
                      setShowApprovalDialog(true)
                    }}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    <ShieldCheck size={18} className="mr-2" weight="bold" />
                    Review & Approve
                  </Button>
                )}

                {selectedIncident.status === 'resolved' && (
                  <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gear size={24} weight="duotone" className="text-primary" />
              Agent Settings
            </DialogTitle>
            <DialogDescription>
              Configure agent behavior and confidence thresholds
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {confidenceSettings && (
              <ConfidenceSettingsComponent
                settings={confidenceSettings}
                onChange={(newSettings) => setConfidenceSettings(newSettings)}
              />
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApprovalDialog
        incident={incidentPendingApproval}
        isOpen={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false)
          setIncidentPendingApproval(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default App
