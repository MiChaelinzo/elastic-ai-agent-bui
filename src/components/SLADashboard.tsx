import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Incident } from '@/lib/types'
import type { SLAPolicy, SLAStatus } from '@/lib/sla-management'
import { 
  calculateSLAStatus, 
  formatSLATime, 
  getSLAStatusColor,
  getSLAComplianceRate,
  getSLAPolicy,
  defaultSLAPolicies
} from '@/lib/sla-management'
import { Clock, Warning, CheckCircle, Timer, Target, ChartLine } from '@phosphor-icons/react'
import { useMemo } from 'react'

interface SLADashboardProps {
  incidents: Incident[]
  policies?: SLAPolicy[]
}

export function SLADashboard({ incidents, policies = defaultSLAPolicies }: SLADashboardProps) {
  const activeIncidents = useMemo(
    () => incidents.filter(i => i.status !== 'resolved' && i.status !== 'failed'),
    [incidents]
  )

  const slaStatuses = useMemo(() => {
    return activeIncidents.map(incident => {
      const policy = getSLAPolicy(incident.severity, policies)
      if (!policy) return null
      return calculateSLAStatus(incident, policy)
    }).filter(Boolean) as SLAStatus[]
  }, [activeIncidents, policies])

  const complianceRate = useMemo(
    () => getSLAComplianceRate(incidents, policies),
    [incidents, policies]
  )

  const breachedSLAs = slaStatuses.filter(s => s.status === 'breached')
  const atRiskSLAs = slaStatuses.filter(s => s.status === 'at-risk')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={24} weight="duotone" className="text-primary" />
            SLA Management Dashboard
          </CardTitle>
          <CardDescription>
            Monitor service level agreements and compliance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Compliance</span>
                <ChartLine size={20} weight="duotone" className="text-success" />
              </div>
              <div className="text-3xl font-bold text-success">
                {complianceRate.overall.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {complianceRate.compliantIncidents} of {complianceRate.totalIncidents} incidents
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Active SLAs</span>
                <Clock size={20} weight="duotone" className="text-primary" />
              </div>
              <div className="text-3xl font-bold">
                {slaStatuses.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently being tracked
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">At Risk</span>
                <Warning size={20} weight="duotone" className="text-warning" />
              </div>
              <div className="text-3xl font-bold text-warning">
                {atRiskSLAs.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Approaching deadline
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Breached</span>
                <Warning size={20} weight="duotone" className="text-destructive" />
              </div>
              <div className="text-3xl font-bold text-destructive">
                {breachedSLAs.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                SLA violations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="active">
            Active SLAs ({slaStatuses.length})
          </TabsTrigger>
          <TabsTrigger value="at-risk" className="relative">
            At Risk ({atRiskSLAs.length})
            {atRiskSLAs.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="breached" className="relative">
            Breached ({breachedSLAs.length})
            {breachedSLAs.length > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {slaStatuses.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No active SLAs being tracked. All systems operational.
              </AlertDescription>
            </Alert>
          ) : (
            slaStatuses.map(sla => {
              const incident = activeIncidents.find(i => i.id === sla.incidentId)
              if (!incident) return null
              return <SLAStatusCard key={sla.incidentId} sla={sla} incident={incident} />
            })
          )}
        </TabsContent>

        <TabsContent value="at-risk" className="space-y-4">
          {atRiskSLAs.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No SLAs at risk. All incidents are on track.
              </AlertDescription>
            </Alert>
          ) : (
            atRiskSLAs.map(sla => {
              const incident = activeIncidents.find(i => i.id === sla.incidentId)
              if (!incident) return null
              return <SLAStatusCard key={sla.incidentId} sla={sla} incident={incident} />
            })
          )}
        </TabsContent>

        <TabsContent value="breached" className="space-y-4">
          {breachedSLAs.length === 0 ? (
            <Alert>
              <CheckCircle size={20} />
              <AlertDescription>
                No SLA breaches. Excellent performance!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-destructive">
                <Warning size={20} className="text-destructive" />
                <AlertDescription>
                  <strong>{breachedSLAs.length}</strong> SLA{breachedSLAs.length !== 1 ? 's have' : ' has'} been breached. Immediate attention required.
                </AlertDescription>
              </Alert>
              {breachedSLAs.map(sla => {
                const incident = activeIncidents.find(i => i.id === sla.incidentId)
                if (!incident) return null
                return <SLAStatusCard key={sla.incidentId} sla={sla} incident={incident} />
              })}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compliance by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(complianceRate.bySeverity).map(([severity, rate]) => (
              <div key={severity} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={
                    severity === 'critical' ? 'destructive' :
                    severity === 'high' ? 'default' :
                    severity === 'medium' ? 'secondary' : 'outline'
                  }>
                    {severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-semibold">{rate.toFixed(1)}%</span>
                </div>
                <Progress value={rate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SLAStatusCardProps {
  sla: SLAStatus
  incident: Incident
}

function SLAStatusCard({ sla, incident }: SLAStatusCardProps) {
  const statusColor = getSLAStatusColor(sla)

  return (
    <Card className={sla.status === 'breached' ? 'border-destructive' : sla.status === 'at-risk' ? 'border-warning' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold">{incident.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {incident.description.substring(0, 100)}...
              </p>
            </div>
            <Badge variant={
              incident.severity === 'critical' ? 'destructive' :
              incident.severity === 'high' ? 'default' : 'secondary'
            }>
              {incident.severity.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer size={16} weight="duotone" />
                <span>Time to Resolution Breach</span>
              </div>
              <p className={`text-lg font-semibold ${statusColor}`}>
                {sla.resolutionBreached ? 'BREACHED' : formatSLATime(sla.timeToResolutionBreach)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target size={16} weight="duotone" />
                <span>Progress</span>
              </div>
              <p className={`text-lg font-semibold ${statusColor}`}>
                {sla.percentComplete.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">SLA Progress</span>
              <span className={`font-semibold ${statusColor}`}>
                {sla.status.toUpperCase()}
              </span>
            </div>
            <Progress 
              value={Math.min(100, sla.percentComplete)} 
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
