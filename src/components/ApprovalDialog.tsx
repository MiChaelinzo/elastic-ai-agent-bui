import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Warning, CheckCircle, XCircle, Lightning, ShieldWarning } from '@phosphor-icons/react'
import type { Incident, ReasoningStep } from '@/lib/types'

interface ApprovalDialogProps {
  incident: Incident | null
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  isProcessing?: boolean
}

export function ApprovalDialog({
  incident,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing = false
}: ApprovalDialogProps) {
  if (!incident) return null

  const lowestConfidence = incident.lowestConfidence || 0
  const isCritical = incident.severity === 'critical'
  const showWarning = lowestConfidence < 70 || isCritical

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success'
    if (confidence >= 80) return 'text-primary'
    if (confidence >= 70) return 'text-warning'
    return 'text-destructive'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'High Confidence'
    if (confidence >= 80) return 'Good Confidence'
    if (confidence >= 70) return 'Medium Confidence'
    return 'Low Confidence'
  }

  const agentSteps = incident.reasoningSteps.reduce((acc, step) => {
    if (!acc[step.agentType]) {
      acc[step.agentType] = []
    }
    acc[step.agentType].push(step)
    return acc
  }, {} as Record<string, ReasoningStep[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ShieldWarning size={28} weight="duotone" className="text-warning" />
            Human Approval Required
          </DialogTitle>
          <DialogDescription>
            Review agent analysis and approve or reject the proposed solution
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {showWarning && (
              <Alert variant={isCritical ? 'destructive' : 'default'} className="border-warning">
                <Warning size={20} className="text-warning" />
                <AlertDescription>
                  <div className="space-y-2">
                    {lowestConfidence < 70 && (
                      <p>
                        <strong>Low Confidence Detected:</strong> One or more agents reported
                        confidence below the threshold ({lowestConfidence}%). Manual review is
                        required before proceeding.
                      </p>
                    )}
                    {isCritical && (
                      <p>
                        <strong>Critical Incident:</strong> This incident has critical severity.
                        Extra caution is advised before approving automated resolution.
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Incident Details</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Title
                  </div>
                  <div className="font-medium">{incident.title}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Severity
                  </div>
                  <Badge
                    variant={
                      incident.severity === 'critical'
                        ? 'destructive'
                        : incident.severity === 'high'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {incident.severity}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Created
                  </div>
                  <div className="font-mono text-sm">
                    {new Date(incident.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Lowest Confidence
                  </div>
                  <div className={`font-bold font-mono text-lg ${getConfidenceColor(lowestConfidence)}`}>
                    {lowestConfidence}%
                  </div>
                </div>
              </div>
            </div>

            {incident.approvalReason && (
              <Alert>
                <AlertDescription>
                  <strong>Approval Reason:</strong> {incident.approvalReason}
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Agent Analysis Summary</h3>
              <div className="space-y-4">
                {Object.entries(agentSteps).map(([agentType, steps]) => {
                  const lastStep = steps[steps.length - 1]
                  const confidence = lastStep.confidence

                  return (
                    <div key={agentType} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold capitalize">{agentType} Agent</div>
                          <Badge variant="outline" className={getConfidenceColor(confidence)}>
                            {confidence}% - {getConfidenceLabel(confidence)}
                          </Badge>
                        </div>
                      </div>
                      {lastStep.result && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                          {lastStep.result}
                        </div>
                      )}
                      {lastStep.query && (
                        <div className="text-xs font-mono bg-card p-2 rounded border border-border">
                          {lastStep.query}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {incident.proposedSolution && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lightning size={20} weight="duotone" className="text-primary" />
                    Proposed Solution
                  </h3>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm">{incident.proposedSolution}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isProcessing}
            className="gap-2"
          >
            <XCircle size={18} weight="bold" />
            Reject
          </Button>
          <Button onClick={onApprove} disabled={isProcessing} className="gap-2">
            <CheckCircle size={18} weight="bold" />
            Approve & Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
