import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sliders, Sparkle, Info } from '@phosphor-icons/react'
import type { AnomalyThresholds } from '@/lib/anomaly-detection'
import { sensitivityPresets } from '@/lib/anomaly-detection'

interface AnomalyThresholdSettingsProps {
  thresholds: AnomalyThresholds
  onChange: (thresholds: AnomalyThresholds) => void
}

export function AnomalyThresholdSettings({ thresholds, onChange }: AnomalyThresholdSettingsProps) {
  const handlePresetChange = (preset: string) => {
    const presetValues = sensitivityPresets[preset]
    if (presetValues) {
      onChange({ ...thresholds, ...presetValues })
    }
  }

  const handleReset = () => {
    onChange({
      ...thresholds,
      ...sensitivityPresets.medium
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Sliders size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <CardTitle>Anomaly Detection Thresholds</CardTitle>
            <CardDescription>
              Configure sensitivity and detection parameters for each algorithm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info size={20} />
          <AlertDescription>
            <strong>Tip:</strong> Lower thresholds increase sensitivity (more anomalies detected). 
            Higher thresholds reduce false positives but may miss subtle anomalies.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sensitivity Preset</Label>
            <Badge variant="outline">{thresholds.sensitivityLevel}</Badge>
          </div>
          <Select value={thresholds.sensitivityLevel} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Low Sensitivity</span>
                  <span className="text-xs text-muted-foreground">Fewer false positives, may miss subtle anomalies</span>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Medium Sensitivity</span>
                  <span className="text-xs text-muted-foreground">Balanced detection - recommended for most use cases</span>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex flex-col items-start">
                  <span className="font-medium">High Sensitivity</span>
                  <span className="text-xs text-muted-foreground">Detects more anomalies, some false positives expected</span>
                </div>
              </SelectItem>
              <SelectItem value="critical">
                <div className="flex flex-col items-start">
                  <span className="font-medium">Critical Sensitivity</span>
                  <span className="text-xs text-muted-foreground">Maximum detection, investigate all deviations</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm">Advanced Algorithm Parameters</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="zscore-threshold">Z-Score Threshold</Label>
              <span className="text-sm font-mono text-muted-foreground">{thresholds.zscoreThreshold.toFixed(1)}σ</span>
            </div>
            <Slider
              id="zscore-threshold"
              min={1}
              max={5}
              step={0.1}
              value={[thresholds.zscoreThreshold]}
              onValueChange={([value]) => onChange({ ...thresholds, zscoreThreshold: value })}
            />
            <p className="text-xs text-muted-foreground">
              Number of standard deviations from mean to flag as anomaly
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="iqr-multiplier">IQR Multiplier</Label>
              <span className="text-sm font-mono text-muted-foreground">{thresholds.iqrMultiplier.toFixed(1)}×</span>
            </div>
            <Slider
              id="iqr-multiplier"
              min={0.5}
              max={3}
              step={0.1}
              value={[thresholds.iqrMultiplier]}
              onValueChange={([value]) => onChange({ ...thresholds, iqrMultiplier: value })}
            />
            <p className="text-xs text-muted-foreground">
              Multiplier for interquartile range bounds (Tukey's fence method)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mad-multiplier">MAD Multiplier</Label>
              <span className="text-sm font-mono text-muted-foreground">{thresholds.madMultiplier.toFixed(1)}×</span>
            </div>
            <Slider
              id="mad-multiplier"
              min={1}
              max={6}
              step={0.1}
              value={[thresholds.madMultiplier]}
              onValueChange={([value]) => onChange({ ...thresholds, madMultiplier: value })}
            />
            <p className="text-xs text-muted-foreground">
              Median Absolute Deviation multiplier (robust to outliers)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="isolation-threshold">Isolation Score Threshold</Label>
              <span className="text-sm font-mono text-muted-foreground">{thresholds.isolationThreshold.toFixed(2)}</span>
            </div>
            <Slider
              id="isolation-threshold"
              min={0.3}
              max={0.9}
              step={0.05}
              value={[thresholds.isolationThreshold]}
              onValueChange={([value]) => onChange({ ...thresholds, isolationThreshold: value })}
            />
            <p className="text-xs text-muted-foreground">
              Isolation Forest anomaly score threshold (0-1, higher = more isolated)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ensemble-agreement">Ensemble Agreement</Label>
              <span className="text-sm font-mono text-muted-foreground">{Math.round(thresholds.ensembleAgreement * 100)}%</span>
            </div>
            <Slider
              id="ensemble-agreement"
              min={0.25}
              max={1}
              step={0.05}
              value={[thresholds.ensembleAgreement]}
              onValueChange={([value]) => onChange({ ...thresholds, ensembleAgreement: value })}
            />
            <p className="text-xs text-muted-foreground">
              Percentage of algorithms that must agree for ensemble detection
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="min-data-points">Minimum Data Points</Label>
              <span className="text-sm font-mono text-muted-foreground">{thresholds.minDataPoints}</span>
            </div>
            <Slider
              id="min-data-points"
              min={5}
              max={50}
              step={5}
              value={[thresholds.minDataPoints]}
              onValueChange={([value]) => onChange({ ...thresholds, minDataPoints: value })}
            />
            <p className="text-xs text-muted-foreground">
              Minimum number of data points required for reliable detection
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            <Sparkle size={18} className="mr-2" />
            Reset to Defaults
          </Button>
        </div>

        <Alert className="border-primary">
          <Info size={20} className="text-primary" />
          <AlertDescription className="text-xs">
            <strong>Current Configuration:</strong> Using {thresholds.sensitivityLevel} sensitivity with ensemble requiring {Math.round(thresholds.ensembleAgreement * 100)}% algorithm agreement. 
            Z-Score: {thresholds.zscoreThreshold.toFixed(1)}σ, IQR: {thresholds.iqrMultiplier.toFixed(1)}×, MAD: {thresholds.madMultiplier.toFixed(1)}×
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
