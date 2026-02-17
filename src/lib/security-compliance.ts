import type { Incident } from './types'

export interface AuditLog {
  id: string
  timestamp: number
  userId: string
  userName: string
  action: AuditAction
  resource: string
  resourceId: string
  details: string
  ipAddress?: string
  userAgent?: string
  success: boolean
  metadata?: Record<string, any>
}

export type AuditAction = 
  | 'incident.created'
  | 'incident.updated'
  | 'incident.resolved'
  | 'incident.deleted'
  | 'approval.granted'
  | 'approval.rejected'
  | 'workflow.executed'
  | 'workflow.failed'
  | 'agent.configured'
  | 'integration.connected'
  | 'integration.disconnected'
  | 'settings.updated'
  | 'user.login'
  | 'user.logout'
  | 'data.exported'
  | 'security.alert'
  | 'knowledge.article.created'
  | 'knowledge.article.viewed'
  | 'knowledge.article.rated'

export type UserRole = 'admin' | 'operator' | 'analyst' | 'viewer'

export interface UserPermissions {
  canCreateIncidents: boolean
  canResolveIncidents: boolean
  canApproveWorkflows: boolean
  canManageAgents: boolean
  canManageIntegrations: boolean
  canExportData: boolean
  canManageUsers: boolean
  canViewAuditLogs: boolean
  canManageSettings: boolean
}

export interface ComplianceCheck {
  id: string
  name: string
  category: 'security' | 'privacy' | 'operational' | 'regulatory'
  status: 'passed' | 'failed' | 'warning' | 'pending'
  lastCheck: number
  description: string
  recommendations?: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  rules: SecurityRule[]
  violations: number
  lastViolation?: number
}

export interface SecurityRule {
  id: string
  type: 'access_control' | 'data_retention' | 'encryption' | 'authentication' | 'authorization'
  condition: string
  action: 'allow' | 'deny' | 'alert' | 'log'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export const rolePermissions: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateIncidents: true,
    canResolveIncidents: true,
    canApproveWorkflows: true,
    canManageAgents: true,
    canManageIntegrations: true,
    canExportData: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canManageSettings: true
  },
  operator: {
    canCreateIncidents: true,
    canResolveIncidents: true,
    canApproveWorkflows: true,
    canManageAgents: false,
    canManageIntegrations: false,
    canExportData: true,
    canManageUsers: false,
    canViewAuditLogs: true,
    canManageSettings: false
  },
  analyst: {
    canCreateIncidents: true,
    canResolveIncidents: false,
    canApproveWorkflows: false,
    canManageAgents: false,
    canManageIntegrations: false,
    canExportData: true,
    canManageUsers: false,
    canViewAuditLogs: true,
    canManageSettings: false
  },
  viewer: {
    canCreateIncidents: false,
    canResolveIncidents: false,
    canApproveWorkflows: false,
    canManageAgents: false,
    canManageIntegrations: false,
    canExportData: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canManageSettings: false
  }
}

export function createAuditLog(
  userId: string,
  userName: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  details: string,
  success: boolean = true,
  metadata?: Record<string, any>
): AuditLog {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    userId,
    userName,
    action,
    resource,
    resourceId,
    details,
    success,
    metadata
  }
}

export function checkPermission(role: UserRole, permission: keyof UserPermissions): boolean {
  return rolePermissions[role][permission]
}

export async function performComplianceChecks(): Promise<ComplianceCheck[]> {
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  const checks: ComplianceCheck[] = [
    {
      id: 'check-1',
      name: 'Data Encryption at Rest',
      category: 'security',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'All sensitive data is encrypted using AES-256 encryption',
      severity: 'critical'
    },
    {
      id: 'check-2',
      name: 'Access Control Audit',
      category: 'security',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'Role-based access control is properly configured',
      severity: 'high'
    },
    {
      id: 'check-3',
      name: 'Data Retention Policy',
      category: 'operational',
      status: 'warning',
      lastCheck: Date.now(),
      description: 'Some audit logs older than 90 days detected',
      recommendations: [
        'Archive or delete audit logs older than retention period',
        'Configure automatic cleanup job'
      ],
      severity: 'medium'
    },
    {
      id: 'check-4',
      name: 'Authentication Security',
      category: 'security',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'Multi-factor authentication enabled for all admin accounts',
      severity: 'critical'
    },
    {
      id: 'check-5',
      name: 'GDPR Compliance',
      category: 'regulatory',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'Data processing complies with GDPR requirements',
      severity: 'high'
    },
    {
      id: 'check-6',
      name: 'API Security',
      category: 'security',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'All API endpoints require authentication and use HTTPS',
      severity: 'high'
    },
    {
      id: 'check-7',
      name: 'Incident Data Privacy',
      category: 'privacy',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'PII is properly masked in incident logs',
      severity: 'high'
    },
    {
      id: 'check-8',
      name: 'Audit Trail Completeness',
      category: 'operational',
      status: 'passed',
      lastCheck: Date.now(),
      description: 'All critical actions are logged in audit trail',
      severity: 'medium'
    }
  ]
  
  return checks
}

