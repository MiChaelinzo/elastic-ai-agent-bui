import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  TrendUp, 
  CheckCircle, 
  Warning, 
  ChartLine,
  Brain,
  Lightning,
  Target
} from '@phosphor-icons/react'
import type { EnhancedAgent, AgentTeam, AgentMessage, CollaborationSession } from '@/lib/agent-hierarchy'
import { 
  calculateAgentSynergy, 
  evaluateTeamPerformance,
  simulateAgentCollaboration,
  createEnhancedAgent
} from '@/lib/agent-hierarchy'
import type { Incident } from '@/lib/types'

interface AgentHierarchyDashboardProps {
  teams: AgentTeam[]
  activeIncident?: Incident
  onTeamUpdate?: (teams: AgentTeam[]) => void
}

export function AgentHierarchyDashboard({ teams, activeIncident, onTeamUpdate }: AgentHierarchyDashboardProps) {
  const [selectedTeam, setSelectedTeam] = useState<AgentTeam | null>(teams[0] || null)
  const [collaborationSession, setCollaborationSession] = useState<CollaborationSession | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulateCollaboration = async () => {
    if (!selectedTeam || !activeIncident) return
    
    setIsSimulating(true)
    setMessages([])
    
    const session = await simulateAgentCollaboration(
      activeIncident,
      [selectedTeam.supervisor, ...selectedTeam.members],
      (message) => {
        setMessages(prev => [...prev, message])
      }
    )
    
    setCollaborationSession(session)
    setIsSimulating(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">
              {teams.reduce((sum, t) => sum + t.members.length, 0)} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Team Efficiency</CardTitle>
            <TrendUp size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.length > 0 
                ? Math.round(teams.reduce((sum, t) => sum + t.performance.teamEfficiency, 0) / teams.length * 100)
                : 0}%
            </div>
            <Progress 
              value={teams.length > 0 
                ? teams.reduce((sum, t) => sum + t.performance.teamEfficiency, 0) / teams.length * 100
                : 0
              } 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents Handled</CardTitle>
            <Target size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teams.reduce((sum, t) => sum + t.performance.incidentsHandled, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total across all teams
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">Teams Overview</TabsTrigger>
          <TabsTrigger value="collaboration">Live Collaboration</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => {
              const evaluation = evaluateTeamPerformance(team)
              
              return (
                <Card 
                  key={team.id}
                  className={`cursor-pointer transition-all ${
                    selectedTeam?.id === team.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users size={20} weight="duotone" className="text-primary" />
                          {team.name}
                        </CardTitle>
                        <CardDescription>{team.focus}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {team.members.length + 1} agents
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Team Efficiency</span>
                        <span className="font-semibold">
                          {Math.round(team.performance.teamEfficiency * 100)}%
                        </span>
                      </div>
                      <Progress value={team.performance.teamEfficiency * 100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Collaboration Score</span>
                        <span className="font-semibold">
                          {Math.round(team.performance.collaborationScore * 100)}%
                        </span>
                      </div>
                      <Progress value={team.performance.collaborationScore * 100} />
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm font-semibold mb-2">Supervisor</div>
                      <div className="flex items-center gap-2">
                        <Brain size={16} className="text-primary" />
                        <span className="text-sm">{team.supervisor.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {team.supervisor.role}
                        </Badge>
                      </div>
                    </div>

                    {evaluation.strengths.length > 0 && (
                      <Alert className="border-success">
                        <CheckCircle size={16} className="text-success" />
                        <AlertDescription className="text-xs">
                          {evaluation.strengths[0]}
                        </AlertDescription>
                      </Alert>
                    )}

                    {evaluation.recommendations.length > 0 && (
                      <Alert className="border-warning">
                        <Warning size={16} className="text-warning" />
                        <AlertDescription className="text-xs">
                          {evaluation.recommendations[0]}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          {selectedTeam && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Agent Collaboration</CardTitle>
                    <CardDescription>
                      Simulate real-time communication between agents in {selectedTeam.name}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleSimulateCollaboration}
                    disabled={!activeIncident || isSimulating}
                  >
                    <Lightning size={18} className="mr-2" weight="bold" />
                    {isSimulating ? 'Simulating...' : 'Start Simulation'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!activeIncident && (
                  <Alert>
                    <AlertDescription>
                      Select an active incident to simulate agent collaboration
                    </AlertDescription>
                  </Alert>
                )}

                {messages.length > 0 && (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const agent = [selectedTeam.supervisor, ...selectedTeam.members].find(
                          a => a.id === message.from
                        )
                        
                        const priorityColors = {
                          low: 'bg-muted',
                          medium: 'bg-primary/10',
                          high: 'bg-warning/10',
                          critical: 'bg-destructive/10'
                        }

                        const typeIcons = {
                          request: ChartLine,
                          response: CheckCircle,
                          insight: Brain,
                          alert: Warning,
                          coordination: Users
                        }

                        const Icon = typeIcons[message.type]

                        return (
                          <div
                            key={message.id}
                            className={`p-4 rounded-lg border ${priorityColors[message.priority]}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon size={16} weight="duotone" />
                                <span className="font-semibold text-sm">
                                  {agent?.name || 'Team'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {message.type}
                                </Badge>
                              </div>
                              <Badge variant={
                                message.priority === 'critical' ? 'destructive' :
                                message.priority === 'high' ? 'default' :
                                'secondary'
                              }>
                                {message.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-foreground/90">
                              {message.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}

                {collaborationSession && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Messages</div>
                        <div className="text-lg font-semibold">
                          {collaborationSession.messages.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Insights</div>
                        <div className="text-lg font-semibold">
                          {collaborationSession.insights.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Decisions</div>
                        <div className="text-lg font-semibold">
                          {collaborationSession.decisions.length}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {selectedTeam && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Individual agent performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {[selectedTeam.supervisor, ...selectedTeam.members].map(agent => (
                        <div key={agent.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Brain size={16} className="text-primary" />
                              <span className="font-semibold text-sm">{agent.name}</span>
                            </div>
                            <Badge variant="outline">{agent.role}</Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Success Rate</span>
                              <span className="font-semibold">
                                {Math.round(agent.performance.successRate * 100)}%
                              </span>
                            </div>
                            <Progress value={agent.performance.successRate * 100} className="h-1" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Avg Response</div>
                              <div className="font-semibold">
                                {(agent.performance.avgResponseTime / 1000).toFixed(1)}s
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Tasks Done</div>
                              <div className="font-semibold">
                                {agent.performance.tasksCompleted}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {agent.capabilities.map(cap => (
                              <Badge key={cap} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Evaluation</CardTitle>
                  <CardDescription>Strengths, weaknesses, and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const evaluation = evaluateTeamPerformance(selectedTeam)
                    
                    return (
                      <>
                        {evaluation.strengths.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold text-success">
                              <CheckCircle size={18} weight="duotone" />
                              Strengths
                            </div>
                            <ul className="space-y-1 ml-6">
                              {evaluation.strengths.map((strength, i) => (
                                <li key={i} className="text-sm text-foreground/80">
                                  • {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluation.weaknesses.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold text-destructive">
                              <Warning size={18} weight="duotone" />
                              Weaknesses
                            </div>
                            <ul className="space-y-1 ml-6">
                              {evaluation.weaknesses.map((weakness, i) => (
                                <li key={i} className="text-sm text-foreground/80">
                                  • {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluation.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold text-warning">
                              <TrendUp size={18} weight="duotone" />
                              Recommendations
                            </div>
                            <ul className="space-y-1 ml-6">
                              {evaluation.recommendations.map((rec, i) => (
                                <li key={i} className="text-sm text-foreground/80">
                                  • {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
