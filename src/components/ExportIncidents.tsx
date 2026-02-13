import { Button } from '@/components/ui/button'
import { DownloadSimple, FileText, FileCsv } from '@phosphor-icons/react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Incident } from '@/lib/types'

interface ExportIncidentsProps {
  incidents: Incident[]
}

export function ExportIncidents({ incidents }: ExportIncidentsProps) {
  const exportToJSON = () => {
    const dataStr = JSON.stringify(incidents, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `incidents-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Incidents exported successfully', {
      description: `${incidents.length} incidents exported to JSON`
    })
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Severity', 'Status', 'Created At', 'Resolution', 'Time to Resolve']
    const rows = incidents.map(incident => [
      incident.id,
      `"${incident.title.replace(/"/g, '""')}"`,
      `"${incident.description.replace(/"/g, '""')}"`,
      incident.severity,
      incident.status,
      new Date(incident.createdAt).toISOString(),
      incident.resolution ? `"${incident.resolution.replace(/"/g, '""')}"` : '',
      incident.metricsImpact ? `${incident.metricsImpact.timeToResolve}s` : ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `incidents-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Incidents exported successfully', {
      description: `${incidents.length} incidents exported to CSV`
    })
  }

  const exportReport = () => {
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length
    const avgResolutionTime = incidents
      .filter(i => i.status === 'resolved' && i.metricsImpact)
      .reduce((acc, i) => acc + (i.metricsImpact?.timeToResolve || 0), 0) / (resolvedIncidents || 1)
    
    const totalStepsAutomated = incidents
      .filter(i => i.metricsImpact)
      .reduce((acc, i) => acc + (i.metricsImpact?.stepsAutomated || 0), 0)

    const report = `
ELASTIC AGENT ORCHESTRATOR - INCIDENT REPORT
Generated: ${new Date().toLocaleString()}
============================================

SUMMARY METRICS
---------------
Total Incidents: ${incidents.length}
Resolved: ${resolvedIncidents}
Failed: ${incidents.filter(i => i.status === 'failed').length}
Pending Approval: ${incidents.filter(i => i.status === 'pending-approval').length}
Active: ${incidents.filter(i => i.status === 'in-progress' || i.status === 'new').length}

PERFORMANCE METRICS
------------------
Resolution Rate: ${((resolvedIncidents / (incidents.length || 1)) * 100).toFixed(1)}%
Avg Resolution Time: ${Math.round(avgResolutionTime)}s
Total Steps Automated: ${totalStepsAutomated}

INCIDENT BREAKDOWN BY SEVERITY
------------------------------
Critical: ${incidents.filter(i => i.severity === 'critical').length}
High: ${incidents.filter(i => i.severity === 'high').length}
Medium: ${incidents.filter(i => i.severity === 'medium').length}
Low: ${incidents.filter(i => i.severity === 'low').length}

DETAILED INCIDENTS
------------------
${incidents.map(incident => `
[${incident.id}] ${incident.title}
  Status: ${incident.status}
  Severity: ${incident.severity}
  Created: ${new Date(incident.createdAt).toLocaleString()}
  Assigned Agents: ${incident.assignedAgents.join(', ') || 'None'}
  ${incident.resolution ? `Resolution: ${incident.resolution}` : ''}
  ${incident.metricsImpact ? `Time to Resolve: ${incident.metricsImpact.timeToResolve}s` : ''}
`).join('\n')}
    `.trim()

    const dataBlob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `incident-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Report generated successfully', {
      description: 'Detailed incident report exported'
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="lg">
          <DownloadSimple size={20} className="mr-2" weight="duotone" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText size={18} className="mr-2" weight="duotone" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileCsv size={18} className="mr-2" weight="duotone" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportReport}>
          <FileText size={18} className="mr-2" weight="duotone" />
          Generate Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
