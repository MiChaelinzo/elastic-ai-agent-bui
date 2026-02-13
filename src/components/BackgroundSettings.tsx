import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkle, Lightning, Graph, GridFour } from '@phosphor-icons/react'
import type { BackgroundSettings } from '@/lib/types'

interface BackgroundSettingsComponentProps {
  settings: BackgroundSettings
  onChange: (settings: BackgroundSettings) => void
}

export function BackgroundSettingsComponent({ settings, onChange }: BackgroundSettingsComponentProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle size={20} weight="duotone" className="text-primary" />
            Particle Effects
          </CardTitle>
          <CardDescription>
            Control the density and movement speed of background particles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="particle-density" className="text-sm font-medium">
                Particle Density
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.particleDensity}%
              </span>
            </div>
            <Slider
              id="particle-density"
              min={0}
              max={200}
              step={10}
              value={[settings.particleDensity]}
              onValueChange={([value]) =>
                onChange({ ...settings, particleDensity: value })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adjust the number of ambient particles in the background
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="particle-speed" className="text-sm font-medium">
                Particle Speed
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.particleSpeed}%
              </span>
            </div>
            <Slider
              id="particle-speed"
              min={0}
              max={200}
              step={10}
              value={[settings.particleSpeed]}
              onValueChange={([value]) =>
                onChange({ ...settings, particleSpeed: value })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Control how fast particles drift across the screen
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Graph size={20} weight="duotone" className="text-accent" />
            Agent Node Network
          </CardTitle>
          <CardDescription>
            Configure the animated agent node visualization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="node-speed" className="text-sm font-medium">
                Node Movement Speed
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.nodeSpeed}%
              </span>
            </div>
            <Slider
              id="node-speed"
              min={0}
              max={200}
              step={10}
              value={[settings.nodeSpeed]}
              onValueChange={([value]) =>
                onChange({ ...settings, nodeSpeed: value })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adjust the velocity of agent nodes floating in the background
            </p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="show-connections" className="text-sm font-medium">
                Show Connections
              </Label>
              <p className="text-xs text-muted-foreground">
                Display connecting lines between nearby nodes
              </p>
            </div>
            <Switch
              id="show-connections"
              checked={settings.showConnections}
              onCheckedChange={(checked) =>
                onChange({ ...settings, showConnections: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="show-data-flows" className="text-sm font-medium">
                Show Data Flows
              </Label>
              <p className="text-xs text-muted-foreground">
                Animate data packets moving between nodes
              </p>
            </div>
            <Switch
              id="show-data-flows"
              checked={settings.showDataFlows}
              onCheckedChange={(checked) =>
                onChange({ ...settings, showDataFlows: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GridFour size={20} weight="duotone" className="text-muted-foreground" />
            Background Grid
          </CardTitle>
          <CardDescription>
            Toggle the subtle grid pattern overlay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="space-y-1">
              <Label htmlFor="show-grid" className="text-sm font-medium">
                Show Grid
              </Label>
              <p className="text-xs text-muted-foreground">
                Display a faint grid pattern in the background
              </p>
            </div>
            <Switch
              id="show-grid"
              checked={settings.showGrid}
              onCheckedChange={(checked) =>
                onChange({ ...settings, showGrid: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
