import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChartLine, Clock, Calendar, TrendUp } from '@phosphor-icons/react'
import type { IncidentPattern } from '@/lib/predictive-analytics'

interface PatternAnalysisProps {
  patterns: IncidentPattern[]
  onPatternClick?: (pattern: IncidentPattern) => void
}

export function PatternAnalysis({ patterns, onPatternClick }: PatternAnalysisProps) {
  if (patterns.length === 0) {
    return null
  }

  const topPatterns = patterns.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine size={24} weight="duotone" className="text-primary" />
          Incident Patterns
          <Badge variant="secondary" className="ml-auto">
            {patterns.length} Detected
          </Badge>
        </CardTitle>
        <CardDescription>
          Recurring patterns identified from historical incident data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topPatterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            onClick={onPatternClick}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface PatternCardProps {
  pattern: IncidentPattern
  onClick?: (pattern: IncidentPattern) => void
}

function PatternCard({ pattern, onClick }: PatternCardProps) {
  const getSeverityColor = () => {
    switch (pattern.severity) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5'
      case 'high':
        return 'border-l-warning bg-warning/5'
      case 'medium':
        return 'border-l-primary bg-primary/5'
      case 'low':
        return 'border-l-muted-foreground bg-muted/50'
    }
  }

  const formatInterval = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    return '<1h'
  }

  const peakHour = pattern.timeOfDayDistribution.indexOf(Math.max(...pattern.timeOfDayDistribution))
  const peakDay = pattern.dayOfWeekDistribution.indexOf(Math.max(...pattern.dayOfWeekDistribution))
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const frequencyScore = Math.min(100, (pattern.frequency / 10) * 100)

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${getSeverityColor()} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onClick?.(pattern)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm capitalize">{pattern.type}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <TrendUp size={14} weight="duotone" />
              {pattern.frequency} occurrences
            </div>
          </div>
          <Badge variant="outline" className="flex-shrink-0">
            {pattern.severity}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pattern Strength</span>
            <span className="font-mono font-semibold">{Math.round(frequencyScore)}%</span>
          </div>
          <Progress value={frequencyScore} className="h-1.5" />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} weight="duotone" />
              Interval
            </div>
            <div className="text-xs font-semibold">
              {pattern.averageInterval > 0 ? formatInterval(pattern.averageInterval) : 'N/A'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} weight="duotone" />
              Peak Hour
            </div>
            <div className="text-xs font-semibold">
              {peakHour}:00
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={12} weight="duotone" />
              Peak Day
            </div>
            <div className="text-xs font-semibold">
              {dayNames[peakDay]}
            </div>
          </div>
        </div>

        {pattern.seasonality && (
          <div className="pt-2 border-t border-border/50">
            <Badge variant="secondary" className="text-xs">
              {pattern.seasonality} pattern
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
