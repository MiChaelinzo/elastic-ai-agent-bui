import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkle, TrendUp, Warning, ChartLine, CheckCircle, Clock } from '@phosphor-icons/react'
import type { PredictiveInsight } from '@/lib/predictive-analytics'

interface PredictiveInsightsProps {
  insights: PredictiveInsight[]
  onInsightClick?: (insight: PredictiveInsight) => void
}

export function PredictiveInsights({ insights, onInsightClick }: PredictiveInsightsProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="duotone" className="text-primary" />
            Predictive Insights
          </CardTitle>
          <CardDescription>
            AI-powered predictions based on historical patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Sparkle size={20} className="text-muted-foreground" />
            <AlertDescription>
              No predictions available yet. More historical data is needed to generate accurate insights.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const highPriorityInsights = insights.filter(i => i.confidence >= 75 && i.actionable)
  const mediumPriorityInsights = insights.filter(i => i.confidence >= 60 && i.confidence < 75)
  const lowPriorityInsights = insights.filter(i => i.confidence < 60)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkle size={24} weight="duotone" className="text-primary" />
          Predictive Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.length} Active
          </Badge>
        </CardTitle>
        <CardDescription>
          AI-powered predictions based on {insights[0]?.historicalIncidents.length || 0}+ historical incidents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {highPriorityInsights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Warning size={18} weight="duotone" className="text-warning" />
              High Priority
            </div>
            {highPriorityInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} onClick={onInsightClick} />
            ))}
          </div>
        )}

        {mediumPriorityInsights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendUp size={18} weight="duotone" />
              Medium Priority
            </div>
            {mediumPriorityInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} onClick={onInsightClick} />
            ))}
          </div>
        )}

        {lowPriorityInsights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ChartLine size={18} weight="duotone" />
              Low Priority
            </div>
            {lowPriorityInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} onClick={onInsightClick} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface InsightCardProps {
  insight: PredictiveInsight
  onClick?: (insight: PredictiveInsight) => void
}

function InsightCard({ insight, onClick }: InsightCardProps) {
  const getTypeIcon = () => {
    switch (insight.type) {
      case 'forecast':
        return <Clock size={16} weight="duotone" />
      case 'anomaly':
        return <Warning size={16} weight="duotone" />
      case 'trend':
        return <TrendUp size={16} weight="duotone" />
      case 'pattern':
        return <ChartLine size={16} weight="duotone" />
    }
  }

  const getSeverityColor = () => {
    switch (insight.severity) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5'
      case 'high':
        return 'border-l-warning bg-warning/5'
      case 'medium':
        return 'border-l-primary bg-primary/5'
      case 'low':
        return 'border-l-muted-foreground bg-muted'
    }
  }

  const formatPredictedTime = (timestamp?: number) => {
    if (!timestamp) return null
    
    const diff = timestamp - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `in ~${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `in ~${hours} hour${hours > 1 ? 's' : ''}`
    return 'very soon'
  }

  return (
    <div
      className={`p-4 rounded-lg border-l-4 ${getSeverityColor()} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onClick?.(insight)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <Badge variant="outline" className="ml-auto">
              {insight.confidence}% confidence
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {insight.description}
          </p>

          {insight.predictedTime && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={14} weight="duotone" />
              Predicted {formatPredictedTime(insight.predictedTime)}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Progress value={insight.confidence} className="flex-1 h-1.5" />
          </div>
        </div>
      </div>

      {insight.actionable && insight.preventionSteps && insight.preventionSteps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <CheckCircle size={14} weight="duotone" />
            Recommended Actions
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {insight.preventionSteps.slice(0, 3).map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
