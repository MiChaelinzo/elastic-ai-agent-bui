import type { Incident, IncidentSeverity } from './types'

export function generateSampleIncidents(): Incident[] {
  const now = Date.now()
  const oneDay = 86400000
  const oneHour = 3600000
  
  const incidents: Incident[] = []
  
  const incidentTemplates = [
    {
      title: 'API Gateway High Latency',
      description: 'API response times exceeded 2s threshold, affecting user experience',
      severity: 'high' as IncidentSeverity,
      keywords: ['api', 'latency', 'gateway']
    },
    {
      title: 'Database Connection Pool Exhausted',
      description: 'All database connections in use, new requests failing',
      severity: 'critical' as IncidentSeverity,
      keywords: ['database', 'connection', 'pool']
    },
    {
      title: 'Memory Leak in Payment Service',
      description: 'Payment service memory usage growing steadily, approaching limits',
      severity: 'high' as IncidentSeverity,
      keywords: ['memory', 'leak', 'payment']
    },
    {
      title: 'SSL Certificate Expiring Soon',
      description: 'Production SSL certificate will expire in 7 days',
      severity: 'medium' as IncidentSeverity,
      keywords: ['ssl', 'certificate', 'expiring']
    },
    {
      title: 'Redis Cache Hit Rate Degradation',
      description: 'Cache hit rate dropped below 70%, increased database load',
      severity: 'medium' as IncidentSeverity,
      keywords: ['redis', 'cache', 'performance']
    }
  ]
  
  incidentTemplates.forEach((template, templateIndex) => {
    const occurrences = 3 + Math.floor(Math.random() * 5)
    
    for (let i = 0; i < occurrences; i++) {
      const daysAgo = Math.floor(Math.random() * 60) + 1
      const hourOffset = Math.floor(Math.random() * 24)
      const createdAt = now - (daysAgo * oneDay) - (hourOffset * oneHour)
      
      const incident: Incident = {
        id: `sample-incident-${templateIndex}-${i}`,
        title: template.title,
        description: template.description,
        severity: template.severity,
        status: i < occurrences - 1 ? 'resolved' : 'new',
        createdAt,
        updatedAt: createdAt + (Math.random() * oneHour * 2),
        assignedAgents: i < occurrences - 1 ? ['detector', 'analyzer', 'resolver', 'verifier'] : [],
        reasoningSteps: [],
        resolution: i < occurrences - 1 ? `Incident resolved through automated workflow execution. Root cause: ${template.keywords[0]} issue detected and remediated.` : undefined,
        metricsImpact: i < occurrences - 1 ? {
          timeToDetect: Math.floor(Math.random() * 30) + 5,
          timeToResolve: Math.floor(Math.random() * 600) + 120,
          stepsAutomated: 6
        } : undefined
      }
      
      incidents.push(incident)
    }
  })
  
  const sortedIncidents = incidents.sort((a, b) => b.createdAt - a.createdAt)
  
  return sortedIncidents
}
