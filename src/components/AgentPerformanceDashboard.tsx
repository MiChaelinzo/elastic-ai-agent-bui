import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Agent, Incident } from '@/lib/types'
import type { AgentPerformanceMetrics, TeamPerformanceMetrics, PerformanceComparison } from '@/lib/agent-performance'
import { calculateAgentPerformance, calculateTeamPerformance, generatePerformanceComparisons } from '@/lib/agent-performance'
import { Trophy, TrendUp, TrendDown, Minus, Clock, CheckCircle, Target, Users, Lightning, Brain } from '@phosphor-icons/react'
import { useState, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, CartesianGrid } from 'recharts'

interface AgentPerformanceDashboardProps {
  agents: Agent[]
  incidents: Incident[]
  isOpen: boolean
  onClose: () => void
}

export function AgentPerformanceDashboard({ agents, incidents, isOpen, onClose }: AgentPerformanceDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const performanceMetrics = useMemo(() => 
    agents.map(agent => calculateAgentPerformance(agent, incidents)),
    [agents, incidents]
  )

  const teamMetrics = useMemo(() => 
    calculateTeamPerformance(agents, incidents),
    [agents, incidents]
  )

  const comparisons = useMemo(() => 
    generatePerformanceComparisons(agents, incidents),
    [agents, incidents]
  )

  const selectedMetrics = selectedAgent 
    ? performanceMetrics.find(m => m.agentId === selectedAgent)
    : null

  const radarData = performanceMetrics.map(m => ({
    agent: m.agentName,
    'Success Rate': m.successRate,
    'Confidence': m.averageConfidence,
    'Collaboration': m.collaborationScore,
    'Efficiency': m.totalIncidents > 0 ? Math.min(100, (m.successfulResolutions / m.totalIncidents) * 100) : 0
  }))

  const trendData = performanceMetrics.map(m => ({
    name: m.agentName,
    incidents: m.totalIncidents,
    success: m.successfulResolutions,
    failed: m.failedResolutions
  }))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 overflow-y-auto">
        <Card className="mx-auto max-w-7xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Trophy size={28} weight="duotone" className="text-primary" />
                  Agent Performance Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive performance metrics and insights for all agents
                </CardDescription>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamMetrics.totalIncidentsHandled}</div>
                </CardContent>
              </Card>

              <Card className="border-success/20 bg-success/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Team Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {Math.round(teamMetrics.teamSuccessRate)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-accent/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Resolution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {Math.round(teamMetrics.averageResolutionTime)}s
                  </div>
                </CardContent>
              </Card>

              <Card className="border-warning/20 bg-warning/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">
                    {teamMetrics.avgConfidence}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="details">Agent Details</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Agent Performance Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="agent" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name="Performance" dataKey="Success Rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Incidents Handled</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="success" fill="hsl(var(--success))" name="Successful" />
                          <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team Leaders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy size={24} weight="duotone" className="text-primary" />
                        <div>
                          <div className="font-semibold">Top Performer</div>
                          <div className="text-sm text-muted-foreground">{teamMetrics.topPerformer}</div>
                        </div>
                      </div>
                      <Badge variant="default">Best Success Rate</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendUp size={24} weight="duotone" className="text-success" />
                        <div>
                          <div className="font-semibold">Most Improved</div>
                          <div className="text-sm text-muted-foreground">{teamMetrics.mostImprovedAgent}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">Improving</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={24} weight="duotone" className="text-accent" />
                        <div>
                          <div className="font-semibold">Collaboration Efficiency</div>
                          <div className="text-sm text-muted-foreground">Team Average</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{teamMetrics.collaborationEfficiency}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-6 mt-6">
                {comparisons.map((comparison) => (
                  <Card key={comparison.metric}>
                    <CardHeader>
                      <CardTitle className="text-lg">{comparison.metric}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {comparison.values.map((value) => (
                          <div key={value.agentName} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{value.agentName}</span>
                                {value.trend > 0 && (
                                  <TrendUp size={16} className="text-success" />
                                )}
                                {value.trend < 0 && (
                                  <TrendDown size={16} className="text-destructive" />
                                )}
                                {value.trend === 0 && (
                                  <Minus size={16} className="text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-mono font-semibold">
                                {Math.round(value.value)}{comparison.metric.includes('Time') ? 'ms' : '%'}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, (value.value / Math.max(...comparison.values.map(v => v.value))) * 100)} 
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {performanceMetrics.map((metrics) => (
                    <Button
                      key={metrics.agentId}
                      variant={selectedAgent === metrics.agentId ? "default" : "outline"}
                      className="h-auto py-4"
                      onClick={() => setSelectedAgent(metrics.agentId)}
                    >
                      <div className="text-left w-full">
                        <div className="font-semibold">{metrics.agentName}</div>
                        <div className="text-sm opacity-80">
                          {metrics.totalIncidents} incidents
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                {selectedMetrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedMetrics.agentName} - Detailed Metrics</span>
                        <Badge 
                          variant={
                            selectedMetrics.efficiencyTrend === 'improving' ? 'default' :
                            selectedMetrics.efficiencyTrend === 'declining' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {selectedMetrics.efficiencyTrend === 'improving' && <TrendUp size={14} className="mr-1" />}
                          {selectedMetrics.efficiencyTrend === 'declining' && <TrendDown size={14} className="mr-1" />}
                          {selectedMetrics.efficiencyTrend === 'stable' && <Minus size={14} className="mr-1" />}
                          {selectedMetrics.efficiencyTrend}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target size={16} />
                            Success Rate
                          </div>
                          <div className="text-2xl font-bold text-success">
                            {Math.round(selectedMetrics.successRate)}%
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Brain size={16} />
                            Avg Confidence
                          </div>
                          <div className="text-2xl font-bold">
                            {Math.round(selectedMetrics.averageConfidence)}%
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock size={16} />
                            Response Time
                          </div>
                          <div className="text-2xl font-bold">
                            {Math.round(selectedMetrics.averageResponseTime)}ms
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users size={16} />
                            Collaboration
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedMetrics.collaborationScore}%
                          </div>
                        </div>
                      </div>

                      {selectedMetrics.topStrengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle size={18} className="text-success" />
                            Top Strengths
                          </h4>
                          <div className="space-y-2">
                            {selectedMetrics.topStrengths.map((strength, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Badge variant="default" className="bg-success text-success-foreground">
                                  ✓
                                </Badge>
                                <span className="text-sm">{strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedMetrics.areasForImprovement.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Lightning size={18} className="text-warning" />
                            Areas for Improvement
                          </h4>
                          <div className="space-y-2">
                            {selectedMetrics.areasForImprovement.map((area, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                                  !
                                </Badge>
                                <span className="text-sm">{area}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-3">Recent Activity</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedMetrics.recentActivity.map((activity) => (
                            <Card key={activity.timestamp} className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{activity.incidentTitle}</div>
                                  <div className="text-xs text-muted-foreground mt-1">{activity.action}</div>
                                </div>
                                <Badge 
                                  variant={
                                    activity.outcome === 'success' ? 'default' :
                                    activity.outcome === 'failed' ? 'destructive' :
                                    'secondary'
                                  }
                                  className="shrink-0"
                                >
                                  {activity.outcome}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Confidence: {Math.round(activity.confidence)}%</span>
                                <span>Duration: {activity.duration}s</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trends" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Trends Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="incidents" stroke="hsl(var(--primary))" name="Total Incidents" strokeWidth={2} />
                        <Line type="monotone" dataKey="success" stroke="hsl(var(--success))" name="Successful" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {performanceMetrics.map((metrics) => (
                    <Card key={metrics.agentId}>
                      <CardHeader>
                        <CardTitle className="text-base">{metrics.agentName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Processed</span>
                          <span className="font-mono font-semibold">{metrics.totalIncidents}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Success Rate</span>
                          <span className="font-mono font-semibold text-success">
                            {Math.round(metrics.successRate)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Trend</span>
                          <Badge 
                            variant={
                              metrics.efficiencyTrend === 'improving' ? 'default' :
                              metrics.efficiencyTrend === 'declining' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {metrics.efficiencyTrend}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
