import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Incident } from '@/lib/types'
import type { ServiceDependency, ImpactAnalysis } from '@/lib/dependency-mapping'
import { analyzeIncidentImpact, sampleServiceDependencies } from '@/lib/dependency-mapping'
import { Graph, Warning, Users, TrendUp, Lightbulb, Database, CloudArrowUp, CirclesFour } from '@phosphor-icons/react'
import { useMemo } from 'react'

interface DependencyImpactViewProps {
  incident: Incident
  services?: ServiceDependency[]
}

export function DependencyImpactView({ incident, services = sampleServiceDependencies }: DependencyImpactViewProps) {
  const analysis = useMemo(
    () => analyzeIncidentImpact(incident, services),
    [incident, services]
  )

  const getBusinessImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'text-destructive'
      case 'high':
        return 'text-warning'
      case 'medium':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database size={20} weight="duotone" />
      case 'api':
        return <CloudArrowUp size={20} weight="duotone" />
      case 'service':
        return <CirclesFour size={20} weight="duotone" />
      default:
        return <Graph size={20} weight="duotone" />
    }
  }

  const affectedServiceObjects = useMemo(
    () => services.filter(s => analysis.affectedServices.includes(s.id)),
    [services, analysis]
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Graph size={24} weight="duotone" className="text-primary" />
            Impact Analysis
          </CardTitle>
          <CardDescription>
            Service dependencies and estimated business impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Business Impact</span>
                <Warning size={20} weight="duotone" className={getBusinessImpactColor(analysis.businessImpact)} />
              </div>
              <div className={`text-3xl font-bold ${getBusinessImpactColor(analysis.businessImpact)}`}>
                {analysis.businessImpact.toUpperCase()}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Affected Services</span>
                <Graph size={20} weight="duotone" className="text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {analysis.affectedServices.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Radius: {analysis.impactRadius}
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Users Affected</span>
                <Users size={20} weight="duotone" className="text-warning" />
              </div>
              <div className="text-3xl font-bold text-warning">
                {analysis.estimatedUsersAffected.toLocaleString()}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cascade Risk</span>
                <TrendUp size={20} weight="duotone" className={
                  analysis.cascadeRisk > 0.7 ? 'text-destructive' :
                  analysis.cascadeRisk > 0.4 ? 'text-warning' : 'text-success'
                } />
              </div>
              <div className={`text-3xl font-bold ${
                analysis.cascadeRisk > 0.7 ? 'text-destructive' :
                analysis.cascadeRisk > 0.4 ? 'text-warning' : 'text-success'
              }`}>
                {(analysis.cascadeRisk * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis.affectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Affected Services</CardTitle>
            <CardDescription>
              Services directly impacted or at risk due to this incident
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {affectedServiceObjects.map((service, index) => (
                <div
                  key={service.id}
                  className="p-4 rounded-lg border bg-card hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1 text-primary">
                        {getServiceIcon(service.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          {service.name}
                          {index === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              PRIMARY
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {service.type} • Criticality: {service.criticality}
                        </p>
                        {service.dependents.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {service.dependents.length} dependent service{service.dependents.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={
                      service.status === 'down' ? 'destructive' :
                      service.status === 'degraded' ? 'default' : 'secondary'
                    }>
                      {service.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb size={20} weight="duotone" className="text-warning" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <Alert key={index}>
                  <AlertDescription className="flex items-start gap-2">
                    <span className="font-semibold text-sm shrink-0">{index + 1}.</span>
                    <span className="text-sm">{rec}</span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.cascadeRisk > 0.5 && (
        <Alert className="border-warning">
          <Warning size={20} className="text-warning" />
          <AlertDescription>
            <strong>High cascade risk detected!</strong> This incident may trigger failures in multiple dependent services. Monitor closely and consider implementing circuit breakers.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
