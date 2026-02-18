import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Incident } from '@/lib/types'
import type { IncidentPlaybook, PlaybookRecommendation } from '@/lib/incident-playbooks'
import { recommendPlaybooksForIncident } from '@/lib/incident-playbooks'
import { BookOpen, CheckCircle, Clock, Sparkle, Warning, Lightning, ShieldCheck } from '@phosphor-icons/react'
import { useState, useMemo } from 'react'

interface PlaybookRecommendationsProps {
  incident: Incident
  onSelectPlaybook: (playbook: IncidentPlaybook) => void
  onClose: () => void
}

export function PlaybookRecommendations({ incident, onSelectPlaybook, onClose }: PlaybookRecommendationsProps) {
  const recommendations = useMemo(
    () => recommendPlaybooksForIncident(incident),
    [incident]
  )

  if (recommendations.length === 0) {
    return (
      <Alert>
        <BookOpen size={20} />
        <AlertDescription>
          No playbook recommendations found for this incident. Consider creating a custom workflow.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkle size={24} weight="duotone" className="text-primary" />
          Recommended Playbooks
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered playbook suggestions based on incident characteristics
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <PlaybookRecommendationCard
            key={recommendation.playbook.id}
            recommendation={recommendation}
            onSelect={() => onSelectPlaybook(recommendation.playbook)}
          />
        ))}
      </div>
    </div>
  )
}

interface PlaybookRecommendationCardProps {
  recommendation: PlaybookRecommendation
  onSelect: () => void
}

function PlaybookRecommendationCard({ recommendation, onSelect }: PlaybookRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { playbook, matchScore, reasons, estimatedImpact, riskLevel } = recommendation

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return 'text-success'
      case 'medium': return 'text-warning'
      case 'high': return 'text-destructive'
    }
  }

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'low': return <CheckCircle size={16} className={getRiskColor()} />
      case 'medium': return <Warning size={16} className={getRiskColor()} />
      case 'high': return <ShieldCheck size={16} className={getRiskColor()} />
    }
  }

  const getAutomationBadge = () => {
    switch (playbook.automationLevel) {
      case 'fully-automatic':
        return <Badge className="bg-success text-success-foreground">Fully Automated</Badge>
      case 'semi-automatic':
        return <Badge variant="secondary">Semi-Automated</Badge>
      case 'manual':
        return <Badge variant="outline">Manual</Badge>
    }
  }

  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen size={20} weight="duotone" className="text-primary" />
              {playbook.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {playbook.description}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{matchScore}%</div>
            <div className="text-xs text-muted-foreground">Match Score</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {getAutomationBadge()}
          <Badge variant="outline" className="gap-1">
            {getRiskIcon()}
            {riskLevel} risk
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock size={14} />
            ~{Math.floor(playbook.estimatedDuration / 60)} min
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Lightning size={14} />
            {playbook.successRate}% success rate
          </Badge>
          {playbook.usageCount > 0 && (
            <Badge variant="secondary">
              Used {playbook.usageCount} times
            </Badge>
          )}
        </div>

        <div className="mt-3">
          <div className="text-xs font-medium text-muted-foreground mb-1">Match Score Breakdown:</div>
          <Progress value={matchScore} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Why this playbook?</div>
          <div className="space-y-1">
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Estimated Impact</div>
          <p className="text-sm text-muted-foreground">{estimatedImpact}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="flex-1"
          >
            {isExpanded ? 'Hide' : 'Show'} Steps ({playbook.steps.length})
          </Button>
          <Button onClick={onSelect} className="flex-1">
            <Sparkle size={18} className="mr-2" weight="bold" />
            Use This Playbook
          </Button>
        </div>

        {isExpanded && (
          <div className="border-t pt-4 mt-4">
            <div className="text-sm font-medium mb-3">Execution Steps:</div>
            <div className="space-y-2">
              {playbook.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-muted-foreground">
                        Agent: <span className="font-medium">{step.action.agent}</span>
                      </span>
                      <span className="text-muted-foreground">
                        ~{step.expectedDuration}s
                      </span>
                      {step.requiresApproval && (
                        <Badge variant="outline" className="text-xs">
                          <ShieldCheck size={12} className="mr-1" />
                          Approval Required
                        </Badge>
                      )}
                      {step.rollbackPossible && (
                        <Badge variant="secondary" className="text-xs">
                          Rollback Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1 pt-2">
          {playbook.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
