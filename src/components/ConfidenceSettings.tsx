import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Warning } from '@phosphor-icons/react'
import type { ConfidenceSettings } from '@/lib/types'

interface ConfidenceSettingsProps {
  settings: ConfidenceSettings
  onChange: (settings: ConfidenceSettings) => void
}

export function ConfidenceSettings({ settings, onChange }: ConfidenceSettingsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={24} weight="duotone" className="text-primary" />
            Agent Confidence Thresholds
          </CardTitle>
          <CardDescription>
            Configure when agents require human approval based on their confidence levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="min-confidence">Minimum Confidence Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Agents must meet this confidence level to proceed automatically
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-primary">
                  {settings.minConfidenceThreshold}%
                </div>
              </div>
            </div>
            <Slider
              id="min-confidence"
              min={50}
              max={99}
              step={1}
              value={[settings.minConfidenceThreshold]}
              onValueChange={([value]) =>
                onChange({ ...settings, minConfidenceThreshold: value })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% - Low confidence</span>
              <span>75% - Medium confidence</span>
              <span>99% - High confidence</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="critical-threshold">Critical Incident Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Higher threshold required for critical severity incidents
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-destructive">
                  {settings.criticalIncidentThreshold}%
                </div>
              </div>
            </div>
            <Slider
              id="critical-threshold"
              min={70}
              max={99}
              step={1}
              value={[settings.criticalIncidentThreshold]}
              onValueChange={([value]) =>
                onChange({ ...settings, criticalIncidentThreshold: value })
              }
              className="w-full"
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-approval">Require Approval Below Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Block automatic execution when confidence is below threshold
                </p>
              </div>
              <Switch
                id="require-approval"
                checked={settings.requireApprovalBelowThreshold}
                onCheckedChange={(checked) =>
                  onChange({ ...settings, requireApprovalBelowThreshold: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-execute">Auto-Execute Above Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically execute solutions when confidence is high enough
                </p>
              </div>
              <Switch
                id="auto-execute"
                checked={settings.autoExecuteAboveThreshold}
                onCheckedChange={(checked) =>
                  onChange({ ...settings, autoExecuteAboveThreshold: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notify-low">Notify on Low Confidence</Label>
                <p className="text-sm text-muted-foreground">
                  Send alerts when agents report low confidence scores
                </p>
              </div>
              <Switch
                id="notify-low"
                checked={settings.notifyOnLowConfidence}
                onCheckedChange={(checked) =>
                  onChange({ ...settings, notifyOnLowConfidence: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {settings.minConfidenceThreshold < 70 && (
        <Alert variant="destructive">
          <Warning size={20} />
          <AlertDescription>
            <strong>Warning:</strong> Setting confidence threshold below 70% may result in
            unreliable automated actions. Consider requiring manual approval for lower
            confidence decisions.
          </AlertDescription>
        </Alert>
      )}

      {settings.autoExecuteAboveThreshold && !settings.requireApprovalBelowThreshold && (
        <Alert>
          <Warning size={20} className="text-warning" />
          <AlertDescription>
            Auto-execution is enabled but approval enforcement is disabled. Some low-confidence
            actions may execute without review.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