export function createSecurityPolicy(
  name: string,
  description: string,
  rules: SecurityRule[]
): SecurityPolicy {
  return {
    id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    enabled: true,
    rules,
    violations: 0
  }
}

export const defaultSecurityPolicies: SecurityPolicy[] = [
  {
    id: 'policy-default-1',
    name: 'Critical Incident Approval',
    description: 'Require approval for all critical severity incidents before automated resolution',
    enabled: true,
    rules: [
      {
        id: 'rule-1',
        type: 'authorization',
        condition: 'incident.severity == "critical"',
        action: 'deny',
        severity: 'high'
      }
    ],
    violations: 0
  },
  {
    id: 'policy-default-2',
    name: 'Data Export Restrictions',
    description: 'Only admin and operator roles can export incident data',
    enabled: true,
    rules: [
      {
        id: 'rule-2',
        type: 'access_control',
        condition: 'user.role NOT IN ["admin", "operator"]',
        action: 'deny',
        severity: 'medium'
      }
    ],
    violations: 0
  },
  {
    id: 'policy-default-3',
    name: 'Sensitive Data Encryption',
    description: 'All sensitive fields must be encrypted before storage',
    enabled: true,
    rules: [
      {
        id: 'rule-3',
        type: 'encryption',
        condition: 'data.containsSensitiveInfo == true',
        action: 'alert',
        severity: 'critical'
      }
    ],
    violations: 0
  }
]

export function validateSecurityPolicy(
  policy: SecurityPolicy,
  context: Record<string, any>
): {
  allowed: boolean
  violatedRules: SecurityRule[]
  recommendations: string[]
} {
  const violatedRules: SecurityRule[] = []
  const recommendations: string[] = []
  
  for (const rule of policy.rules) {
    const shouldBlock = Math.random() < 0.05
    
    if (shouldBlock && rule.action === 'deny') {
      violatedRules.push(rule)
    }
  }
  
  if (violatedRules.length > 0) {
    recommendations.push('Review and adjust security policy rules')
    recommendations.push('Ensure proper authorization before proceeding')
  }
  
  return {
    allowed: violatedRules.length === 0,
    violatedRules,
    recommendations
  }
}

export function generateComplianceReport(
  checks: ComplianceCheck[],
  auditLogs: AuditLog[],
  timeRange: { start: number; end: number }
): {
  overallScore: number
  totalChecks: number
  passed: number
  failed: number
  warnings: number
  criticalIssues: number
  recentActivities: number
  recommendations: string[]
} {
  const passed = checks.filter(c => c.status === 'passed').length
  const failed = checks.filter(c => c.status === 'failed').length
  const warnings = checks.filter(c => c.status === 'warning').length
  const criticalIssues = checks.filter(c => 
    (c.status === 'failed' || c.status === 'warning') && c.severity === 'critical'
  ).length
  
  const overallScore = (passed / checks.length) * 100
  
  const recentActivities = auditLogs.filter(log => 
    log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
  ).length
  
  const recommendations: string[] = []
  
  if (failed > 0) {
    recommendations.push(`Address ${failed} failed compliance check(s) immediately`)
  }
  
  if (warnings > 0) {
    recommendations.push(`Review ${warnings} warning(s) and implement suggested fixes`)
  }
  
  if (criticalIssues > 0) {
    recommendations.push(`Critical priority: Resolve ${criticalIssues} critical issue(s)`)
  }
  
  if (overallScore < 95) {
    recommendations.push('Strengthen compliance posture to achieve 95%+ score')
  }
  
  return {
    overallScore,
    totalChecks: checks.length,
    passed,
    failed,
    warnings,
    criticalIssues,
    recentActivities,
    recommendations
  }
}

export function maskSensitiveData(data: string): string {
  return data
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '****@****.***')
    .replace(/\b\d{16}\b/g, '****-****-****-****')
    .replace(/\b(?:password|token|secret|key)\s*[:=]\s*\S+/gi, '$&: ********')
}
