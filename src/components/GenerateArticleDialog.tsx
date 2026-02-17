import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Sparkle, CheckCircle, Warning, Lightning, FileText } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface GenerateArticleDialogProps {
  isOpen: boolean
  onClose: () => void
  resolvedIncidents: Incident[]
  onGenerate: (incident: Incident) => Promise<void>
  isGenerating: boolean
}

export function GenerateArticleDialog({
  isOpen,
  onClose,
  resolvedIncidents,
  onGenerate,
  isGenerating
}: GenerateArticleDialogProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  const handleGenerate = async () => {
    if (!selectedIncident) return

    setGenerationProgress(0)
    const interval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      await onGenerate(selectedIncident)
      setGenerationProgress(100)
      setTimeout(() => {
        clearInterval(interval)
        setSelectedIncident(null)
        setGenerationProgress(0)
        onClose()
      }, 1000)
    } catch (error) {
      clearInterval(interval)
      setGenerationProgress(0)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-warning text-warning-foreground'
      case 'medium': return 'bg-primary text-primary-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="duotone" className="text-primary" />
            Generate Knowledge Article from Incident
          </DialogTitle>
          <DialogDescription>
            Select a resolved incident to generate an AI-powered knowledge base article
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {resolvedIncidents.length === 0 ? (
            <Alert>
              <Warning size={20} className="text-warning" />
              <AlertDescription>
                No resolved incidents available. Resolve incidents first to generate knowledge articles.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Select an incident ({resolvedIncidents.length} available)
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {resolvedIncidents.map((incident) => {
                    const isSelected = selectedIncident?.id === incident.id
                    
                    return (
                      <Card
                        key={incident.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'ring-2 ring-primary shadow-lg' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(incident.severity)}>
                                  {incident.severity}
                                </Badge>
                                <Badge variant="outline">
                                  <CheckCircle size={14} className="mr-1" />
                                  Resolved
                                </Badge>
                                {incident.metricsImpact && (
                                  <Badge variant="secondary">
                                    <Lightning size={14} className="mr-1" />
                                    {incident.metricsImpact.stepsAutomated} steps automated
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg">{incident.title}</CardTitle>
                              <CardDescription className="line-clamp-2">
                                {incident.description}
                              </CardDescription>
                            </div>
                            {isSelected && (
                              <CheckCircle size={24} weight="fill" className="text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {incident.resolution && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                  <FileText size={14} />
                                  Resolution
                                </div>
                                <div className="text-sm line-clamp-2">
                                  {incident.resolution}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div>
                                Resolved: {formatDate(incident.updatedAt)}
                              </div>
                              {incident.approvedBy && (
                                <div>
                                  Approved by: {incident.approvedBy}
                                </div>
                              )}
                            </div>
                            {incident.reasoningSteps.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {incident.reasoningSteps.length} agent reasoning steps available
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>

              {isGenerating && (
                <div className="space-y-3">
                  <Alert className="border-primary">
                    <Sparkle size={20} className="text-primary" />
                    <AlertDescription>
                      AI is analyzing the incident and generating a comprehensive knowledge article...
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {generationProgress < 30 && 'Analyzing incident details...'}
                        {generationProgress >= 30 && generationProgress < 60 && 'Extracting key insights...'}
                        {generationProgress >= 60 && generationProgress < 90 && 'Generating article content...'}
                        {generationProgress >= 90 && 'Finalizing article...'}
                      </span>
                      <span className="font-mono font-semibold">{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!selectedIncident || isGenerating}
          >
            <Sparkle size={18} className="mr-2" weight="bold" />
            {isGenerating ? 'Generating...' : 'Generate Article'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
