import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Lightning, 
  CheckCircle, 
  XCircle, 
  Warning,
  ArrowRight,
  Bell,
  TrendUp,
  ShieldCheck,
  Play,
  Clock,
  Users
} from '@phosphor-icons/react'
import type { 
  EscalationRule, 
  EscalationExecution, 
  EscalationActionType 
} from '@/lib/sla-management'

interface EscalationWorkflowManagerProps {
  rules: EscalationRule[]
  executions: EscalationExecution[]
  onUpdateRule: (ruleId: string, enabled: boolean) => void
  onViewExecution?: (execution: EscalationExecution) => void
}

const actionIcons: Record<EscalationActionType, React.ReactNode> = {
  notify_team: <Bell size={16} weight="duotone" />,
  upgrade_severity: <TrendUp size={16} weight="duotone" />,
  assign_senior: <Users size={16} weight="duotone" />,
  trigger_workflow: <Lightning size={16} weight="duotone" />,
  page_oncall: <Warning size={16} weight="duotone" />,
  create_ticket: <ShieldCheck size={16} weight="duotone" />,
  send_webhook: <ArrowRight size={16} weight="duotone" />,
  auto_approve: <CheckCircle size={16} weight="duotone" />
}

const actionLabels: Record<EscalationActionType, string> = {
  notify_team: 'Notify Team',
  upgrade_severity: 'Upgrade Severity',
  assign_senior: 'Assign Senior Engineer',
  trigger_workflow: 'Trigger Workflow',
  page_oncall: 'Page On-Call',
  create_ticket: 'Create Ticket',
  send_webhook: 'Send Webhook',
  auto_approve: 'Auto-Approve'
}

