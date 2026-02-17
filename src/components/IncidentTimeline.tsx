import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { TimelineEvent, EventCorrelation } from '@/lib/incident-timeline'
import { getEventIcon, getEventColor, generateIncidentTimeline, correlateTimelineEvents } from '@/lib/incident-timeline'
import type { Incident } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import * as Icons from '@phosphor-icons/react'
import { useMemo } from 'react'

interface IncidentTimelineProps {
  incident: Incident
  maxHeight?: string
}

export function IncidentTimeline({ incident, maxHeight = '600px' }: IncidentTimelineProps) {
  const events = useMemo(() => generateIncidentTimeline(incident), [incident])
  const correlations = useMemo(() => correlateTimelineEvents(events), [events])

  const getCorrelationsForEvent = (eventId: string): EventCorrelation | undefined => {
    return correlations.find(c => c.eventId === eventId)
  }

  const renderEventIcon = (type: string) => {
    const iconName = getEventIcon(type as any)
    const IconComponent = (Icons as any)[iconName]
    
    if (!IconComponent) {
      return <Icons.Circle size={20} weight="fill" />
    }
    
    return <IconComponent size={20} weight="duotone" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.ClockClockwise size={24} weight="duotone" className="text-primary" />
          Incident Timeline
        </CardTitle>
        <CardDescription>
          Complete timeline of events and agent activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          <div className="relative">
            <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {events.map((event, index) => {
                const correlation = getCorrelationsForEvent(event.id)
                const colorClass = getEventColor(event.type)
                
                return (
                  <div key={event.id} className="relative pl-16">
                    <div className={`absolute left-0 mt-1 p-2 rounded-full bg-background border-2 ${colorClass.replace('text-', 'border-')}`}>
                      <div className={colorClass}>
                        {renderEventIcon(event.type)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {event.actorType}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(event.timestamp)}</span>
                        {event.actor && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{event.actor}</span>
                          </>
                        )}
                      </div>

                      {correlation && correlation.correlationType === 'causal' && (
                        <div className="mt-2 p-2 rounded-md bg-accent/10 border border-accent/20">
                          <p className="text-xs text-accent-foreground flex items-center gap-2">
                            <Icons.GitBranch size={14} weight="duotone" />
                            {correlation.explanation}
                          </p>
                        </div>
                      )}

                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(event.metadata).map(([key, value]) => {
                            if (typeof value === 'object') return null
                            return (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {index < events.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
