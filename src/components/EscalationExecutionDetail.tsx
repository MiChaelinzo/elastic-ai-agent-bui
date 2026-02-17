import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Clock, ArrowRight, Lightning } from '@phosphor-icons/react'
import type { EscalationExecution, EscalationRule, EscalationActionType } from '@/lib/sla-management'
import type { Incident } from '@/lib/types'

interface EscalationExecutionDetailProps {
  execution: EscalationExecution | null
  rule: EscalationRule | undefined
  incident: Incident | undefined
  isOpen: boolean
  onClose: () => void
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

export function EscalationExecutionDetail({
  execution,
  rule,
  incident,
  isOpen,
  onClose
}: EscalationExecutionDetailProps) {
  if (!execution) return null

  const duration = execution.completedAt 
    ? execution.completedAt - execution.triggeredAt 
    : Date.now() - execution.triggeredAt

  const successfulActions = execution.actionsExecuted.filter(a => a.success).length
  const failedActions = execution.actionsExecuted.filter(a => !a.success).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightning size={24} weight="duotone" className="text-primary" />
            Escalation Execution Details
          </DialogTitle>
          <DialogDescription>
            Execution ID: {execution.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={
                  execution.status === 'completed' ? 'default' :
                  execution.status === 'failed' ? 'destructive' :
                  'secondary'
                } className="text-lg px-3 py-1">
                  {execution.status === 'completed' && <CheckCircle size={18} className="mr-2" />}
                  {execution.status === 'failed' && <XCircle size={18} className="mr-2" />}
                  {execution.status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trigger</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {execution.trigger}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-muted-foreground" />
                  <span className="text-lg font-semibold">{duration}ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-success text-success-foreground">
                    {successfulActions} success
                  </Badge>
                  {failedActions > 0 && (
                    <Badge variant="destructive">
                      {failedActions} failed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {rule && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Escalation Rule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">{rule.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rule.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {incident && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Incident</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{incident.title}</span>
                    <Badge variant={
                      incident.severity === 'critical' ? 'destructive' :
                      incident.severity === 'high' ? 'default' :
                      'secondary'
                    }>
                      {incident.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {incident.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>Execution triggered at {new Date(execution.triggeredAt).toLocaleString()}</span>
                </div>

                <div className="space-y-3 pl-6 border-l-2 border-border">
                  {execution.actionsExecuted.map((action, idx) => (
                    <div key={idx} className="relative space-y-2 pb-4">
                      <div className="absolute -left-[1.6rem] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        {action.success ? (
                          <CheckCircle size={10} className="text-success" weight="fill" />
                        ) : (
                          <XCircle size={10} className="text-destructive" weight="fill" />
                        )}
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={action.success ? 'default' : 'destructive'}>
                              {actionLabels[action.actionType]}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(action.executedAt).toLocaleTimeString()}
                            </span>
                          </div>

                          {action.result && (
                            <div className="text-sm text-muted-foreground">
                              {action.result}
                            </div>
                          )}

                          {action.error && (
                            <Alert variant="destructive" className="mt-2">
                              <XCircle size={16} />
                              <AlertDescription className="text-xs">
                                {action.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {execution.completedAt && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground pt-2 border-t">
                    <CheckCircle size={16} className={execution.status === 'completed' ? 'text-success' : 'text-destructive'} />
                    <span>
                      Execution {execution.status} at {new Date(execution.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
