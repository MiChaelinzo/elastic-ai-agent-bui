import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Incident } from '@/lib/types'

interface IncidentAnalyticsProps {
  incidents: Incident[]
}

export function IncidentAnalytics({ incidents }: IncidentAnalyticsProps) {
  const severityData = useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
    
    incidents.forEach(incident => {
      counts[incident.severity]++
    })
    
    return [
      { name: 'Critical', value: counts.critical, color: 'oklch(0.55 0.22 25)' },
      { name: 'High', value: counts.high, color: 'oklch(0.75 0.15 75)' },
      { name: 'Medium', value: counts.medium, color: 'oklch(0.55 0.20 200)' },
      { name: 'Low', value: counts.low, color: 'oklch(0.70 0.20 145)' }
    ]
  }, [incidents])

  const statusData = useMemo(() => {
    const counts = {
      resolved: 0,
      'in-progress': 0,
      'pending-approval': 0,
      failed: 0,
      new: 0
    }
    
    incidents.forEach(incident => {
      counts[incident.status]++
    })
    
    return [
      { name: 'Resolved', value: counts.resolved },
      { name: 'In Progress', value: counts['in-progress'] },
      { name: 'Pending', value: counts['pending-approval'] },
      { name: 'Failed', value: counts.failed },
      { name: 'New', value: counts.new }
    ]
  }, [incidents])

  const timelineData = useMemo(() => {
    const now = Date.now()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000)
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: 0,
        resolved: 0
      }
    })
    
    incidents.forEach(incident => {
      const incidentDate = new Date(incident.createdAt)
      const dayIndex = Math.floor((now - incidentDate.getTime()) / (24 * 60 * 60 * 1000))
      
      if (dayIndex >= 0 && dayIndex < 7) {
        last7Days[6 - dayIndex].created++
        
        if (incident.status === 'resolved') {
          last7Days[6 - dayIndex].resolved++
        }
      }
    })
    
    return last7Days
  }, [incidents])

  const agentPerformanceData = useMemo(() => {
    const agentTypes = ['detector', 'analyzer', 'resolver', 'verifier']
    
    return agentTypes.map(type => {
      const steps = incidents.flatMap(i => i.reasoningSteps.filter(s => s.agentType === type))
      const avgConfidence = steps.length > 0
        ? steps.reduce((acc, s) => acc + s.confidence, 0) / steps.length
        : 0
      
      return {
        name: type.charAt(0).toUpperCase() + type.slice(1),
        confidence: Math.round(avgConfidence),
        executions: steps.length
      }
    })
  }, [incidents])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Incident Severity Distribution</CardTitle>
          <CardDescription>Breakdown by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(0.20 0.03 250)', 
                  border: '1px solid oklch(0.30 0.03 250)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0.01 250)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
          <CardDescription>Current incident status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250)" />
              <XAxis 
                dataKey="name" 
                stroke="oklch(0.65 0.02 250)"
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 12 }}
              />
              <YAxis 
                stroke="oklch(0.65 0.02 250)"
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(0.20 0.03 250)', 
                  border: '1px solid oklch(0.30 0.03 250)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0.01 250)'
                }} 
              />
              <Bar dataKey="value" fill="oklch(0.55 0.20 200)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>7-Day Incident Timeline</CardTitle>
          <CardDescription>Created vs resolved incidents over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250)" />
              <XAxis 
                dataKey="date" 
                stroke="oklch(0.65 0.02 250)"
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 12 }}
              />
              <YAxis 
                stroke="oklch(0.65 0.02 250)"
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(0.20 0.03 250)', 
                  border: '1px solid oklch(0.30 0.03 250)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0.01 250)'
                }} 
              />
              <Legend 
                wrapperStyle={{ color: 'oklch(0.95 0.01 250)' }}
              />
              <Line type="monotone" dataKey="created" stroke="oklch(0.55 0.20 200)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="resolved" stroke="oklch(0.70 0.20 145)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Average confidence by agent type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250)" />
              <XAxis 
                dataKey="name" 
                stroke="oklch(0.65 0.02 250)"
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 12 }}
              />
              <YAxis 
                stroke="oklch(0.65 0.02 250)"
                tick={{ fill: 'oklch(0.65 0.02 250)', fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'oklch(0.20 0.03 250)', 
                  border: '1px solid oklch(0.30 0.03 250)',
                  borderRadius: '8px',
                  color: 'oklch(0.95 0.01 250)'
                }} 
              />
              <Legend 
                wrapperStyle={{ color: 'oklch(0.95 0.01 250)' }}
              />
              <Bar dataKey="confidence" fill="oklch(0.70 0.20 145)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="executions" fill="oklch(0.55 0.20 200)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
