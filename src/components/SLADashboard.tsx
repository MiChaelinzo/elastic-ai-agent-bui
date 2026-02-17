import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { Incident } from '@/lib/types'
import type { SLAPolicy, SLAStatus, SLABreach, SLAMetrics, EscalationRule, EscalationExecution } from '@/lib/sla-management'
import { 
  calculateSLAStatus, 
  formatSLATime, 
  getSLAStatusColor,
  getSLAMetrics,
  getSLAPolicy,
  defaultSLAPolicies,
  detectSLABreaches,
  defaultEscalationRules,
  getApplicableEscalationRules,
  executeEscalationRule
} from '@/lib/sla-management'
import { Clock, Warning, CheckCircle, Timer, Target, ChartLine, Bell, ShieldWarning, Gauge, TrendUp, ListChecks, Lightning } from '@phosphor-icons/react'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { EscalationWorkflowManager } from '@/components/EscalationWorkflowManager'
import { EscalationExecutionDetail } from '@/components/EscalationExecutionDetail'

interface SLADashboardProps {
  incidents: Incident[]
  policies?: SLAPolicy[]
  escalationRules?: EscalationRule[]
  onBreachDetected?: (breach: SLABreach) => void
  onIncidentUpdate?: (incidentId: string, updates: Partial<Incident>) => void
}

