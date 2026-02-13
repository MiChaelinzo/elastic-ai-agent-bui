import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ListBullets, Info } from '@phosphor-icons/react'
import type { PriorityQueueSettings } from '@/lib/priority-queue'

interface PriorityQueueSettingsProps {
  settings: PriorityQueueSettings
  onChange: (settings: PriorityQueueSettings) => void
}

export function PriorityQueueSettingsComponent({ settings, onChange }: PriorityQueueSettingsProps) {
  const updateSetting = <K extends keyof PriorityQueueSettings>(
    key: K,
    value: PriorityQueueSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      <Alert>
        <ListBullets size={20} />
        <AlertDescription>
          Configure how incidents are prioritized and escalated. Priority queue ensures critical issues are handled first with automatic escalation for time-sensitive incidents.
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Priority Queue Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label>Enable Auto-Prioritization</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically calculate incident priority based on severity, age, and status
                </p>
              </div>
              <Switch
                checked={settings.enableAutoPrioritization}
                onCheckedChange={(checked) => updateSetting('enableAutoPrioritization', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label>Enable Age-Based Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Increase priority as incidents wait longer in the queue
                </p>
              </div>
              <Switch
                checked={settings.enableAgeBasedPriority}
                onCheckedChange={(checked) => updateSetting('enableAgeBasedPriority', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label>Enable SLA Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Track and visualize SLA deadlines for each incident based on severity
                </p>
              </div>
              <Switch
                checked={settings.enableSLATracking}
                onCheckedChange={(checked) => updateSetting('enableSLATracking', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Auto-Escalation Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex-1">
                <Label>Enable Auto-Escalation</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically escalate incidents that exceed time thresholds
                </p>
              </div>
              <Switch
                checked={settings.enableAutoEscalation}
                onCheckedChange={(checked) => updateSetting('enableAutoEscalation', checked)}
              />
            </div>

            {settings.enableAutoEscalation && (
              <>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="critical-escalation">
                      Critical Escalation (minutes)
                    </Label>
                    <Input
                      id="critical-escalation"
                      type="number"
                      min="1"
                      value={settings.criticalEscalationMinutes}
                      onChange={(e) => updateSetting('criticalEscalationMinutes', parseInt(e.target.value) || 5)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Escalate critical incidents after this many minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="high-escalation">
                      High Escalation (minutes)
                    </Label>
                    <Input
                      id="high-escalation"
                      type="number"
                      min="1"
                      value={settings.highEscalationMinutes}
                      onChange={(e) => updateSetting('highEscalationMinutes', parseInt(e.target.value) || 15)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Escalate high-priority incidents after this many minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medium-escalation">
                      Medium Escalation (minutes)
                    </Label>
                    <Input
                      id="medium-escalation"
                      type="number"
                      min="1"
                      value={settings.mediumEscalationMinutes}
                      onChange={(e) => updateSetting('mediumEscalationMinutes', parseInt(e.target.value) || 30)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Escalate medium-priority incidents after this many minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="escalation-interval">
                      Standard Interval (minutes)
                    </Label>
                    <Input
                      id="escalation-interval"
                      type="number"
                      min="1"
                      value={settings.escalationIntervalMinutes}
                      onChange={(e) => updateSetting('escalationIntervalMinutes', parseInt(e.target.value) || 15)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default escalation interval for low-priority incidents
                    </p>
                  </div>
                </div>

                <Alert className="border-primary">
                  <Info size={20} className="text-primary" />
                  <AlertDescription>
                    After 3 escalations, incidents will automatically upgrade to the next severity level (e.g., Medium → High → Critical).
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
