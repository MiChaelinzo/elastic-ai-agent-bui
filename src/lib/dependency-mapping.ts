import type { Incident } from './types'

export interface ServiceDependency {
  id: string
  name: string
  type: 'service' | 'database' | 'api' | 'infrastructure' | 'network'
  status: 'healthy' | 'degraded' | 'down'
  dependencies: string[]
  dependents: string[]
  criticality: 'critical' | 'high' | 'medium' | 'low'
  metadata?: Record<string, any>
}

export interface ImpactAnalysis {
  incidentId: string
  affectedServices: string[]
  impactRadius: number
  estimatedUsersAffected: number
  businessImpact: 'critical' | 'high' | 'medium' | 'low'
  cascadeRisk: number
  relatedIncidents: string[]
  recommendations: string[]
}

export interface DependencyGraph {
  nodes: ServiceDependency[]
  edges: Array<{ from: string; to: string; type: string }>
}

export const sampleServiceDependencies: ServiceDependency[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    type: 'api',
    status: 'healthy',
    dependencies: ['auth-service', 'rate-limiter'],
    dependents: ['web-app', 'mobile-app'],
    criticality: 'critical'
  },
  {
    id: 'auth-service',
    name: 'Authentication Service',
    type: 'service',
    status: 'healthy',
    dependencies: ['user-db', 'redis-cache'],
    dependents: ['api-gateway'],
    criticality: 'critical'
  },
  {
    id: 'user-db',
    name: 'User Database',
    type: 'database',
    status: 'healthy',
    dependencies: [],
    dependents: ['auth-service', 'profile-service'],
    criticality: 'critical'
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache',
    type: 'database',
    status: 'healthy',
    dependencies: [],
    dependents: ['auth-service', 'session-service'],
    criticality: 'high'
  },
  {
    id: 'profile-service',
    name: 'User Profile Service',
    type: 'service',
    status: 'healthy',
    dependencies: ['user-db', 'storage-service'],
    dependents: ['api-gateway'],
    criticality: 'high'
  },
  {
    id: 'storage-service',
    name: 'Object Storage',
    type: 'service',
    status: 'healthy',
    dependencies: [],
    dependents: ['profile-service', 'media-service'],
    criticality: 'medium'
  },
  {
    id: 'web-app',
    name: 'Web Application',
    type: 'service',
    status: 'healthy',
    dependencies: ['api-gateway'],
    dependents: [],
    criticality: 'critical'
  },
  {
    id: 'mobile-app',
    name: 'Mobile Application',
    type: 'service',
    status: 'healthy',
    dependencies: ['api-gateway'],
    dependents: [],
    criticality: 'critical'
  },
  {
    id: 'rate-limiter',
    name: 'Rate Limiter',
    type: 'infrastructure',
    status: 'healthy',
    dependencies: ['redis-cache'],
    dependents: ['api-gateway'],
    criticality: 'high'
  },
  {
    id: 'session-service',
    name: 'Session Management',
    type: 'service',
    status: 'healthy',
    dependencies: ['redis-cache'],
    dependents: ['api-gateway'],
    criticality: 'high'
  },
  {
    id: 'media-service',
    name: 'Media Processing',
    type: 'service',
    status: 'healthy',
    dependencies: ['storage-service', 'queue-service'],
    dependents: ['api-gateway'],
    criticality: 'medium'
  },
  {
    id: 'queue-service',
    name: 'Message Queue',
    type: 'infrastructure',
    status: 'healthy',
    dependencies: [],
    dependents: ['media-service', 'notification-service'],
    criticality: 'high'
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    type: 'service',
    status: 'healthy',
    dependencies: ['queue-service'],
    dependents: [],
    criticality: 'medium'
  }
]

export function identifyAffectedService(incident: Incident): string | null {
  const keywords: Record<string, string[]> = {
    'api-gateway': ['api', 'gateway', 'endpoint', 'request', 'response'],
    'auth-service': ['auth', 'login', 'authentication', 'token', 'session'],
    'user-db': ['database', 'user data', 'query', 'connection'],
    'redis-cache': ['cache', 'redis', 'memory'],
    'profile-service': ['profile', 'user profile'],
    'storage-service': ['storage', 'file', 'upload'],
    'web-app': ['web', 'website', 'frontend'],
    'mobile-app': ['mobile', 'app'],
    'rate-limiter': ['rate limit', 'throttle', 'quota'],
    'session-service': ['session'],
    'media-service': ['media', 'image', 'video'],
    'queue-service': ['queue', 'message'],
    'notification-service': ['notification', 'email', 'alert']
  }

  const text = `${incident.title} ${incident.description}`.toLowerCase()

  for (const [serviceId, terms] of Object.entries(keywords)) {
    if (terms.some(term => text.includes(term))) {
      return serviceId
    }
  }

  return null
}

