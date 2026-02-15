import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  CheckCircle, 
  Warning, 
  XCircle,
  Eye,
  Lock,
  FileText,
  TrendUp
} from '@phosphor-icons/react'
import type { AuditLog, ComplianceCheck, SecurityPolicy, UserRole } from '@/lib/security-compliance'
import { 
  performComplianceChecks,
  generateComplianceReport,
  rolePermissions,
  defaultSecurityPolicies
} from '@/lib/security-compliance'

interface SecurityComplianceDashboardProps {
  userRole: UserRole
  auditLogs: AuditLog[]
}

export function SecurityComplianceDashboard({ userRole, auditLogs }: SecurityComplianceDashboardProps) {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [securityPolicies] = useState<SecurityPolicy[]>(defaultSecurityPolicies)

  useEffect(() => {
    loadComplianceChecks()
  }, [])

  const loadComplianceChecks = async () => {
    setIsLoading(true)
    const checks = await performComplianceChecks()
    setComplianceChecks(checks)
    setIsLoading(false)
  }

  const complianceReport = generateComplianceReport(
    complianceChecks,
    auditLogs,
    {
      start: Date.now() - 7 * 24 * 60 * 60 * 1000,
      end: Date.now()
    }
  )

  const permissions = rolePermissions[userRole]

  const statusIcons = {
    passed: CheckCircle,
    failed: XCircle,
    warning: Warning,
    pending: Eye
  }

  const statusColors = {
    passed: 'text-success',
    failed: 'text-destructive',
    warning: 'text-warning',
    pending: 'text-muted-foreground'
  }

  const severityColors = {
    low: 'border-muted',
    medium: 'border-warning/50',
    high: 'border-destructive/50',
    critical: 'border-destructive'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(complianceReport.overallScore)}%</div>
            <Progress value={complianceReport.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checks Passed</CardTitle>
            <CheckCircle size={20} className="text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{complianceReport.passed}</div>
            <p className="text-xs text-muted-foreground">
              of {complianceReport.totalChecks} total checks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <Warning size={20} className="text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{complianceReport.warnings}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <XCircle size={20} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{complianceReport.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Immediate action needed
            </p>
          </CardContent>
        </Card>
      </div>

      {complianceReport.recommendations.length > 0 && (
        <Alert className="border-warning">
          <TrendUp size={18} className="text-warning" />
          <AlertDescription>
            <div className="font-semibold mb-2">Recommendations:</div>
            <ul className="space-y-1 ml-4">
              {complianceReport.recommendations.map((rec, i) => (
                <li key={i} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compliance">Compliance Checks</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Compliance Status</h3>
              <p className="text-sm text-muted-foreground">
                Security, privacy, and operational compliance checks
              </p>
            </div>
            <Button onClick={loadComplianceChecks} disabled={isLoading}>
              {isLoading ? 'Running Checks...' : 'Run Checks'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceChecks.map(check => {
              const StatusIcon = statusIcons[check.status]
              const statusColor = statusColors[check.status]

              return (
                <Card key={check.id} className={`${severityColors[check.severity]}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <StatusIcon size={20} weight="duotone" className={statusColor} />
                        <div className="flex-1">
                          <CardTitle className="text-base">{check.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {check.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            check.status === 'passed' ? 'default' :
                            check.status === 'failed' ? 'destructive' :
                            check.status === 'warning' ? 'secondary' :
                            'outline'
                          }
                        >
                          {check.status}
                        </Badge>
                        <Badge
                          variant={
                            check.severity === 'critical' ? 'destructive' :
                            check.severity === 'high' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {check.severity}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs capitalize">
                        {check.category}
                      </Badge>
                      <span>
                        Last checked: {new Date(check.lastCheck).toLocaleTimeString()}
                      </span>
                    </div>

                    {check.recommendations && check.recommendations.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="text-xs font-semibold mb-1">Recommendations:</div>
                        <ul className="space-y-1 ml-4">
                          {check.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-foreground/80">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Active Security Policies</h3>
            <p className="text-sm text-muted-foreground">
              Configured rules and enforcement policies
            </p>
          </div>

          <div className="space-y-4">
            {securityPolicies.map(policy => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lock size={20} weight="duotone" className="text-primary" />
                        {policy.name}
                      </CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                        {policy.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                      {policy.violations > 0 && (
                        <Badge variant="destructive">
                          {policy.violations} violations
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold">Rules ({policy.rules.length})</div>
                    {policy.rules.map(rule => (
                      <div key={rule.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {rule.type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant={
                              rule.severity === 'critical' ? 'destructive' :
                              rule.severity === 'high' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {rule.severity}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Condition: <code className="bg-background px-1 py-0.5 rounded">{rule.condition}</code>
                        </div>
                        <div className="text-xs">
                          Action: <span className="font-semibold capitalize">{rule.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Audit Trail</h3>
              <p className="text-sm text-muted-foreground">
                Recent activity log ({complianceReport.recentActivities} entries in last 7 days)
              </p>
            </div>
            {permissions.canViewAuditLogs && (
              <Button variant="outline" size="sm">
                <FileText size={16} className="mr-2" />
                Export Logs
              </Button>
            )}
          </div>

          {!permissions.canViewAuditLogs ? (
            <Alert>
              <Shield size={18} />
              <AlertDescription>
                Your role ({userRole}) does not have permission to view audit logs.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4 space-y-2">
                    {auditLogs.slice(0, 50).map(log => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 ${log.success ? 'text-success' : 'text-destructive'}`}>
                            {log.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{log.userName}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>Resource: {log.resource}</span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Role-Based Access Control</h3>
            <p className="text-sm text-muted-foreground">
              Current role: <Badge variant="default" className="ml-2">{userRole}</Badge>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(permissions).map(([permission, allowed]) => (
              <Card key={permission}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                  {allowed ? (
                    <CheckCircle size={18} className="text-success" weight="duotone" />
                  ) : (
                    <XCircle size={18} className="text-muted-foreground" weight="duotone" />
                  )}
                </CardHeader>
                <CardContent>
                  <Badge variant={allowed ? 'default' : 'secondary'}>
                    {allowed ? 'Allowed' : 'Restricted'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Role Permissions</CardTitle>
              <CardDescription>Compare permissions across different roles</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2">Permission</th>
                      <th className="text-center p-2">Admin</th>
                      <th className="text-center p-2">Operator</th>
                      <th className="text-center p-2">Analyst</th>
                      <th className="text-center p-2">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(rolePermissions.admin).map(permission => (
                      <tr key={permission} className="border-b">
                        <td className="p-2 capitalize">
                          {permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        {(['admin', 'operator', 'analyst', 'viewer'] as UserRole[]).map(role => (
                          <td key={role} className="text-center p-2">
                            {rolePermissions[role][permission as keyof typeof rolePermissions.admin] ? (
                              <CheckCircle size={16} className="text-success inline" />
                            ) : (
                              <XCircle size={16} className="text-muted-foreground inline" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