export function SLADashboard({ 
  incidents, 
  policies = defaultSLAPolicies, 
  escalationRules = defaultEscalationRules,
  onBreachDetected,
  onIncidentUpdate
}: SLADashboardProps) {
  const [breaches, setBreaches] = useState<SLABreach[]>([])
  const [selectedBreach, setSelectedBreach] = useState<SLABreach | null>(null)
  const [showBreachDetails, setShowBreachDetails] = useState(false)
  const [rules, setRules] = useState<EscalationRule[]>(escalationRules)
  const [escalationExecutions, setEscalationExecutions] = useState<EscalationExecution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<EscalationExecution | null>(null)
  const [showExecutionDetail, setShowExecutionDetail] = useState(false)

  const activeIncidents = useMemo(
    () => incidents.filter(i => i.status !== 'resolved' && i.status !== 'failed'),
    [incidents]
  )

  const slaStatuses = useMemo(() => {
    return activeIncidents.map(incident => {
      const policy = getSLAPolicy(incident.severity, policies)
      if (!policy) return null
      return calculateSLAStatus(incident, policy)
    }).filter(Boolean) as SLAStatus[]
  }, [activeIncidents, policies])

  const metrics = useMemo(
    () => getSLAMetrics(incidents, policies),
    [incidents, policies]
  )

  const breachedSLAs = slaStatuses.filter(s => s.status === 'breached')
  const atRiskSLAs = slaStatuses.filter(s => s.status === 'at-risk')
  const onTrackSLAs = slaStatuses.filter(s => s.status === 'on-track')

  const unacknowledgedBreaches = breaches.filter(b => !b.acknowledged)

  const handleEscalation = useCallback(async (
    incident: Incident,
    status: SLAStatus,
    breach: SLABreach | undefined
  ) => {
    const policy = getSLAPolicy(incident.severity, policies)
    if (!policy) return

    const applicableRules = getApplicableEscalationRules(
      incident,
      status,
      breach,
      rules,
      policy,
      escalationExecutions
    )

    for (const rule of applicableRules) {
      const execution = await executeEscalationRule(
        rule,
        incident,
        breach,
        status.status === 'breached' ? 'breach' : status.status === 'at-risk' ? 'at-risk' : 'time-threshold',
        {
          onUpgradeSeverity: (newSeverity) => {
            onIncidentUpdate?.(incident.id, { severity: newSeverity })
            toast.success(`Incident severity upgraded to ${newSeverity}`, {
              description: `Automated escalation workflow triggered`
            })
          },
          onAutoApprove: () => {
            onIncidentUpdate?.(incident.id, { 
              requiresApproval: false,
              approvedBy: 'Auto-approved by escalation workflow',
              approvedAt: Date.now()
            })
            toast.success('Incident auto-approved', {
              description: 'Agent actions approved by escalation workflow'
            })
          },
          onNotifyTeam: (team, message, channels) => {
            toast.info(`Team notification sent`, {
              description: `${team} notified via ${channels.join(', ')}: ${message}`
            })
          },
          onTriggerWorkflow: (workflowId) => {
            toast.info('Workflow triggered', {
              description: `Escalation workflow ${workflowId} initiated`
            })
          }
        }
      )

      setEscalationExecutions(prev => [execution, ...prev])

      if (breach) {
        setBreaches(prev => prev.map(b =>
          b.id === breach.id
            ? { ...b, escalationExecutions: [...(b.escalationExecutions || []), execution.id] }
            : b
        ))
      }

      toast.success(`Escalation workflow executed: ${rule.name}`, {
        description: `${execution.actionsExecuted.filter(a => a.success).length}/${execution.actionsExecuted.length} actions completed`,
        action: {
          label: 'View Details',
          onClick: () => {
            setSelectedExecution(execution)
            setShowExecutionDetail(true)
          }
        }
      })
    }
  }, [rules, policies, escalationExecutions, onIncidentUpdate])

  useEffect(() => {
    const newBreaches = detectSLABreaches(activeIncidents, policies, breaches)
    if (newBreaches.length > 0) {
      setBreaches(prev => [...newBreaches, ...prev])
      newBreaches.forEach(breach => {
        const incident = activeIncidents.find(i => i.id === breach.incidentId)
        const policy = getSLAPolicy(breach.severity, policies)
        
        if (incident && policy) {
          const status = calculateSLAStatus(incident, policy)
          handleEscalation(incident, status, breach)
        }

        toast.error('SLA Breach Detected!', {
          description: `${breach.incidentTitle} - ${breach.breachType} deadline exceeded`,
          action: {
            label: 'View',
            onClick: () => {
              setSelectedBreach(breach)
              setShowBreachDetails(true)
            }
          }
        })
        onBreachDetected?.(breach)
      })
    }
  }, [activeIncidents, policies, handleEscalation, onBreachDetected])

  useEffect(() => {
    const checkAtRiskIncidents = () => {
      activeIncidents.forEach(incident => {
        const policy = getSLAPolicy(incident.severity, policies)
        if (!policy) return

        const status = calculateSLAStatus(incident, policy)
        
        if (status.status === 'at-risk') {
          const recentExecutions = escalationExecutions.filter(
            e => e.incidentId === incident.id && e.trigger === 'at-risk'
          )
          
          if (recentExecutions.length === 0) {
            handleEscalation(incident, status, undefined)
          }
        }
      })
    }

    const interval = setInterval(checkAtRiskIncidents, 60000)
    checkAtRiskIncidents()

    return () => clearInterval(interval)
  }, [activeIncidents, policies, escalationExecutions, handleEscalation])

  const acknowledgeBreach = (breachId: string, notes?: string) => {
    setBreaches(prev => prev.map(b => 
      b.id === breachId 
        ? { ...b, acknowledged: true, acknowledgedAt: Date.now(), acknowledgedBy: 'User', notes }
        : b
    ))
    toast.success('Breach acknowledged', {
      description: 'The SLA breach has been documented'
    })
  }

  const getPolicyTarget = (severity: string) => {
    const policy = policies.find(p => p.severity === severity)
    return policy?.target || 95
  }
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r))
    toast.success(enabled ? 'Escalation rule enabled' : 'Escalation rule disabled')
  }

  const handleViewExecution = (execution: EscalationExecution) => {
    setSelectedExecution(execution)
    setShowExecutionDetail(true)
  }

  return (
    <div className="space-y-6">
      {unacknowledgedBreaches.length > 0 && (
        <Alert className="border-destructive bg-destructive/10 animate-pulse">
          <ShieldWarning size={20} className="text-destructive" weight="duotone" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>{unacknowledgedBreaches.length}</strong> unacknowledged SLA breach{unacknowledgedBreaches.length !== 1 ? 'es' : ''} detected
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                setSelectedBreach(unacknowledgedBreaches[0])
                setShowBreachDetails(true)
              }}
            >
              Review Breaches
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {escalationExecutions.filter(e => e.status === 'executing').length > 0 && (
        <Alert className="border-primary bg-primary/10">
          <Lightning size={20} className="text-primary" weight="duotone" />
          <AlertDescription>
            {escalationExecutions.filter(e => e.status === 'executing').length} escalation workflow(s) currently executing...
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active SLAs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="breaches">
            Breaches
            {unacknowledgedBreaches.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedBreaches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="escalation">
            Escalation Workflows
            {escalationExecutions.filter(e => e.status === 'executing').length > 0 && (
              <Badge variant="default" className="ml-2 animate-pulse">
                {escalationExecutions.filter(e => e.status === 'executing').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target size={24} weight="duotone" className="text-primary" />
                SLA Management Dashboard
              </CardTitle>
              <CardDescription>
                Monitor service level agreements, compliance metrics, and breach alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Compliance</span>
                <Gauge size={20} weight="duotone" className={
                  metrics.overall.compliance >= 95 ? 'text-success' :
                  metrics.overall.compliance >= 85 ? 'text-warning' : 'text-destructive'
                } />
              </div>
              <div className={`text-3xl font-bold ${
                metrics.overall.compliance >= 95 ? 'text-success' :
                metrics.overall.compliance >= 85 ? 'text-warning' : 'text-destructive'
              }`}>
                {metrics.overall.compliance.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.overall.compliantIncidents} of {metrics.overall.totalIncidents} met SLA
              </p>
              <Progress 
                value={metrics.overall.compliance} 
                className="h-1.5 mt-2"
              />
            </div>

            <div className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Active Tracking</span>
                <Clock size={20} weight="duotone" className="text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {slaStatuses.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {onTrackSLAs.length} on track
              </p>
              <div className="flex gap-1 mt-2">
                <div className="flex-1 h-1.5 bg-success rounded-full" style={{ width: `${(onTrackSLAs.length / slaStatuses.length) * 100}%` }} />
                <div className="flex-1 h-1.5 bg-warning rounded-full" style={{ width: `${(atRiskSLAs.length / slaStatuses.length) * 100}%` }} />
                <div className="flex-1 h-1.5 bg-destructive rounded-full" style={{ width: `${(breachedSLAs.length / slaStatuses.length) * 100}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">At Risk</span>
                <Warning size={20} weight="duotone" className="text-warning" />
              </div>
              <div className="text-3xl font-bold text-warning">
                {atRiskSLAs.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Approaching deadline
              </p>
              {atRiskSLAs.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-warning">
                  <TrendUp size={14} weight="bold" />
                  Requires attention
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow border-destructive/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Breached</span>
                <ShieldWarning size={20} weight="duotone" className="text-destructive" />
              </div>
              <div className="text-3xl font-bold text-destructive">
                {breachedSLAs.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {unacknowledgedBreaches.length} unacknowledged
              </p>
              {breachedSLAs.length > 0 && (
                <div className="mt-2">
                  <Badge variant="destructive" className="text-xs">
                    <Bell size={12} className="mr-1" weight="bold" />
                    Action Required
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListChecks size={20} weight="duotone" className="text-primary" />
              Compliance by Severity
            </CardTitle>
            <CardDescription>Performance against SLA targets for each priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.bySeverity).map(([severity, data]) => {
                const target = getPolicyTarget(severity)
                const isAboveTarget = data.compliance >= target
                return (
                  <div key={severity} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          severity === 'critical' ? 'destructive' :
                          severity === 'high' ? 'default' :
                          severity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Target: {target}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isAboveTarget ? 'text-success' : 'text-destructive'
                        }`}>
                          {data.compliance.toFixed(1)}%
                        </span>
                        {isAboveTarget ? (
                          <CheckCircle size={16} className="text-success" weight="bold" />
                        ) : (
                          <Warning size={16} className="text-destructive" weight="bold" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(100, data.compliance)} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{data.compliant} compliant / {data.breached} breached</span>
                      <span>Avg: {formatSLATime(data.averageResolutionTime)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChartLine size={20} weight="duotone" className="text-primary" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Average response and resolution times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <Badge variant="outline">
                    {formatSLATime(metrics.overall.averageResponseTime)}
                  </Badge>
                </div>
                <Progress value={30} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Resolution Time</span>
                  <Badge variant="outline">
                    {formatSLATime(metrics.overall.averageResolutionTime)}
                  </Badge>
                </div>
                <Progress value={65} className="h-2" />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Incidents</p>
                  <p className="text-2xl font-bold">{metrics.overall.totalIncidents}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Breached</p>
                  <p className="text-2xl font-bold text-destructive">{metrics.overall.breachedIncidents}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ListChecks size={20} weight="duotone" className="text-primary" />
                  Compliance by Severity
                </CardTitle>
                <CardDescription>Performance against SLA targets for each priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.bySeverity).map(([severity, data]) => {
                    const target = getPolicyTarget(severity)
                    const isAboveTarget = data.compliance >= target
                    return (
                      <div key={severity} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              severity === 'critical' ? 'destructive' :
                              severity === 'high' ? 'default' :
                              severity === 'medium' ? 'secondary' : 'outline'
                            }>
                              {severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Target: {target}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${
                              isAboveTarget ? 'text-success' : 'text-destructive'
                            }`}>
                              {data.compliance.toFixed(1)}%
                            </span>
                            {isAboveTarget ? (
                              <CheckCircle size={16} className="text-success" weight="bold" />
                            ) : (
                              <Warning size={16} className="text-destructive" weight="bold" />
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(100, data.compliance)} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{data.compliant} compliant / {data.breached} breached</span>
                          <span>Avg: {formatSLATime(data.averageResolutionTime)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChartLine size={20} weight="duotone" className="text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Average response and resolution times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Response Time</span>
                      <Badge variant="outline">
                        {formatSLATime(metrics.overall.averageResponseTime)}
                      </Badge>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Resolution Time</span>
                      <Badge variant="outline">
                        {formatSLATime(metrics.overall.averageResolutionTime)}
                      </Badge>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Incidents</p>
                      <p className="text-2xl font-bold">{metrics.overall.totalIncidents}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Breached</p>
                      <p className="text-2xl font-bold text-destructive">{metrics.overall.breachedIncidents}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {slaStatuses.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No active SLAs being tracked. All systems operational.
              </AlertDescription>
            </Alert>
          ) : (
            slaStatuses.map(sla => {
              const incident = activeIncidents.find(i => i.id === sla.incidentId)
              if (!incident) return null
              return <SLAStatusCard key={sla.incidentId} sla={sla} incident={incident} />
            })
          )}
        </TabsContent>

        <TabsContent value="at-risk" className="space-y-4">
          {atRiskSLAs.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No SLAs at risk. All incidents are on track.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-warning bg-warning/10">
                <Warning size={20} className="text-warning" />
                <AlertDescription>
                  <strong>{atRiskSLAs.length}</strong> incident{atRiskSLAs.length !== 1 ? 's are' : ' is'} approaching SLA deadline. Expedite resolution to avoid breaches.
                </AlertDescription>
              </Alert>
              {atRiskSLAs.map(sla => {
                const incident = activeIncidents.find(i => i.id === sla.incidentId)
                if (!incident) return null
                return <SLAStatusCard key={sla.incidentId} sla={sla} incident={incident} />
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="breached" className="space-y-4">
          {breachedSLAs.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No SLA breaches. Excellent performance!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-destructive bg-destructive/10">
                <ShieldWarning size={20} className="text-destructive" />
                <AlertDescription>
                  <strong>{breachedSLAs.length}</strong> SLA{breachedSLAs.length !== 1 ? 's have' : ' has'} been breached. Immediate attention and escalation required.
                </AlertDescription>
              </Alert>
              {breachedSLAs.map(sla => {
                const incident = activeIncidents.find(i => i.id === sla.incidentId)
                if (!incident) return null
                return <SLAStatusCard key={sla.incidentId} sla={sla} incident={incident} />
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {breaches.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No SLA breaches recorded. Maintaining excellent compliance!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {unacknowledgedBreaches.length > 0 && (
                <Alert className="border-destructive bg-destructive/10">
                  <Bell size={20} className="text-destructive" weight="bold" />
                  <AlertDescription>
                    <strong>{unacknowledgedBreaches.length}</strong> breach{unacknowledgedBreaches.length !== 1 ? 'es' : ''} require acknowledgment and documentation.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-3">
                {breaches.map(breach => (
                  <BreachCard 
                    key={breach.id} 
                    breach={breach}
                    incident={incidents.find(i => i.id === breach.incidentId)}
                    onAcknowledge={() => acknowledgeBreach(breach.id)}
                    onViewDetails={() => {
                      setSelectedBreach(breach)
                      setShowBreachDetails(true)
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <EscalationWorkflowManager
            rules={rules}
            executions={escalationExecutions}
            onUpdateRule={handleUpdateRule}
            onViewExecution={handleViewExecution}
          />
        </TabsContent>
      </Tabs>

      <EscalationExecutionDetail
        execution={selectedExecution}
        rule={rules.find(r => r.id === selectedExecution?.ruleId)}
        incident={incidents.find(i => i.id === selectedExecution?.incidentId)}
        isOpen={showExecutionDetail}
        onClose={() => {
          setShowExecutionDetail(false)
          setSelectedExecution(null)
        }}
      />

      <Dialog open={showBreachDetails} onOpenChange={setShowBreachDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldWarning size={24} weight="duotone" className="text-destructive" />
              SLA Breach Details
            </DialogTitle>
            <DialogDescription>
              Review and acknowledge this service level agreement breach
            </DialogDescription>
          </DialogHeader>
          {selectedBreach && (
            <BreachDetails 
              breach={selectedBreach}
              incident={incidents.find(i => i.id === selectedBreach.incidentId)}
              onAcknowledge={(notes) => {
                acknowledgeBreach(selectedBreach.id, notes)
                setShowBreachDetails(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SLAStatusCardProps {
  sla: SLAStatus
  incident: Incident
}

function SLAStatusCard({ sla, incident }: SLAStatusCardProps) {
  const statusColor = getSLAStatusColor(sla)

  return (
    <Card className={
      sla.status === 'breached' ? 'border-destructive' : 
      sla.status === 'at-risk' ? 'border-warning' : 
      'border-border'
    }>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{incident.title}</h4>
                <Badge 
                  variant={
                    sla.status === 'breached' ? 'destructive' :
                    sla.status === 'at-risk' ? 'default' : 'outline'
                  }
                  className="text-xs"
                >
                  {sla.status.toUpperCase().replace('-', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {incident.description.substring(0, 100)}...
              </p>
            </div>
            <Badge variant={
              incident.severity === 'critical' ? 'destructive' :
              incident.severity === 'high' ? 'default' : 'secondary'
            }>
              {incident.severity.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer size={14} weight="duotone" />
                <span>Time Remaining</span>
              </div>
              <p className={`text-base font-bold ${statusColor}`}>
                {sla.resolutionBreached ? 'BREACHED' : formatSLATime(sla.timeToResolutionBreach)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target size={14} weight="duotone" />
                <span>Progress</span>
              </div>
              <p className={`text-base font-bold ${statusColor}`}>
                {sla.percentComplete.toFixed(0)}%
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={14} weight="duotone" />
                <span>Elapsed</span>
              </div>
              <p className="text-base font-bold">
                {sla.resolutionTime ? formatSLATime(sla.resolutionTime) : formatSLATime(Date.now() - incident.createdAt)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Resolution SLA Progress</span>
              <span className={`font-bold ${statusColor}`}>
                {sla.status === 'breached' && sla.timeOverBreach ? `+${formatSLATime(sla.timeOverBreach)} over` : ''}
              </span>
            </div>
            <Progress 
              value={Math.min(100, sla.percentComplete)} 
              className="h-2"
            />
          </div>

          {sla.breachType && (
            <Alert className="border-destructive bg-destructive/5">
              <Warning size={16} className="text-destructive" />
              <AlertDescription className="text-xs">
                <strong>Breach Type:</strong> {sla.breachType === 'both' ? 'Response & Resolution' : sla.breachType.charAt(0).toUpperCase() + sla.breachType.slice(1)} deadline exceeded
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface BreachCardProps {
  breach: SLABreach
  incident?: Incident
  onAcknowledge: () => void
  onViewDetails: () => void
}

function BreachCard({ breach, incident, onAcknowledge, onViewDetails }: BreachCardProps) {
  return (
    <Card className={breach.acknowledged ? 'border-border' : 'border-destructive'}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                {breach.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {breach.breachType === 'both' ? 'Response & Resolution' : breach.breachType.charAt(0).toUpperCase() + breach.breachType.slice(1)}
              </Badge>
              {breach.acknowledged ? (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <CheckCircle size={12} className="mr-1" weight="bold" />
                  Acknowledged
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <Bell size={12} className="mr-1" weight="bold" />
                  Requires Action
                </Badge>
              )}
            </div>
            
            <h4 className="font-semibold">{breach.incidentTitle}</h4>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Breached: {new Date(breach.breachedAt).toLocaleString()}</span>
              <span>•</span>
              <span className="text-destructive font-semibold">+{formatSLATime(breach.timeOverBreach)} over deadline</span>
            </div>

            {breach.acknowledged && breach.acknowledgedBy && (
              <p className="text-xs text-muted-foreground">
                Acknowledged by {breach.acknowledgedBy} on {new Date(breach.acknowledgedAt!).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
            {!breach.acknowledged && (
              <Button variant="default" size="sm" onClick={onAcknowledge}>
                <CheckCircle size={16} className="mr-1" weight="bold" />
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface BreachDetailsProps {
  breach: SLABreach
  incident?: Incident
  onAcknowledge: (notes?: string) => void
}

function BreachDetails({ breach, incident, onAcknowledge }: BreachDetailsProps) {
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Incident</p>
          <p className="font-semibold">{breach.incidentTitle}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Severity</p>
          <Badge variant="destructive">{breach.severity.toUpperCase()}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Breach Type</p>
          <p className="font-semibold">{breach.breachType === 'both' ? 'Response & Resolution' : breach.breachType.charAt(0).toUpperCase() + breach.breachType.slice(1)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Time Over Deadline</p>
          <p className="font-semibold text-destructive">{formatSLATime(breach.timeOverBreach)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Breached At</p>
          <p className="font-semibold">{new Date(breach.breachedAt).toLocaleString()}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          {breach.acknowledged ? (
            <Badge variant="secondary" className="bg-success/10 text-success">
              <CheckCircle size={14} className="mr-1" weight="bold" />
              Acknowledged
            </Badge>
          ) : (
            <Badge variant="destructive">Pending Acknowledgment</Badge>
          )}
        </div>
      </div>

      {incident && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Incident Details</p>
            <p className="text-sm text-muted-foreground">{incident.description}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Created: {new Date(incident.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span>Status: {incident.status}</span>
            </div>
          </div>
        </>
      )}

      {!breach.acknowledged && (
        <>
          <Separator />
          <div className="space-y-3">
            <label className="text-sm font-medium">Acknowledgment Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes about this breach..."
              className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm resize-none"
            />
          </div>
          <Button onClick={() => onAcknowledge(notes)} className="w-full">
            <CheckCircle size={18} className="mr-2" weight="bold" />
            Acknowledge Breach
          </Button>
        </>
      )}

      {breach.acknowledged && breach.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Acknowledgment Notes</p>
            <p className="text-sm text-muted-foreground">{breach.notes}</p>
          </div>
        </>
      )}
    </div>
  )
}