export function EscalationWorkflowManager({
  rules,
  executions,
  onUpdateRule,
  onViewExecution
}: EscalationWorkflowManagerProps) {
  const [selectedRule, setSelectedRule] = useState<EscalationRule | null>(null)

  const recentExecutions = [...executions]
    .sort((a, b) => b.triggeredAt - a.triggeredAt)
    .slice(0, 10)

  const executionsByRule = rules.map(rule => ({
    rule,
    executions: executions.filter(e => e.ruleId === rule.id),
    successRate: calculateSuccessRate(executions.filter(e => e.ruleId === rule.id))
  }))

  const totalExecutions = executions.length
  const successfulExecutions = executions.filter(e => e.status === 'completed').length
  const failedExecutions = executions.filter(e => e.status === 'failed').length
  const overallSuccessRate = totalExecutions > 0 
    ? (successfulExecutions / totalExecutions) * 100 
    : 100

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rules.length}</div>
            <Badge variant="secondary" className="mt-2">
              {rules.filter(r => r.enabled).length} active
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalExecutions}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="bg-success text-success-foreground">
                {successfulExecutions} success
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallSuccessRate.toFixed(1)}%</div>
            <Progress value={overallSuccessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{failedExecutions}</div>
            <Badge variant="destructive" className="mt-2">
              Requires attention
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Escalation Rules</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.length === 0 ? (
            <Alert>
              <Lightning size={20} className="text-primary" />
              <AlertDescription>
                No escalation rules configured. Add rules to automate responses to SLA breaches.
              </AlertDescription>
            </Alert>
          ) : (
            rules.map(rule => (
              <Card 
                key={rule.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedRule?.id === rule.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedRule(rule)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                        <Badge variant="outline">
                          {rule.trigger}
                        </Badge>
                      </div>
                      <CardDescription className="mt-2">{rule.description}</CardDescription>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(enabled) => {
                        onUpdateRule(rule.id, enabled)
                        if (!enabled && selectedRule?.id === rule.id) {
                          setSelectedRule(null)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Conditions</Label>
                      <div className="flex flex-wrap gap-2">
                        {rule.conditions.severities && (
                          <Badge variant="secondary">
                            Severities: {rule.conditions.severities.join(', ')}
                          </Badge>
                        )}
                        {rule.conditions.breachType && (
                          <Badge variant="secondary">
                            Breach: {rule.conditions.breachType.join(', ')}
                          </Badge>
                        )}
                        {rule.conditions.atRiskThreshold && (
                          <Badge variant="secondary">
                            At-risk: ≥{rule.conditions.atRiskThreshold}%
                          </Badge>
                        )}
                        {rule.conditions.timeOverThreshold && (
                          <Badge variant="secondary">
                            Time: {formatDuration(rule.conditions.timeOverThreshold)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Actions ({rule.actions.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {rule.actions
                          .sort((a, b) => a.priority - b.priority)
                          .map((action, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <Badge variant="outline" className="gap-1">
                                <span className="text-xs text-muted-foreground">#{action.priority}</span>
                                {actionIcons[action.type]}
                                {actionLabels[action.type]}
                              </Badge>
                              {idx < rule.actions.length - 1 && (
                                <ArrowRight size={14} className="text-muted-foreground" />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    {(rule.cooldownPeriod || rule.maxExecutions) && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {rule.cooldownPeriod && (
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            Cooldown: {formatDuration(rule.cooldownPeriod)}
                          </div>
                        )}
                        {rule.maxExecutions && (
                          <div className="flex items-center gap-1">
                            <Play size={14} />
                            Max: {rule.maxExecutions}x
                          </div>
                        )}
                      </div>
                    )}

                    {executionsByRule.find(r => r.rule.id === rule.id) && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Executions: {executionsByRule.find(r => r.rule.id === rule.id)!.executions.length}
                          </span>
                          <span className={`font-semibold ${
                            executionsByRule.find(r => r.rule.id === rule.id)!.successRate >= 90
                              ? 'text-success'
                              : executionsByRule.find(r => r.rule.id === rule.id)!.successRate >= 70
                              ? 'text-warning'
                              : 'text-destructive'
                          }`}>
                            {executionsByRule.find(r => r.rule.id === rule.id)!.successRate.toFixed(1)}% success
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {recentExecutions.length === 0 ? (
            <Alert>
              <CheckCircle size={20} className="text-success" />
              <AlertDescription>
                No escalation workflows have been executed yet.
              </AlertDescription>
            </Alert>
          ) : (
            recentExecutions.map(execution => (
              <Card 
                key={execution.id}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onViewExecution?.(execution)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          execution.status === 'completed' ? 'default' :
                          execution.status === 'failed' ? 'destructive' :
                          execution.status === 'executing' ? 'secondary' :
                          'outline'
                        }>
                          {execution.status === 'completed' && <CheckCircle size={14} className="mr-1" />}
                          {execution.status === 'failed' && <XCircle size={14} className="mr-1" />}
                          {execution.status}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          {new Date(execution.triggeredAt).toLocaleString()}
                        </span>
                        <Badge variant="outline">{execution.trigger}</Badge>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-semibold">Rule:</span>{' '}
                        {rules.find(r => r.id === execution.ruleId)?.name || execution.ruleId}
                      </div>

                      <div>
                        <Label className="text-xs font-semibold mb-1 block">Actions Executed</Label>
                        <div className="flex flex-wrap gap-1">
                          {execution.actionsExecuted.map((action, idx) => (
                            <Badge 
                              key={idx}
                              variant={action.success ? 'default' : 'destructive'}
                              className="text-xs gap-1"
                            >
                              {action.success ? (
                                <CheckCircle size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              {actionLabels[action.actionType]}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {execution.completedAt && (
                        <div className="text-xs text-muted-foreground">
                          Duration: {execution.completedAt - execution.triggeredAt}ms
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {executionsByRule.map(({ rule, executions: ruleExecutions, successRate }) => (
            <Card key={rule.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{rule.name}</span>
                  <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Executions</div>
                      <div className="text-2xl font-bold">{ruleExecutions.length}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className={`text-2xl font-bold ${
                        successRate >= 90 ? 'text-success' :
                        successRate >= 70 ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {successRate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                      <div className="text-2xl font-bold text-destructive">
                        {ruleExecutions.filter(e => e.status === 'failed').length}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Progress value={successRate} />
                  </div>

                  {ruleExecutions.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Last execution: {new Date(Math.max(...ruleExecutions.map(e => e.triggeredAt))).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function calculateSuccessRate(executions: EscalationExecution[]): number {
  if (executions.length === 0) return 100
  const successful = executions.filter(e => e.status === 'completed').length
  return (successful / executions.length) * 100
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}
