import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Info } from '@phosphor-icons/react'
import { type BiometricSettings, securityLevelThresholds } from '@/lib/voice-biometrics'

interface BiometricSettingsComponentProps {
  settings: BiometricSettings
  onChange: (settings: BiometricSettings) => void
}

export function BiometricSettingsComponent({
  settings,
  onChange
}: BiometricSettingsComponentProps) {
  const updateSetting = <K extends keyof BiometricSettings>(
    key: K,
    value: BiometricSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const currentThreshold = securityLevelThresholds[settings.securityLevel]

  return (
    <div className="space-y-6">
      <Alert>
        <Info size={20} />
        <AlertDescription>
          Voice biometrics provides secure speaker recognition by analyzing unique vocal characteristics.
          Configure security settings to balance convenience with protection.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={20} weight="duotone" />
            Core Security Settings
          </CardTitle>
          <CardDescription>
            Control voice biometric authentication behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enabled">Enable Voice Biometrics</Label>
              <p className="text-sm text-muted-foreground">
                Require voice authentication for secure operations
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityLevel">Security Level</Label>
            <Select
              value={settings.securityLevel}
              onValueChange={(value) => updateSetting('securityLevel', value as 'low' | 'medium' | 'high')}
            >
              <SelectTrigger id="securityLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  Low (65% threshold) - More convenient
                </SelectItem>
                <SelectItem value="medium">
                  Medium (75% threshold) - Balanced
                </SelectItem>
                <SelectItem value="high">
                  High (85% threshold) - Maximum security
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current match threshold: {(currentThreshold * 100).toFixed(0)}%
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="verificationThreshold">Custom Verification Threshold</Label>
              <span className="text-sm font-mono">{(settings.verificationThreshold * 100).toFixed(0)}%</span>
            </div>
            <Slider
              id="verificationThreshold"
              min={50}
              max={95}
              step={5}
              value={[settings.verificationThreshold * 100]}
              onValueChange={([value]) => updateSetting('verificationThreshold', value / 100)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum similarity score required for successful verification
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="enrollmentSamples">Enrollment Samples</Label>
              <span className="text-sm font-mono">{settings.enrollmentSamples}</span>
            </div>
            <Slider
              id="enrollmentSamples"
              min={3}
              max={10}
              step={1}
              value={[settings.enrollmentSamples]}
              onValueChange={([value]) => updateSetting('enrollmentSamples', value)}
            />
            <p className="text-xs text-muted-foreground">
              Number of voice samples required during enrollment
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <span className="text-sm font-mono">{Math.round(settings.sessionTimeout / 60000)}</span>
            </div>
            <Slider
              id="sessionTimeout"
              min={5}
              max={120}
              step={5}
              value={[settings.sessionTimeout / 60000]}
              onValueChange={([value]) => updateSetting('sessionTimeout', value * 60000)}
            />
            <p className="text-xs text-muted-foreground">
              How long a voice authentication session remains valid
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
          <CardDescription>
            Enhanced security and learning capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="continuousVerification">Continuous Verification</Label>
              <p className="text-sm text-muted-foreground">
                Re-verify speaker identity during extended sessions
              </p>
            </div>
            <Switch
              id="continuousVerification"
              checked={settings.continuousVerification}
              onCheckedChange={(checked) => updateSetting('continuousVerification', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="adaptiveLearning">Adaptive Learning</Label>
              <p className="text-sm text-muted-foreground">
                Update voice profile with successful verifications
              </p>
            </div>
            <Switch
              id="adaptiveLearning"
              checked={settings.adaptiveLearning}
              onCheckedChange={(checked) => updateSetting('adaptiveLearning', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="antiSpoofing">Anti-Spoofing Protection</Label>
              <p className="text-sm text-muted-foreground">
                Detect and reject synthetic or replayed voices
              </p>
            </div>
            <Switch
              id="antiSpoofing"
              checked={settings.antiSpoofing}
              onCheckedChange={(checked) => updateSetting('antiSpoofing', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="livenessDetection">Liveness Detection</Label>
              <p className="text-sm text-muted-foreground">
                Verify the speaker is present and speaking live
              </p>
            </div>
            <Switch
              id="livenessDetection"
              checked={settings.livenessDetection}
              onCheckedChange={(checked) => updateSetting('livenessDetection', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="requirePassphrase">Require Passphrase</Label>
              <p className="text-sm text-muted-foreground">
                Enforce specific phrases during verification
              </p>
            </div>
            <Switch
              id="requirePassphrase"
              checked={settings.requirePassphrase}
              onCheckedChange={(checked) => updateSetting('requirePassphrase', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