export function analyzeIncidentImpact(
  incident: Incident,
  services: ServiceDependency[]
): ImpactAnalysis {
  const affectedServiceId = identifyAffectedService(incident)
  
  if (!affectedServiceId) {
    return {
      incidentId: incident.id,
      affectedServices: [],
      impactRadius: 0,
      estimatedUsersAffected: 0,
      businessImpact: 'low',
      cascadeRisk: 0,
      relatedIncidents: [],
      recommendations: ['Unable to identify affected service. Manual investigation required.']
    }
  }

  const affectedService = services.find(s => s.id === affectedServiceId)
  if (!affectedService) {
    return {
      incidentId: incident.id,
      affectedServices: [affectedServiceId],
      impactRadius: 1,
      estimatedUsersAffected: 0,
      businessImpact: 'medium',
      cascadeRisk: 0.3,
      relatedIncidents: [],
      recommendations: ['Service not found in dependency map. Update service registry.']
    }
  }

  const impactedServices = findDownstreamImpact(affectedServiceId, services)
  const impactRadius = impactedServices.length
  
  const criticalServicesAffected = impactedServices.filter(id => {
    const service = services.find(s => s.id === id)
    return service?.criticality === 'critical'
  })

  let businessImpact: 'critical' | 'high' | 'medium' | 'low' = 'low'
  if (criticalServicesAffected.length > 0 || affectedService.criticality === 'critical') {
    businessImpact = 'critical'
  } else if (impactRadius > 3 || affectedService.criticality === 'high') {
    businessImpact = 'high'
  } else if (impactRadius > 1) {
    businessImpact = 'medium'
  }

  const userMultiplier: Record<string, number> = {
    'web-app': 10000,
    'mobile-app': 8000,
    'api-gateway': 15000,
    'auth-service': 12000
  }

  let estimatedUsers = userMultiplier[affectedServiceId] || 1000
  impactedServices.forEach(serviceId => {
    estimatedUsers += (userMultiplier[serviceId] || 500) * 0.5
  })

  const cascadeRisk = Math.min(1, (impactRadius / services.length) * 2)

  const recommendations: string[] = []
  if (affectedService.criticality === 'critical') {
    recommendations.push('Escalate to senior operations team immediately')
    recommendations.push('Activate incident response plan')
  }
  if (impactRadius > 3) {
    recommendations.push('Consider implementing circuit breakers')
    recommendations.push('Review service isolation strategies')
  }
  if (cascadeRisk > 0.5) {
    recommendations.push('High cascade risk detected - monitor dependent services closely')
  }
  
  recommendations.push(`Monitor ${impactedServices.length} dependent services for degradation`)

  return {
    incidentId: incident.id,
    affectedServices: [affectedServiceId, ...impactedServices],
    impactRadius,
    estimatedUsersAffected: Math.round(estimatedUsers),
    businessImpact,
    cascadeRisk,
    relatedIncidents: [],
    recommendations
  }
}

function findDownstreamImpact(serviceId: string, services: ServiceDependency[]): string[] {
  const impacted = new Set<string>()
  const queue = [serviceId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    const service = services.find(s => s.id === current)
    if (!service) continue

    service.dependents.forEach(dependent => {
      if (!impacted.has(dependent) && dependent !== serviceId) {
        impacted.add(dependent)
        queue.push(dependent)
      }
    })
  }

  return Array.from(impacted)
}

export function buildDependencyGraph(services: ServiceDependency[]): DependencyGraph {
  const edges: Array<{ from: string; to: string; type: string }> = []

  services.forEach(service => {
    service.dependencies.forEach(dep => {
      edges.push({
        from: service.id,
        to: dep,
        type: 'depends-on'
      })
    })
  })

  return { nodes: services, edges }
}

export function getCriticalPath(from: string, to: string, services: ServiceDependency[]): string[] {
  const visited = new Set<string>()
  const path: string[] = []

  function dfs(current: string, target: string): boolean {
    if (current === target) {
      path.push(current)
      return true
    }

    if (visited.has(current)) return false
    visited.add(current)

    const service = services.find(s => s.id === current)
    if (!service) return false

    for (const dep of service.dependencies) {
      if (dfs(dep, target)) {
        path.push(current)
        return true
      }
    }

    return false
  }

  dfs(from, to)
  return path.reverse()
}
