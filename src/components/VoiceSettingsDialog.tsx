import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { VoiceRecognitionSettings } from '@/lib/voice-commands'
import { Microphone, SpeakerHigh, Sliders } from '@phosphor-icons/react'

interface VoiceSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  settings: VoiceRecognitionSettings
  onChange: (settings: VoiceRecognitionSettings) => void
}

export function VoiceSettingsDialog({
  isOpen,
  onClose,
  settings,
  onChange
}: VoiceSettingsDialogProps) {
  const updateSetting = <K extends keyof VoiceRecognitionSettings>(
    key: K,
    value: VoiceRecognitionSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Microphone size={24} weight="duotone" className="text-primary" />
            Voice Command Settings
          </DialogTitle>
          <DialogDescription>
            Configure voice recognition and command execution preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enabled" className="text-base font-semibold">
                  Enable Voice Commands
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activate voice recognition for hands-free operation
                </p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSetting('enabled', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="continuous" className="text-base font-semibold">
                  Continuous Listening
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep listening for commands continuously
                </p>
              </div>
              <Switch
                id="continuous"
                checked={settings.continuous}
                onCheckedChange={(checked) => updateSetting('continuous', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="voiceFeedback" className="text-base font-semibold flex items-center gap-2">
                  <SpeakerHigh size={18} weight="duotone" />
                  Voice Feedback
                </Label>
                <p className="text-sm text-muted-foreground">
                  Speak command confirmations aloud
                </p>
              </div>
              <Switch
                id="voiceFeedback"
                checked={settings.voiceFeedback}
                onCheckedChange={(checked) => updateSetting('voiceFeedback', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoExecute" className="text-base font-semibold">
                  Auto Execute Commands
                </Label>
                <p className="text-sm text-muted-foreground">
                  Execute commands immediately without confirmation
                </p>
              </div>
              <Switch
                id="autoExecute"
                checked={settings.autoExecute}
                onCheckedChange={(checked) => updateSetting('autoExecute', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="interimResults" className="text-base font-semibold">
                  Show Interim Results
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display speech recognition in real-time
                </p>
              </div>
              <Switch
                id="interimResults"
                checked={settings.interimResults}
                onCheckedChange={(checked) => updateSetting('interimResults', checked)}
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} weight="duotone" />
                <Label className="text-base font-semibold">Recognition Settings</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                    <SelectItem value="it-IT">Italian</SelectItem>
                    <SelectItem value="ja-JP">Japanese</SelectItem>
                    <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wakeWord">Wake Word (Optional)</Label>
                <Input
                  id="wakeWord"
                  placeholder="e.g., elastic, computer, assistant"
                  value={settings.wakeWord || ''}
                  onChange={(e) => updateSetting('wakeWord', e.target.value || undefined)}
                />
                <p className="text-xs text-muted-foreground">
                  Commands starting with this word will have higher priority
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidenceThreshold">
                    Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%
                  </Label>
                </div>
                <Slider
                  id="confidenceThreshold"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={[settings.confidenceThreshold]}
                  onValueChange={([value]) => updateSetting('confidenceThreshold', value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum confidence level required to execute commands
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxAlternatives">
                    Max Alternatives: {settings.maxAlternatives}
                  </Label>
                </div>
                <Slider
                  id="maxAlternatives"
                  min={1}
                  max={5}
                  step={1}
                  value={[settings.maxAlternatives]}
                  onValueChange={([value]) => updateSetting('maxAlternatives', value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Number of alternative recognition results to consider
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
