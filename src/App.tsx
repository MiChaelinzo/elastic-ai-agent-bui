import { useState, useEffect, useMemo, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { LoginScreen } from '@/components/LoginScreen'
import { APIConfigurationDialog } from '@/components/APIConfigurationDialog'
import { ModeSwitcher } from '@/components/ModeSwitcher'
import { UserMenu } from '@/components/UserMenu'
import type { AuthState, APIConfig, User } from '@/lib/auth-types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AgentCard } from '@/components/AgentCard'
import { IncidentCard } from '@/components/IncidentCard'
import { ReasoningLog } from '@/components/ReasoningLog'
import { WorkflowTemplateCard } from '@/components/WorkflowTemplateCard'
import { WorkflowTemplateDetail } from '@/components/WorkflowTemplateDetail'
import { ConfidenceSettings as ConfidenceSettingsComponent } from '@/components/ConfidenceSettings'
import { NotificationSettingsComponent } from '@/components/NotificationSettings'
import { BackgroundSettingsComponent } from '@/components/BackgroundSettings'
import { ApprovalDialog } from '@/components/ApprovalDialog'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { MouseTrail } from '@/components/MouseTrail'
import { MetricsDashboard } from '@/components/MetricsDashboard'
import { IncidentAnalytics } from '@/components/IncidentAnalytics'
import { IncidentFilters } from '@/components/IncidentFilters'
import { ExportIncidents } from '@/components/ExportIncidents'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BulkActions } from '@/components/BulkActions'
import { AgentCollaborationGraph } from '@/components/AgentCollaborationGraph'
import { CollaborationVisualization } from '@/components/CollaborationVisualization'
import { AgentActivityFeed } from '@/components/AgentActivityFeed'
import { ElasticsearchDashboard } from '@/components/ElasticsearchDashboard'
import { SLADashboard } from '@/components/SLADashboard'
import { Lightning, Plus, GitBranch, ChartLine, CheckCircle, Sparkle, FunnelSimple, Gear, ShieldCheck, Bell, PaintBrush, Brain, Sliders, Broadcast, Database, Microphone, Book, Target, Play } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Incident, Agent, ReasoningStep, AgentType, IncidentSeverity, IncidentStatus, ConfidenceSettings, NotificationSettings, BackgroundSettings } from '@/lib/types'
import { simulateAgentReasoning, executeWorkflow, checkConfidenceThresholds } from '@/lib/agent-engine'
import { workflowTemplates, getTemplatesByCategory, searchTemplates, type WorkflowTemplate } from '@/lib/workflow-templates'
import { sendApprovalNotifications, defaultNotificationSettings } from '@/lib/notification-service'
import { analyzeIncidentPatterns, generatePredictiveInsights, calculatePredictiveScore, type PredictiveInsight, type IncidentPattern } from '@/lib/predictive-analytics'
import { generateSampleIncidents } from '@/lib/sample-data'
import { PredictiveInsights } from '@/components/PredictiveInsights'
import { PredictiveInsightDetail } from '@/components/PredictiveInsightDetail'
import { PatternAnalysis } from '@/components/PatternAnalysis'
import { PriorityQueueDisplay } from '@/components/PriorityQueueDisplay'
import { QueueMetrics } from '@/components/QueueMetrics'
import { PriorityQueueSettingsComponent } from '@/components/PriorityQueueSettings'
import { EscalationAlerts, useEscalationNotifications } from '@/components/EscalationAlerts'
import { AnomalyDashboard } from '@/components/AnomalyDashboard'
import { AnomalyThresholdSettings } from '@/components/AnomalyThresholdSettings'
import { AnomalyVisualization } from '@/components/AnomalyVisualization'
import { useElasticsearch } from '@/hooks/use-elasticsearch'
import { 
  createQueueItem, 
  sortQueueByPriority, 
  shouldEscalateIncident, 
  escalateIncident,
  getQueueMetrics,
  defaultPrioritySettings,
  type PriorityQueueSettings,
  type PriorityQueueItem
} from '@/lib/priority-queue'
import {
  detectAnomalies,
  convertIncidentsToMetricDataPoints,
  calculateTimeSeriesMetrics,
  defaultAnomalyThresholds,
  type AnomalyThresholds,
  type AnomalyAlgorithm,
  type AnomalyResult
} from '@/lib/anomaly-detection'
import { ListBullets } from '@phosphor-icons/react'
import { MetricCorrelationDashboard } from '@/components/MetricCorrelationDashboard'
import { MetricCorrelationView } from '@/components/MetricCorrelationView'
import { MetricCorrelationBadge } from '@/components/MetricCorrelationBadge'
import {
  generateMockExternalMetrics,
  correlateIncidentWithMetrics,
  analyzeMultiMetricCorrelation,
  type ExternalMetric,
  type MetricCorrelationAnalysis
} from '@/lib/external-metrics'
import { LiveCorrelationDashboard } from '@/components/LiveCorrelationDashboard'
import { LiveMetricWidget } from '@/components/LiveMetricWidget'
import { ESQLDashboard } from '@/components/ESQLDashboard'
import { Code } from '@phosphor-icons/react'
import { getSimulatedCurrentTime } from '@/lib/utils'
import { Chatbot } from '@/components/Chatbot'
import { VoiceCommandButton } from '@/components/VoiceCommandButton'
import { VoiceCommandPanel } from '@/components/VoiceCommandPanel'
import { VoiceSettingsDialog } from '@/components/VoiceSettingsDialog'
import { defaultVoiceSettings, type VoiceRecognitionSettings } from '@/lib/voice-commands'
import { VoiceBiometricManager } from '@/components/VoiceBiometricManager'
import { VoiceBiometricVerification } from '@/components/VoiceBiometricVerification'
import { type VoiceProfile, type BiometricVerificationResult, type BiometricSettings, defaultBiometricSettings } from '@/lib/voice-biometrics'
import { Fingerprint, Plugs, Users as UsersIcon } from '@phosphor-icons/react'
import { AgentHierarchyDashboard } from '@/components/AgentHierarchyDashboard'
import { IntegrationHub } from '@/components/IntegrationHub'
import { SecurityComplianceDashboard } from '@/components/SecurityComplianceDashboard'
import type { EnhancedAgent, AgentTeam } from '@/lib/agent-hierarchy'
import { createEnhancedAgent, createAgentTeam } from '@/lib/agent-hierarchy'
import type { Integration } from '@/lib/integration-hub'
import type { AuditLog, UserRole } from '@/lib/security-compliance'
import { createAuditLog } from '@/lib/security-compliance'
import { KnowledgeBase } from '@/components/KnowledgeBase'
import { KnowledgeArticleViewer } from '@/components/KnowledgeArticleViewer'
import { GenerateArticleDialog } from '@/components/GenerateArticleDialog'
import { SimilarArticlesBadge } from '@/components/SimilarArticlesBadge'
import { ArticleGenerationPrompt } from '@/components/ArticleGenerationPrompt'
import { RelatedKnowledge } from '@/components/RelatedKnowledge'
import { 
  type KnowledgeArticle, 
  generateKnowledgeArticle,
  incrementArticleView,
  rateArticle as rateKnowledgeArticle 
} from '@/lib/knowledge-base'
import { defaultSLAPolicies, type SLAPolicy, type SLABreach, type EscalationRule, type EscalationExecution, defaultEscalationRules } from '@/lib/sla-management'
import { CommentThread } from '@/components/CommentThread'
import { ActivityFeed } from '@/components/ActivityFeed'
import { CollaborationStats } from '@/components/CollaborationStats'
import { MentionsNotification } from '@/components/MentionsNotification'
import { AttachmentGallery } from '@/components/AttachmentGallery'
import { ChatCircleDots, Users, Image as ImageIcon } from '@phosphor-icons/react'
import {
  type Comment,
  type CommentAttachment,
  type IncidentActivity,
  type ReactionType,
  type CollaborationSettings,
  createComment,
  addReaction,
  updateComment,
  deleteComment,
  getCommentsForIncident,
  createActivity,
  getActivitiesForIncident,
  getUserMentions,
  defaultCollaborationSettings
} from '@/lib/incident-collaboration'

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    type: 'detector',
    name: 'Detector Agent',
    description: 'Identifies and classifies incidents using ES|QL queries',
    status: 'idle'
  },
  {
    id: 'agent-2',
    type: 'analyzer',
    name: 'Analyzer Agent',
    description: 'Investigates root causes with Elasticsearch Search',
    status: 'idle'
  },
  {
    id: 'agent-3',
    type: 'resolver',
    name: 'Resolver Agent',
    description: 'Proposes automated solutions via Elastic Workflows',
    status: 'idle'
  },
  {
    id: 'agent-4',
    type: 'verifier',
    name: 'Verifier Agent',
    description: 'Validates solutions before execution',
    status: 'idle'
  }
]

function getCurrentTimestamp(): number {
  return getSimulatedCurrentTime()
}

function getRandomRecentTimestamp(maxHoursAgo: number = 72): number {
  const now = getSimulatedCurrentTime()
  const hoursInMs = maxHoursAgo * 3600000
  return now - (Math.random() * hoursInMs)
}

function App() {
  const [authState, setAuthState, deleteAuthState] = useKV<AuthState>('auth-state', {
    isAuthenticated: false,
    user: null,
    mode: 'demo',
    hasCompletedOnboarding: false
  })
  
  const [apiConfig, setApiConfig] = useKV<APIConfig | null>('api-config', null)
  const [showAPIConfig, setShowAPIConfig] = useState(false)
  const [showModeSelection, setShowModeSelection] = useState(false)
  
  const [incidents, setIncidents] = useKV<Incident[]>('incidents', [])
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showNewIncident, setShowNewIncident] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [workflowProgress, setWorkflowProgress] = useState(0)
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [incidentPendingApproval, setIncidentPendingApproval] = useState<Incident | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showElasticsearchDashboard, setShowElasticsearchDashboard] = useState(false)
  
  const elasticsearch = useElasticsearch()
  
  const [confidenceSettings, setConfidenceSettings] = useKV<ConfidenceSettings>('confidence-settings', {
    minConfidenceThreshold: 80,
    requireApprovalBelowThreshold: true,
    autoExecuteAboveThreshold: false,
    criticalIncidentThreshold: 90,
    notifyOnLowConfidence: true
  })
  
  const [notificationSettings, setNotificationSettings] = useKV<NotificationSettings>('notification-settings', defaultNotificationSettings)
  
  const [backgroundSettings, setBackgroundSettings] = useKV<BackgroundSettings>('background-settings', {
    particleDensity: 100,
    particleSpeed: 100,
    nodeSpeed: 100,
    showGrid: true,
    showConnections: true,
    showDataFlows: true
  })
  
  const [settingsTab, setSettingsTab] = useState<'confidence' | 'notifications' | 'background' | 'priority' | 'anomaly' | 'mode'>('confidence')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'all'>('all')
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'all'>('all')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [showAnomalyDetection, setShowAnomalyDetection] = useState(false)
  
  const [anomalyThresholds, setAnomalyThresholds] = useKV<AnomalyThresholds>('anomaly-thresholds', defaultAnomalyThresholds)
  const [anomalyAlgorithm, setAnomalyAlgorithm] = useState<AnomalyAlgorithm>('ensemble')
  const [showCollaborationViz, setShowCollaborationViz] = useState(false)
  const [showPredictiveAnalytics, setShowPredictiveAnalytics] = useState(true)
  const [selectedInsight, setSelectedInsight] = useState<PredictiveInsight | null>(null)
  const [selectedPattern, setSelectedPattern] = useState<IncidentPattern | null>(null)
  const [showPriorityQueue, setShowPriorityQueue] = useState(true)
  
  const [prioritySettings, setPrioritySettings] = useKV<PriorityQueueSettings>('priority-settings', defaultPrioritySettings)
  
  const { notifications: escalationNotifications, addNotification: addEscalationNotification, dismissNotification: dismissEscalationNotification } = useEscalationNotifications()
  
  const [showMetricCorrelation, setShowMetricCorrelation] = useState(false)
  const [selectedIncidentForMetrics, setSelectedIncidentForMetrics] = useState<Incident | null>(null)
  const [externalMetrics, setExternalMetrics] = useState<ExternalMetric[]>([])
  const [metricCorrelationAnalysis, setMetricCorrelationAnalysis] = useState<MetricCorrelationAnalysis | null>(null)
  const [showLiveStreaming, setShowLiveStreaming] = useState(false)
  const [showESQLDashboard, setShowESQLDashboard] = useState(false)
  const [showVoiceCommands, setShowVoiceCommands] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  
  const [voiceSettings, setVoiceSettings] = useKV<VoiceRecognitionSettings>('voice-settings', defaultVoiceSettings)
  
  const [showBiometrics, setShowBiometrics] = useState(false)
  const [showBiometricVerification, setShowBiometricVerification] = useState(false)
  const [voiceProfiles, setVoiceProfiles] = useKV<VoiceProfile[]>('voice-profiles', [])
  const [biometricSettings, setBiometricSettings] = useKV<BiometricSettings>('biometric-settings', defaultBiometricSettings)
  const [biometricVerified, setBiometricVerified] = useState(false)
  const [currentVerifiedUser, setCurrentVerifiedUser] = useState<string | null>(null)
  
  const [showAgentHierarchy, setShowAgentHierarchy] = useState(false)
  const [showIntegrationHub, setShowIntegrationHub] = useState(false)
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false)
  const [integrations, setIntegrations] = useKV<Integration[]>('integrations', [])
  const [auditLogs, setAuditLogs] = useKV<AuditLog[]>('audit-logs', [])
  const [userRole, setUserRole] = useState<UserRole>('operator')
  const [agentTeams, setAgentTeams] = useKV<AgentTeam[]>('agent-teams', [])
  
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false)
  const [knowledgeArticles, setKnowledgeArticles] = useKV<KnowledgeArticle[]>('knowledge-articles', [])
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  const [showArticleViewer, setShowArticleViewer] = useState(false)
  
  const [comments, setComments] = useKV<Comment[]>('incident-comments', [])
  const [activities, setActivities] = useKV<IncidentActivity[]>('incident-activities', [])
  const [collaborationSettings, setCollaborationSettings] = useKV<CollaborationSettings>(
    'collaboration-settings',
    defaultCollaborationSettings
  )
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [showCollaborationStats, setShowCollaborationStats] = useState(false)
  const [showAttachmentGallery, setShowAttachmentGallery] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string } | null>(null)
  const [showGenerateArticle, setShowGenerateArticle] = useState(false)
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false)
  const [showArticlePrompt, setShowArticlePrompt] = useState(false)
  const [incidentForArticle, setIncidentForArticle] = useState<Incident | null>(null)
  
  const [showSLADashboard, setShowSLADashboard] = useState(false)
  const [slaPolicies, setSlaPolicies] = useKV<SLAPolicy[]>('sla-policies', defaultSLAPolicies)
  const [slaBreaches, setSlaBreaches] = useKV<SLABreach[]>('sla-breaches', [])
  const [escalationRules, setEscalationRules] = useKV<EscalationRule[]>('escalation-rules', defaultEscalationRules)
  const [escalationExecutions, setEscalationExecutions] = useKV<EscalationExecution[]>('escalation-executions', [])
  
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'medium' as IncidentSeverity,
    templateId: ''
  })

  const createIncident = async () => {
    if (!newIncident.title || !newIncident.description) {
      toast.error('Please fill in all fields')
      return
    }

    const timestamp = getCurrentTimestamp()
    const user = await window.spark.user()

    const incident: Incident = {
      id: `incident-${Date.now()}`,
      title: newIncident.title,
      description: newIncident.description,
      severity: newIncident.severity,
      status: 'new',
      createdAt: timestamp,
      updatedAt: timestamp,
      assignedAgents: [],
      reasoningSteps: [],
      templateId: newIncident.templateId || undefined
    }

    setIncidents(current => [incident, ...(current || [])])
    
    const auditLog = createAuditLog(
      user?.id?.toString() || 'system',
      user?.login || 'System',
      'incident.created',
      'incident',
      incident.id,
      `Created new ${incident.severity} severity incident: ${incident.title}`,
      true,
      { severity: incident.severity, templateId: incident.templateId }
    )
    setAuditLogs(current => [auditLog, ...(current || [])])
    
    if (currentUser) {
      const activity = createActivity(
        incident.id,
        currentUser.id,
        currentUser.name,
        currentUser.avatar,
        'status_change',
        `created this incident with ${incident.severity} severity`,
        { oldStatus: null, newStatus: 'new', severity: incident.severity }
      )
      setActivities(current => [activity, ...(current || [])])
    }
    
    setShowNewIncident(false)
    setNewIncident({ title: '', description: '', severity: 'medium', templateId: '' })
    
    if (newIncident.templateId) {
      toast.success('Incident created from template', {
        description: 'Ready for automated workflow execution'
      })
    } else {
      toast.success('Incident created successfully')
    }
  }

  const processIncident = async (incident: Incident) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setSelectedIncident(incident)
    
    const agentSequence: AgentType[] = ['detector', 'analyzer', 'resolver', 'verifier']
    
    for (const agentType of agentSequence) {
      setAgents(current => 
        current.map(a => 
          a.type === agentType 
            ? { ...a, status: 'thinking' as const }
            : a
        )
      )

      setIncidents(current =>
        (current || []).map(inc =>
          inc.id === incident.id
            ? { 
                ...inc, 
                status: 'in-progress' as const,
                assignedAgents: [...new Set([...inc.assignedAgents, agentType])],
                updatedAt: getCurrentTimestamp()
              }
            : inc
        )
      )

      const response = await simulateAgentReasoning(
        incident,
        agentType,
        (step: ReasoningStep) => {
          setIncidents(current =>
            (current || []).map(inc =>
              inc.id === incident.id
                ? { ...inc, reasoningSteps: [...inc.reasoningSteps, step] }
                : inc
            )
          )
          
          if (selectedIncident?.id === incident.id) {
            setSelectedIncident(prev => 
              prev ? { ...prev, reasoningSteps: [...prev.reasoningSteps, step] } : null
            )
          }
        }
      )

      const confidence = Math.floor(Math.random() * 20) + 80

      setAgents(current =>
        current.map(a =>
          a.type === agentType
            ? { ...a, status: 'complete' as const, confidence }
            : a
        )
      )

      if (agentType === 'resolver') {
        setIncidents(current =>
          (current || []).map(inc =>
            inc.id === incident.id
              ? { ...inc, proposedSolution: response }
              : inc
          )
        )
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const updatedIncident = (incidents || []).find(inc => inc.id === incident.id)
    if (!updatedIncident || !confidenceSettings) {
      setIsProcessing(false)
      return
    }

    const approvalCheck = checkConfidenceThresholds(updatedIncident, confidenceSettings)
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incident.id
          ? {
              ...inc,
              requiresApproval: approvalCheck.requiresApproval,
              approvalReason: approvalCheck.reason,
              lowestConfidence: approvalCheck.lowestConfidence,
              status: approvalCheck.requiresApproval ? 'pending-approval' as const : inc.status
            }
          : inc
      )
    )

    if (approvalCheck.requiresApproval) {
      const incidentWithApproval = {
        ...updatedIncident,
        requiresApproval: true,
        approvalReason: approvalCheck.reason,
        lowestConfidence: approvalCheck.lowestConfidence,
        status: 'pending-approval' as const
      }
      
      setIncidentPendingApproval(incidentWithApproval)
      setShowApprovalDialog(true)
      
      if (notificationSettings?.enabled) {
        const approvalUrl = `${window.location.origin}${window.location.pathname}`
        
        const notificationResult = await sendApprovalNotifications(notificationSettings, {
          incident: incidentWithApproval,
          reason: approvalCheck.reason,
          lowestConfidence: approvalCheck.lowestConfidence,
          approvalUrl
        })
        
        if (notificationResult.success) {
          const channelNames = notificationResult.results.map(r => r.channel).join(' and ')
          toast.success(`Approval notifications sent via ${channelNames}`, {
            description: 'Team members have been notified'
          })
        } else {
          const failedChannels = notificationResult.results
            .filter(r => !r.success)
            .map(r => `${r.channel}: ${r.message}`)
          
          toast.warning('Some notifications failed to send', {
            description: failedChannels.join(', ')
          })
        }
      }
      
      if (confidenceSettings.notifyOnLowConfidence && approvalCheck.lowestConfidence < confidenceSettings.minConfidenceThreshold) {
        toast.warning('Low confidence detected - Approval required', {
          description: approvalCheck.reason
        })
      } else {
        toast.info('Manual approval required', {
          description: approvalCheck.reason
        })
      }
    } else if (confidenceSettings.autoExecuteAboveThreshold) {
      toast.success('High confidence - Auto-executing resolution', {
        description: `All agents exceeded ${confidenceSettings.minConfidenceThreshold}% confidence threshold`
      })
      await executeResolution(updatedIncident)
    } else {
      toast.success('All agents have completed analysis', {
        description: 'Ready to execute automated resolution'
      })
    }
    
    setIsProcessing(false)
  }

  const executeResolution = async (incident: Incident) => {
    setIsProcessing(true)
    setWorkflowProgress(0)
    
    toast.info('Executing automated workflow...')

    const result = await executeWorkflow(
      incident.id,
      (step, progress) => {
        setCurrentWorkflowStep(step)
        setWorkflowProgress(progress)
      }
    )

    if (result.success) {
      const resolvedAt = getCurrentTimestamp()
      const timeToResolve = Math.floor(Math.abs(resolvedAt - incident.createdAt) / 1000)
      
      setIncidents(current =>
        (current || []).map(inc =>
          inc.id === incident.id
            ? {
                ...inc,
                status: 'resolved' as const,
                resolution: result.message,
                updatedAt: resolvedAt,
                metricsImpact: {
                  timeToDetect: 12,
                  timeToResolve,
                  stepsAutomated: 6
                }
              }
            : inc
        )
      )

      if (currentUser) {
        const activity = createActivity(
          incident.id,
          currentUser.id,
          currentUser.name,
          currentUser.avatar,
          'resolution',
          `resolved this incident - ${result.message}`,
          { timeToResolve, stepsAutomated: 6 }
        )
        setActivities(current => [activity, ...(current || [])])
      }

      toast.success('Incident resolved successfully!', {
        description: result.message,
        action: {
          label: 'Generate Article',
          onClick: () => {
            const resolvedIncident = (incidents || []).find(inc => inc.id === incident.id)
            if (resolvedIncident) {
              handleGenerateArticle(resolvedIncident)
            }
          }
        }
      })
      
      const resolvedIncident = {
        ...incident,
        status: 'resolved' as const,
        resolution: result.message,
        updatedAt: resolvedAt,
        metricsImpact: {
          timeToDetect: 12,
          timeToResolve,
          stepsAutomated: 6
        }
      }
      
      setIncidentForArticle(resolvedIncident)
      setShowArticlePrompt(true)
    } else {
      toast.error('Workflow execution failed')
    }

    setIsProcessing(false)
    setWorkflowProgress(0)
    setCurrentWorkflowStep('')
  }

  const handleApprove = async () => {
    if (!incidentPendingApproval) return

    const user = await window.spark.user()
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incidentPendingApproval.id
          ? {
              ...inc,
              status: 'in-progress' as const,
              approvedBy: user?.login || 'unknown',
              approvedAt: getCurrentTimestamp()
            }
          : inc
      )
    )

    setShowApprovalDialog(false)
    
    toast.success('Incident approved', {
      description: 'Executing automated resolution workflow...'
    })

    await executeResolution(incidentPendingApproval)
    setIncidentPendingApproval(null)
  }

  const handleReject = async () => {
    if (!incidentPendingApproval) return

    const user = await window.spark.user()
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incidentPendingApproval.id
          ? {
              ...inc,
              status: 'failed' as const,
              resolution: `Manual approval rejected by ${user?.login || 'user'}`,
              updatedAt: getCurrentTimestamp()
            }
          : inc
      )
    )

    setShowApprovalDialog(false)
    setIncidentPendingApproval(null)
    
    toast.error('Incident resolution rejected', {
      description: 'Automated workflow was not executed'
    })
  }

  const activeIncidents = (incidents || []).filter(i => i.status === 'in-progress' || i.status === 'new')
  const pendingApprovalIncidents = (incidents || []).filter(i => i.status === 'pending-approval')
  const resolvedIncidents = (incidents || []).filter(i => i.status === 'resolved')
  const failedIncidents = (incidents || []).filter(i => i.status === 'failed')

  const filteredIncidents = useMemo(() => {
    let filtered = incidents || []
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(query) || 
        i.description.toLowerCase().includes(query)
      )
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(i => i.status === filterStatus)
    }
    
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(i => i.severity === filterSeverity)
    }
    
    return filtered
  }, [incidents, searchQuery, filterStatus, filterSeverity])

  const hasActiveFilters = searchQuery !== '' || filterStatus !== 'all' || filterSeverity !== 'all'

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterSeverity('all')
  }

  const handleSelectIncident = (incidentId: string, selected: boolean) => {
    setSelectedIncidents(current =>
      selected
        ? [...current, incidentId]
        : current.filter(id => id !== incidentId)
    )
  }

  const handleClearSelection = () => {
    setSelectedIncidents([])
    setSelectionMode(false)
  }

  const templatesByCategory = getTemplatesByCategory()
  const categories = ['all', ...Object.keys(templatesByCategory)]
  
  const filteredTemplates = templateSearch
    ? searchTemplates(templateSearch)
    : selectedCategory === 'all'
    ? workflowTemplates
    : templatesByCategory[selectedCategory] || []

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
  }

  const applyTemplateToIncident = () => {
    if (!selectedTemplate) return
    
    setNewIncident({
      title: selectedTemplate.name,
      description: selectedTemplate.description,
      severity: selectedTemplate.severity[0],
      templateId: selectedTemplate.id
    })
    setShowTemplates(false)
    setShowNewIncident(true)
    setSelectedTemplate(null)
  }

  const patterns = useMemo(() => 
    analyzeIncidentPatterns(incidents || []), 
    [incidents]
  )

  const predictiveInsights = useMemo(() => 
    generatePredictiveInsights(incidents || [], patterns),
    [incidents, patterns]
  )

  const predictiveScore = useMemo(() => 
    calculatePredictiveScore(incidents || []),
    [incidents]
  )

  const priorityQueue = useMemo(() => {
    if (!prioritySettings) return []
    
    const queueableIncidents = (incidents || []).filter(
      inc => inc.status === 'new' || inc.status === 'pending-approval'
    )
    
    const queue = queueableIncidents.map(inc => 
      createQueueItem(inc, prioritySettings)
    )
    
    return sortQueueByPriority(queue)
  }, [incidents, prioritySettings])

  const queueMetrics = useMemo(() => 
    getQueueMetrics(priorityQueue),
    [priorityQueue]
  )

  const anomalyDataPoints = useMemo(() => 
    convertIncidentsToMetricDataPoints(incidents || [], 3600000),
    [incidents]
  )

  const anomalyResults = useMemo(() => {
    if (!anomalyThresholds || anomalyDataPoints.length === 0) return []
    return detectAnomalies(anomalyDataPoints, anomalyAlgorithm, anomalyThresholds)
  }, [anomalyDataPoints, anomalyAlgorithm, anomalyThresholds])

  const timeSeriesMetrics = useMemo(() => {
    if (anomalyDataPoints.length === 0) return {
      mean: 0, median: 0, stdDev: 0, variance: 0,
      min: 0, max: 0, q1: 0, q3: 0, iqr: 0, mad: 0,
      trend: 'stable' as const, seasonality: false
    }
    return calculateTimeSeriesMetrics(anomalyDataPoints.map(p => p.value))
  }, [anomalyDataPoints])

  const detectedAnomalies = useMemo(() => 
    anomalyResults.filter(a => a.isAnomaly),
    [anomalyResults]
  )

  useEffect(() => {
    if ((agentTeams || []).length === 0 && agents.length > 0) {
      const enhancedAgents = agents.map((agent, idx) => 
        createEnhancedAgent(
          agent,
          idx === 0 ? 'supervisor' : 'specialist',
          idx === 0 ? ['coordination', 'detection', 'analysis'] : 
          idx === 1 ? ['analysis', 'detection'] :
          idx === 2 ? ['resolution', 'analysis'] :
          ['verification', 'analysis']
        )
      )
      
      if (enhancedAgents.length >= 4) {
        const team1 = createAgentTeam(
          'Incident Response Team Alpha',
          enhancedAgents[0],
          [enhancedAgents[1], enhancedAgents[2]],
          'Critical incident detection and rapid response'
        )
        
        const team2 = createAgentTeam(
          'Analysis & Resolution Team Beta',
          enhancedAgents[1],
          [enhancedAgents[2], enhancedAgents[3]],
          'Deep analysis and automated resolution workflows'
        )
        
        setAgentTeams([team1, team2])
      }
    }
  }, [agents.length, agentTeams?.length])

  const handleLogout = useCallback(() => {
    setAuthState(() => ({
      isAuthenticated: false,
      user: null,
      mode: 'demo',
      hasCompletedOnboarding: false
    }))
    toast.success('Signed out successfully', {
      description: 'You have been logged out'
    })
  }, [setAuthState])

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await window.spark.user()
        if (user) {
          setCurrentUser({
            id: user.id?.toString() || 'user-1',
            name: user.login || 'User',
            avatar: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.login || 'user'}`
          })
        } else {
          setCurrentUser({
            id: 'user-1',
            name: 'User',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
          })
        }
      } catch (error) {
        setCurrentUser({
          id: 'user-1',
          name: 'User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
        })
      }
    }
    loadCurrentUser()
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        handleLogout()
        toast.info('App reset to login screen', {
          description: 'Press Ctrl+Shift+R (or Cmd+Shift+R) to reset anytime'
        })
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleLogout])

  useEffect(() => {
    if ((incidents || []).length > 0) {
      const earliest = Math.min(...(incidents || []).map(i => i.createdAt))
      const latest = Math.max(...(incidents || []).map(i => i.createdAt))
      const endDate = new Date('2026-02-28T23:59:59Z').getTime()
      const metricsEndTime = Math.min(latest + 86400000, endDate)
      const metrics = generateMockExternalMetrics(earliest, metricsEndTime, 300000)
      setExternalMetrics(metrics)
    }
  }, [incidents])

  useEffect(() => {
    if (!prioritySettings?.enableAutoEscalation) return
    
    const checkEscalations = () => {
      priorityQueue.forEach(queueItem => {
        if (shouldEscalateIncident(queueItem, prioritySettings)) {
          const { updatedItem, shouldUpgradeSeverity, newSeverity } = escalateIncident(queueItem, prioritySettings)
          
          if (shouldUpgradeSeverity && newSeverity) {
            setIncidents(current =>
              (current || []).map(inc =>
                inc.id === queueItem.incident.id
                  ? { ...inc, severity: newSeverity, updatedAt: getCurrentTimestamp() }
                  : inc
              )
            )
            
            addEscalationNotification({
              incident: { ...queueItem.incident, severity: newSeverity },
              escalationCount: updatedItem.escalationCount,
              severityUpgraded: true,
              newSeverity
            })
            
            toast.warning(`Incident escalated to ${newSeverity.toUpperCase()}`, {
              description: `${queueItem.incident.title} has been automatically upgraded due to wait time`
            })
          } else {
            addEscalationNotification({
              incident: queueItem.incident,
              escalationCount: updatedItem.escalationCount,
              severityUpgraded: false
            })
          }
        }
      })
    }
    
    const interval = setInterval(checkEscalations, 30000)
    checkEscalations()
    
    return () => clearInterval(interval)
  }, [priorityQueue, prioritySettings, setIncidents, addEscalationNotification])

  const handleInsightClick = (insight: PredictiveInsight) => {
    setSelectedInsight(insight)
    if (insight.relatedPattern) {
      const pattern = patterns.find(p => p.id === insight.relatedPattern)
      setSelectedPattern(pattern || null)
    }
  }

  const handlePatternClick = (pattern: IncidentPattern) => {
    setSelectedPattern(pattern)
    setSelectedInsight(null)
  }

  const handleCreatePreventiveAction = (insight: PredictiveInsight) => {
    setNewIncident({
      title: `Preventive Action: ${insight.title}`,
      description: `Preventive action based on predictive insight:\n\n${insight.description}\n\nRecommended actions:\n${insight.preventionSteps?.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
      severity: insight.severity,
      templateId: ''
    })
    setSelectedInsight(null)
    setShowNewIncident(true)
    
    toast.success('Preventive action created', {
      description: 'Ready to execute proactive measures'
    })
  }

  const relatedIncidentsForInsight = useMemo(() => {
    if (!selectedInsight) return []
    return (incidents || []).filter(inc => 
      selectedInsight.historicalIncidents.includes(inc.id)
    )
  }, [selectedInsight, incidents])

  const handleLoadSampleData = () => {
    const sampleIncidents = generateSampleIncidents()
    setIncidents(current => [...sampleIncidents, ...(current || [])])
    toast.success('Sample data loaded', {
      description: `${sampleIncidents.length} historical incidents added for predictive analysis`
    })
  }

  const handleProcessFromQueue = (incidentId: string) => {
    const incident = (incidents || []).find(inc => inc.id === incidentId)
    if (!incident) return
    
    setSelectedIncident(incident)
    
    if (incident.status === 'new') {
      processIncident(incident)
    } else if (incident.status === 'pending-approval') {
      setIncidentPendingApproval(incident)
      setShowApprovalDialog(true)
    }
  }

  const handleShowMetricCorrelation = (incident: Incident) => {
    if (externalMetrics.length === 0) {
      toast.error('No external metrics available', {
        description: 'External metrics are generated from historical incident data'
      })
      return
    }
    
    const correlations = correlateIncidentWithMetrics(incident, externalMetrics)
    const analysis = analyzeMultiMetricCorrelation(incident, correlations)
    
    setSelectedIncidentForMetrics(incident)
    setMetricCorrelationAnalysis(analysis)
    setShowMetricCorrelation(true)
    
    toast.success('Metric correlation analysis complete', {
      description: `Analyzed ${correlations.length} external metrics`
    })
  }

  const handleChatbotRecommendationAction = (action: string) => {
    switch (action) {
      case 'open-pending-approvals':
        const pendingTab = document.querySelector('[value="pending"]')
        if (pendingTab instanceof HTMLElement) {
          pendingTab.click()
        }
        break
      case 'process-new-incidents':
        const activeTab = document.querySelector('[value="active"]')
        if (activeTab instanceof HTMLElement) {
          activeTab.click()
        }
        break
      case 'open-anomaly-dashboard':
        setShowAnomalyDetection(true)
        break
      case 'open-analytics':
        setShowAnalytics(true)
        break
      case 'open-knowledge-base':
        setShowKnowledgeBase(true)
        break
      case 'open-esql-console':
        setShowESQLDashboard(true)
        break
      case 'open-workflow-templates':
        setShowTemplates(true)
        break
      default:
        break
    }
  }

  const handleVoiceCommand = useCallback((action: string, params?: Record<string, string>) => {
    if (biometricSettings?.enabled && !biometricVerified && action !== 'verify-voice' && action !== 'open-biometrics' && action !== 'help') {
      toast.warning('Voice biometric verification required', {
        description: 'Please verify your identity before executing commands'
      })
      setShowBiometricVerification(true)
      return
    }
    
    switch (action) {
      case 'create-incident':
        setShowNewIncident(true)
        break
      case 'show-incidents':
        const allTab = document.querySelector('[value="all"]')
        if (allTab instanceof HTMLElement) {
          allTab.click()
        }
        break
      case 'show-active':
        const activeTab = document.querySelector('[value="active"]')
        if (activeTab instanceof HTMLElement) {
          activeTab.click()
        }
        break
      case 'show-pending':
        const pendingTab = document.querySelector('[value="pending"]')
        if (pendingTab instanceof HTMLElement) {
          pendingTab.click()
        }
        break
      case 'show-resolved':
        const resolvedTab = document.querySelector('[value="resolved"]')
        if (resolvedTab instanceof HTMLElement) {
          resolvedTab.click()
        }
        break
      case 'open-analytics':
        setShowAnalytics(true)
        break
      case 'open-queue':
        setShowPriorityQueue(true)
        break
      case 'open-predictions':
        setShowPredictiveAnalytics(true)
        break
      case 'open-anomalies':
        setShowAnomalyDetection(true)
        break
      case 'open-elasticsearch':
        setShowElasticsearchDashboard(true)
        break
      case 'open-esql':
        setShowESQLDashboard(true)
        break
      case 'open-streaming':
        setShowLiveStreaming(true)
        break
      case 'open-templates':
        setShowTemplates(true)
        break
      case 'open-settings':
        setShowSettings(true)
        break
      case 'open-knowledge-base':
        setShowKnowledgeBase(true)
        break
      case 'open-sla':
      case 'show-sla':
      case 'open-sla-dashboard':
        setShowSLADashboard(true)
        break
      case 'generate-article':
        if (resolvedIncidents.length > 0) {
          setShowGenerateArticle(true)
        } else {
          toast.warning('No resolved incidents available to generate articles from')
        }
        break
      case 'start-agent-analysis':
        if (selectedIncident && selectedIncident.status === 'new') {
          processIncident(selectedIncident)
        } else if (activeIncidents.length > 0) {
          processIncident(activeIncidents[0])
        } else {
          toast.warning('No incidents available to process')
        }
        break
      case 'approve-incident':
        if (incidentPendingApproval) {
          handleApprove()
        } else if (pendingApprovalIncidents.length > 0) {
          setIncidentPendingApproval(pendingApprovalIncidents[0])
          setShowApprovalDialog(true)
        } else {
          toast.info('No incidents awaiting approval')
        }
        break
      case 'reject-incident':
        if (incidentPendingApproval) {
          handleReject()
        } else {
          toast.info('No incidents selected for rejection')
        }
        break
      case 'filter-critical':
        setFilterSeverity('critical')
        break
      case 'filter-high':
        setFilterSeverity('high')
        break
      case 'clear-filters':
        handleClearFilters()
        break
      case 'toggle-theme':
        const themeToggleBtn = document.querySelector('[data-theme-toggle]')
        if (themeToggleBtn instanceof HTMLElement) {
          themeToggleBtn.click()
        }
        break
      case 'load-sample-data':
        handleLoadSampleData()
        break
      case 'export-data':
        const exportBtn = document.querySelector('[data-export-button]')
        if (exportBtn instanceof HTMLElement) {
          exportBtn.click()
        }
        break
      case 'open-chatbot':
        const chatbotBtn = document.querySelector('[data-chatbot-toggle]')
        if (chatbotBtn instanceof HTMLElement) {
          chatbotBtn.click()
        }
        break
      case 'refresh-data':
        window.location.reload()
        break
      case 'help':
        setShowVoiceCommands(true)
        break
      case 'verify-voice':
        setShowBiometricVerification(true)
        break
      case 'open-biometrics':
        setShowBiometrics(true)
        break
      case 'stop-listening':
        break
      default:
        toast.info('Command not implemented yet')
    }
  }, [
    selectedIncident,
    activeIncidents,
    incidentPendingApproval,
    pendingApprovalIncidents,
    handleApprove,
    handleReject,
    handleClearFilters,
    handleLoadSampleData,
    processIncident,
    biometricSettings,
    biometricVerified
  ])

  const handleBiometricVerification = (result: BiometricVerificationResult, updatedProfile?: VoiceProfile) => {
    if (result.verified) {
      setBiometricVerified(true)
      setCurrentVerifiedUser(result.userName || null)
      
      if (updatedProfile) {
        setVoiceProfiles((current) => 
          (current || []).map(p => p.id === updatedProfile.id ? updatedProfile : p)
        )
      }
      
      toast.success('Biometric verification successful', {
        description: `Welcome, ${result.userName}! Voice commands are now enabled.`
      })
    } else {
      setBiometricVerified(false)
      setCurrentVerifiedUser(null)
    }
  }

  const handleGenerateArticle = async (incident: Incident) => {
    setIsGeneratingArticle(true)
    setShowArticlePrompt(false)
    try {
      const article = await generateKnowledgeArticle(incident)
      setKnowledgeArticles((current) => [article, ...(current || [])])
      
      const user = await window.spark.user()
      const auditLog = createAuditLog(
        user?.id?.toString() || 'system',
        user?.login || 'System',
        'knowledge.article.created',
        'knowledge_article',
        article.id,
        `Generated knowledge article "${article.title}" from incident ${incident.id}`,
        true,
        { incidentId: incident.id, autoGenerated: true }
      )
      setAuditLogs((current) => [auditLog, ...(current || [])])
      
      toast.success('Knowledge article generated!', {
        description: `"${article.title}" has been added to the knowledge base`
      })
      
      setSelectedArticle(article)
      setShowArticleViewer(true)
    } catch (error) {
      console.error('Failed to generate article:', error)
      toast.error('Failed to generate article', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsGeneratingArticle(false)
      setIncidentForArticle(null)
    }
  }

  const handleDismissArticlePrompt = () => {
    setShowArticlePrompt(false)
    setIncidentForArticle(null)
  }

  const handleArticleSelect = (article: KnowledgeArticle) => {
    setSelectedArticle(article)
    setShowArticleViewer(true)
    setShowKnowledgeBase(false)
  }

  const handleViewArticle = (articleId: string) => {
    setKnowledgeArticles((current) => incrementArticleView(current || [], articleId))
  }

  const handleRateArticle = (articleId: string, helpful: boolean) => {
    setKnowledgeArticles((current) => rateKnowledgeArticle(current || [], articleId, helpful))
  }

  const handleBackToKnowledgeBase = () => {
    setShowArticleViewer(false)
    setSelectedArticle(null)
    setShowKnowledgeBase(true)
  }

  const handleAddComment = async (incidentId: string, content: string, mentions: string[], parentId?: string, isInternal?: boolean, attachments?: CommentAttachment[]) => {
    if (!currentUser) return

    const comment = createComment(
      incidentId,
      currentUser.id,
      currentUser.name,
      currentUser.avatar,
      content,
      mentions,
      parentId,
      attachments,
      isInternal || false
    )

    setComments((current) => [comment, ...(current || [])])

    const activity = createActivity(
      incidentId,
      currentUser.id,
      currentUser.name,
      currentUser.avatar,
      'comment',
      `commented on the incident${parentId ? ' (reply)' : ''}${attachments && attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}` : ''}`,
      { commentId: comment.id, isReply: !!parentId, hasAttachments: !!attachments && attachments.length > 0, attachmentCount: attachments?.length || 0 }
    )
    setActivities((current) => [activity, ...(current || [])])

    if (mentions.length > 0) {
      mentions.forEach(mentionedUser => {
        const mentionActivity = createActivity(
          incidentId,
          currentUser.id,
          currentUser.name,
          currentUser.avatar,
          'mention',
          `mentioned @${mentionedUser} in a comment`,
          { mentionedUser, commentId: comment.id }
        )
        setActivities((current) => [mentionActivity, ...(current || [])])
      })
    }

    const attachmentText = attachments && attachments.length > 0 ? ` with ${attachments.length} attachment${attachments.length > 1 ? 's' : ''}` : ''
    toast.success(`Comment posted successfully${attachmentText}`)
  }

  const handleUpdateComment = (commentId: string, content: string, mentions: string[]) => {
    setComments((current) =>
      (current || []).map(c =>
        c.id === commentId ? updateComment(c, content, mentions) : c
      )
    )
    toast.success('Comment updated')
  }

  const handleDeleteComment = (commentId: string) => {
    setComments((current) => deleteComment(current || [], commentId))
    toast.success('Comment deleted')
  }

  const handleAddReaction = (commentId: string, reactionType: ReactionType) => {
    if (!currentUser) return

    setComments((current) =>
      (current || []).map(c =>
        c.id === commentId
          ? addReaction(c, currentUser.id, currentUser.name, currentUser.avatar, reactionType)
          : c
      )
    )
  }

  const incidentComments = useMemo(() => {
    if (!selectedIncident) return []
    return getCommentsForIncident(comments || [], selectedIncident.id)
  }, [selectedIncident, comments])

  const incidentActivities = useMemo(() => {
    if (!selectedIncident) return []
    return getActivitiesForIncident(activities || [], selectedIncident.id)
  }, [selectedIncident, activities])

  const userMentions = useMemo(() => {
    if (!currentUser) return []
    return getUserMentions(comments || [], currentUser.name)
  }, [currentUser, comments])

  const teamMembers = useMemo(() => {
    const uniqueUsers = new Map<string, { id: string; name: string; avatar: string }>()
    ;(comments || []).forEach(comment => {
      uniqueUsers.set(comment.userId, {
        id: comment.userId,
        name: comment.userName,
        avatar: comment.userAvatar
      })
    })
    if (currentUser) {
      uniqueUsers.set(currentUser.id, currentUser)
    }
    return Array.from(uniqueUsers.values())
  }, [comments, currentUser])

  const relatedIncidentsForArticle = useMemo(() => {
    if (!selectedArticle) return []
    return (incidents || []).filter(inc => 
      selectedArticle.relatedIncidentIds.includes(inc.id)
    )
  }, [selectedArticle, incidents])

  const totalAttachmentsCount = useMemo(() => {
    return incidentComments.reduce((total, comment) => {
      return total + (comment.attachments?.length || 0)
    }, 0)
  }, [incidentComments])

  const handleSLABreachDetected = (breach: SLABreach) => {
    setSlaBreaches((current) => [breach, ...(current || [])])
    
    const user = window.spark.user().then(user => {
      const auditLog = createAuditLog(
        user?.id?.toString() || 'system',
        user?.login || 'System',
        'sla.breach.detected',
        'incident',
        breach.incidentId,
        `SLA breach detected for ${breach.incidentTitle}: ${breach.breachType} deadline exceeded by ${formatSLATime(breach.timeOverBreach)}`,
        false,
        { 
          breachType: breach.breachType, 
          severity: breach.severity,
          timeOverBreach: breach.timeOverBreach 
        }
      )
      setAuditLogs((current) => [auditLog, ...(current || [])])
    })
  }

  const formatSLATime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return `${seconds}s`
    }
  }

  const handleLogin = async (email: string, name: string) => {
    const user: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'admin',
      createdAt: Date.now()
    }

    setAuthState((current) => ({
      isAuthenticated: true,
      user,
      mode: current?.mode || 'demo',
      hasCompletedOnboarding: current?.hasCompletedOnboarding || false
    }))
  }

  const handleSkipLogin = () => {
    setAuthState((current) => ({
      isAuthenticated: true,
      user: {
        id: 'guest',
        email: 'guest@demo.local',
        name: 'Guest User',
        role: 'viewer',
        createdAt: Date.now()
      },
      mode: current?.mode || 'demo',
      hasCompletedOnboarding: current?.hasCompletedOnboarding || false
    }))
  }

  const handleSelectMode = (mode: 'demo' | 'api') => {
    if (mode === 'api') {
      setShowAPIConfig(true)
    } else {
      setAuthState((current) => ({
        isAuthenticated: current?.isAuthenticated ?? false,
        user: current?.user ?? null,
        mode: 'demo',
        hasCompletedOnboarding: true
      }))
      
      if ((incidents || []).length === 0) {
        handleLoadSampleData()
      }
    }
  }

  const handleSaveAPIConfig = (config: APIConfig) => {
    setApiConfig(config)
    setAuthState((current) => ({
      isAuthenticated: current?.isAuthenticated ?? false,
      user: current?.user ?? null,
      mode: 'api',
      hasCompletedOnboarding: true
    }))
    setShowAPIConfig(false)
  }

  const handleSwitchMode = (newMode: 'demo' | 'api') => {
    if (newMode === 'api' && !apiConfig) {
      setShowAPIConfig(true)
    } else {
      setAuthState((current) => ({
        isAuthenticated: current?.isAuthenticated ?? false,
        user: current?.user ?? null,
        mode: newMode,
        hasCompletedOnboarding: current?.hasCompletedOnboarding ?? false
      }))
      
      if (newMode === 'demo' && (incidents || []).length === 0) {
        handleLoadSampleData()
      }
    }
  }

  const handleLogout = () => {
    setAuthState(() => ({
      isAuthenticated: false,
      user: null,
      mode: 'demo',
      hasCompletedOnboarding: false
    }))
    toast.success('Signed out successfully', {
      description: 'You have been logged out'
    })
  }

  if (!authState?.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onSkip={handleSkipLogin} />
  }

  if (!authState?.hasCompletedOnboarding) {
    return (
      <>
        <WelcomeScreen onSelectMode={handleSelectMode} />
        <APIConfigurationDialog
          isOpen={showAPIConfig}
          onClose={() => {
            setShowAPIConfig(false)
            setAuthState((current) => ({
              isAuthenticated: current?.isAuthenticated ?? false,
              user: current?.user ?? null,
              mode: 'demo',
              hasCompletedOnboarding: true
            }))
          }}
          onSave={handleSaveAPIConfig}
          initialConfig={apiConfig || undefined}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground settings={backgroundSettings || {
        particleDensity: 100,
        particleSpeed: 100,
        nodeSpeed: 100,
        showGrid: true,
        showConnections: true,
        showDataFlows: true
      }} />
      <MouseTrail />
      
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Lightning size={28} weight="duotone" className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Elastic Agent Orchestrator</h1>
                  <Badge 
                    variant={authState?.mode === 'api' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {authState?.mode === 'api' ? (
                      <>
                        <Database size={12} className="mr-1" weight="fill" />
                        API Mode
                      </>
                    ) : (
                      <>
                        <Play size={12} className="mr-1" weight="fill" />
                        Demo Mode
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Multi-Agent DevOps Incident Response</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <UserMenu 
                user={authState?.user || null} 
                onSettings={() => setShowSettings(true)}
                onLogout={handleLogout}
              />
              <ThemeToggle />
              <Button 
                onClick={() => setShowSLADashboard(true)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <Target size={20} className="mr-2" weight="duotone" />
                SLA Management
                {(slaBreaches || []).filter(b => !b.acknowledged).length > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    {(slaBreaches || []).filter(b => !b.acknowledged).length}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => setShowKnowledgeBase(true)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <Book size={20} className="mr-2" weight="duotone" />
                Knowledge Base
                {(knowledgeArticles || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {(knowledgeArticles || []).length}
                  </Badge>
                )}
              </Button>
              {currentUser && userMentions.length > 0 && (
                <MentionsNotification
                  mentions={userMentions}
                  onMarkAsRead={() => {}}
                  onViewComment={(comment) => {
                    const incident = (incidents || []).find(inc => inc.id === comment.incidentId)
                    if (incident) {
                      setSelectedIncident(incident)
                      setShowCollaboration(true)
                    }
                  }}
                  currentUserName={currentUser.name}
                />
              )}
              <Button 
                onClick={() => setShowCollaborationStats(!showCollaborationStats)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <Users size={20} className="mr-2" weight="duotone" />
                Team Activity
                {(comments || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {(comments || []).length}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => setShowAgentHierarchy(true)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <UsersIcon size={20} className="mr-2" weight="duotone" />
                Agent Teams
                {(agentTeams || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {(agentTeams || []).length}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => setShowIntegrationHub(true)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <Plugs size={20} className="mr-2" weight="duotone" />
                Integrations
                {(integrations || []).filter(int => int.enabled).length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-success text-success-foreground">
                    {(integrations || []).filter(int => int.enabled).length} active
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => setShowSecurityDashboard(true)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <ShieldCheck size={20} className="mr-2" weight="duotone" />
                Security & Compliance
              </Button>
              {biometricSettings?.enabled && (
                <Button
                  onClick={() => setShowBiometricVerification(true)}
                  variant={biometricVerified ? "default" : "outline"}
                  size="lg"
                  className="relative"
                >
                  <Fingerprint size={20} className="mr-2" weight="duotone" />
                  {biometricVerified ? `Verified: ${currentVerifiedUser}` : 'Verify Identity'}
                  {biometricVerified && (
                    <Badge variant="secondary" className="ml-2 bg-success text-success-foreground">
                      <CheckCircle size={14} />
                    </Badge>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setShowBiometrics(true)}
                variant="outline"
                size="lg"
              >
                <Fingerprint size={20} className="mr-2" weight="duotone" />
                Voice Biometrics
                {(voiceProfiles || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {(voiceProfiles || []).length}
                  </Badge>
                )}
              </Button>
              <VoiceCommandButton 
                settings={voiceSettings || defaultVoiceSettings}
                onCommand={handleVoiceCommand}
                showTranscript={true}
              />
              <Button 
                onClick={() => setShowVoiceCommands(true)}
                variant="outline"
                size="lg"
              >
                <Microphone size={20} className="mr-2" weight="duotone" />
                Voice Help
              </Button>
              <Button 
                onClick={() => setShowESQLDashboard(true)}
                variant="outline"
                size="lg"
                className="relative"
              >
                <Code size={20} className="mr-2" weight="duotone" />
                ES|QL Console
              </Button>
              <Button 
                onClick={() => setShowElasticsearchDashboard(true)}
                variant={elasticsearch.isConnected ? "default" : "outline"}
                size="lg"
                className="relative"
              >
                <Database size={20} className="mr-2" weight="duotone" />
                Elasticsearch
                {elasticsearch.isConnected && (
                  <Badge variant="secondary" className="ml-2 bg-success text-success-foreground">
                    {elasticsearch.streams.filter(s => s.isActive).length} active
                  </Badge>
                )}
              </Button>
              {externalMetrics.length > 0 && (
                <Button 
                  onClick={() => setShowLiveStreaming(true)}
                  variant="outline" 
                  size="lg"
                  className="relative"
                >
                  <Broadcast size={20} className="mr-2" weight="duotone" />
                  Live Streaming
                  <span className="ml-2 h-2 w-2 bg-primary rounded-full animate-pulse" />
                </Button>
              )}
              {priorityQueue.length > 0 && (
                <Button 
                  onClick={() => setShowPriorityQueue(!showPriorityQueue)}
                  variant="outline" 
                  size="lg"
                  className="relative"
                >
                  <ListBullets size={20} className="mr-2" weight="duotone" />
                  Queue
                  <Badge variant="secondary" className="ml-2">
                    {priorityQueue.length}
                  </Badge>
                  {queueMetrics.overdueCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
                  )}
                </Button>
              )}
              {predictiveInsights.length > 0 && (
                <Button 
                  onClick={() => setShowPredictiveAnalytics(!showPredictiveAnalytics)}
                  variant="outline" 
                  size="lg"
                  className="relative"
                >
                  <Brain size={20} className="mr-2" weight="duotone" />
                  Predictions
                  <Badge variant="secondary" className="ml-2">
                    {predictiveInsights.length}
                  </Badge>
                  {predictiveInsights.some(i => i.confidence >= 75 && i.actionable) && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full animate-pulse" />
                  )}
                </Button>
              )}
              {detectedAnomalies.length > 0 && (
                <Button 
                  onClick={() => setShowAnomalyDetection(!showAnomalyDetection)}
                  variant="outline" 
                  size="lg"
                  className="relative"
                >
                  <Sliders size={20} className="mr-2" weight="duotone" />
                  Anomalies
                  <Badge variant="secondary" className="ml-2">
                    {detectedAnomalies.length}
                  </Badge>
                  {detectedAnomalies.some(a => a.severity === 'critical' || a.severity === 'high') && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
                  )}
                </Button>
              )}
              {(activeIncidents.length > 0 || (selectedIncident && selectedIncident.reasoningSteps.length > 0)) && (
                <Button 
                  onClick={() => {
                    if (!selectedIncident && activeIncidents.length > 0) {
                      setSelectedIncident(activeIncidents[0])
                    }
                    setShowCollaborationViz(true)
                  }}
                  variant="outline" 
                  size="lg"
                  className="relative"
                >
                  <GitBranch size={20} className="mr-2" weight="duotone" />
                  Agent Flow
                  <span className="ml-2 h-2 w-2 bg-primary rounded-full animate-pulse" />
                </Button>
              )}
              <Button onClick={() => setShowSettings(true)} variant="outline" size="lg">
                <Gear size={20} className="mr-2" weight="duotone" />
                Settings
                {notificationSettings?.enabled && notificationSettings.channels.length > 0 && (
                  <span className="ml-2 h-2 w-2 bg-success rounded-full animate-pulse" />
                )}
              </Button>
              <Button onClick={() => setShowTemplates(true)} variant="outline" size="lg">
                <Sparkle size={20} className="mr-2" weight="duotone" />
                Workflow Templates
              </Button>
              <Button onClick={() => setShowAnalytics(!showAnalytics)} variant="outline" size="lg">
                <ChartLine size={20} className="mr-2" weight="duotone" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </Button>
              <ExportIncidents incidents={incidents || []} />
              {(incidents || []).length === 0 && (
                <Button onClick={handleLoadSampleData} variant="outline" size="lg">
                  <Brain size={20} className="mr-2" weight="duotone" />
                  Load Sample Data
                </Button>
              )}
              <Button onClick={() => setShowNewIncident(true)} size="lg">
                <Plus size={20} className="mr-2" weight="bold" />
                New Incident
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="space-y-8">
          <MetricsDashboard incidents={incidents || []} />
          
          {externalMetrics.length > 0 && (
            <LiveMetricWidget
              metrics={externalMetrics}
              isStreaming={false}
              onOpenFullDashboard={() => setShowLiveStreaming(true)}
              maxMetrics={6}
            />
          )}
          
          {showPriorityQueue && priorityQueue.length > 0 && (
            <div className="animate-slide-in-right space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ListBullets size={24} weight="duotone" className="text-primary" />
                  Priority Queue
                  <Badge variant="secondary">{priorityQueue.length} waiting</Badge>
                </h2>
              </div>
              <QueueMetrics {...queueMetrics} />
              <PriorityQueueDisplay 
                queue={priorityQueue}
                onSelectIncident={handleProcessFromQueue}
              />
            </div>
          )}
          
          {showAnalytics && (
            <div className="animate-slide-in-right">
              <IncidentAnalytics incidents={incidents || []} />
            </div>
          )}

          {showPredictiveAnalytics && (incidents || []).length >= 3 && (
            <div className="animate-slide-in-right grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PredictiveInsights 
                insights={predictiveInsights}
                onInsightClick={handleInsightClick}
              />
              <PatternAnalysis 
                patterns={patterns}
                onPatternClick={handlePatternClick}
              />
            </div>
          )}

          {showAnomalyDetection && anomalyResults.length > 0 && (
            <div className="animate-slide-in-right space-y-6">
              <AnomalyDashboard
                anomalies={anomalyResults}
                metrics={timeSeriesMetrics}
                algorithm={anomalyAlgorithm}
                onAlgorithmChange={setAnomalyAlgorithm}
              />
              <AnomalyVisualization
                anomalies={anomalyResults}
                metrics={timeSeriesMetrics}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {selectedIncident && selectedIncident.reasoningSteps.length > 0 && (
            <div className="animate-slide-in-right space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <GitBranch size={24} weight="duotone" className="text-primary" />
                  Real-Time Agent Collaboration
                </h2>
                <Button 
                  onClick={() => setShowCollaborationViz(true)}
                  variant="outline"
                  size="lg"
                >
                  <ChartLine size={20} className="mr-2" weight="duotone" />
                  View Detailed Analysis
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AgentCollaborationGraph
                    agents={agents}
                    activeAgent={agents.find(a => a.status === 'thinking')?.type}
                    reasoningSteps={selectedIncident.reasoningSteps}
                  />
                </div>
                <div className="lg:col-span-1">
                  <AgentActivityFeed 
                    reasoningSteps={selectedIncident.reasoningSteps}
                    maxItems={8}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <IncidentFilters
              onSearch={setSearchQuery}
              onFilterStatus={setFilterStatus}
              onFilterSeverity={setFilterSeverity}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />
            
            <Button
              variant={selectionMode ? "default" : "outline"}
              onClick={() => {
                setSelectionMode(!selectionMode)
                if (selectionMode) {
                  setSelectedIncidents([])
                }
              }}
            >
              {selectionMode ? 'Exit Selection' : 'Select Multiple'}
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-3">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="all">
                All ({filteredIncidents.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeIncidents.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending Approval ({pendingApprovalIncidents.length})
                {pendingApprovalIncidents.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedIncidents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredIncidents.length === 0 ? (
                <Alert>
                  <CheckCircle size={20} />
                  <AlertDescription>
                    {hasActiveFilters 
                      ? 'No incidents match your filters.'
                      : 'No incidents yet. All systems operational.'}
                  </AlertDescription>
                </Alert>
              ) : (
                filteredIncidents.map(incident => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => !selectionMode && setSelectedIncident(incident)}
                    selected={selectedIncidents.includes(incident.id)}
                    onSelect={(selected) => handleSelectIncident(incident.id, selected)}
                    selectionMode={selectionMode}
                    metricCorrelationBadge={
                      !selectionMode && externalMetrics.length > 0 ? (
                        <MetricCorrelationBadge
                          incident={incident}
                          metrics={externalMetrics}
                          onClick={() => handleShowMetricCorrelation(incident)}
                        />
                      ) : undefined
                    }
                    similarArticlesBadge={
                      !selectionMode && (knowledgeArticles || []).length > 0 && incident.status === 'new' ? (
                        <SimilarArticlesBadge
                          incident={incident}
                          articles={knowledgeArticles || []}
                          onArticleClick={handleArticleSelect}
                        />
                      ) : undefined
                    }
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeIncidents.length === 0 ? (
                <Alert>
                  <CheckCircle size={20} />
                  <AlertDescription>
                    No active incidents. All systems operational.
                  </AlertDescription>
                </Alert>
              ) : (
                activeIncidents.map(incident => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => !selectionMode && setSelectedIncident(incident)}
                    selected={selectedIncidents.includes(incident.id)}
                    onSelect={(selected) => handleSelectIncident(incident.id, selected)}
                    selectionMode={selectionMode}
                    metricCorrelationBadge={
                      !selectionMode && externalMetrics.length > 0 ? (
                        <MetricCorrelationBadge
                          incident={incident}
                          metrics={externalMetrics}
                          onClick={() => handleShowMetricCorrelation(incident)}
                        />
                      ) : undefined
                    }
                    similarArticlesBadge={
                      !selectionMode && (knowledgeArticles || []).length > 0 && incident.status === 'new' ? (
                        <SimilarArticlesBadge
                          incident={incident}
                          articles={knowledgeArticles || []}
                          onArticleClick={handleArticleSelect}
                        />
                      ) : undefined
                    }
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingApprovalIncidents.length === 0 ? (
                <Alert>
                  <CheckCircle size={20} />
                  <AlertDescription>
                    No incidents awaiting approval.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert className="border-warning">
                    <ShieldCheck size={20} className="text-warning" />
                    <AlertDescription>
                      <strong>{pendingApprovalIncidents.length}</strong> incident{pendingApprovalIncidents.length !== 1 ? 's' : ''} require{pendingApprovalIncidents.length === 1 ? 's' : ''} human approval before automated resolution can proceed.
                    </AlertDescription>
                  </Alert>
                  {pendingApprovalIncidents.map(incident => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onClick={() => !selectionMode && setSelectedIncident(incident)}
                      selected={selectedIncidents.includes(incident.id)}
                      onSelect={(selected) => handleSelectIncident(incident.id, selected)}
                      selectionMode={selectionMode}
                      metricCorrelationBadge={
                        !selectionMode && externalMetrics.length > 0 ? (
                          <MetricCorrelationBadge
                            incident={incident}
                            metrics={externalMetrics}
                            onClick={() => handleShowMetricCorrelation(incident)}
                          />
                        ) : undefined
                      }
                      similarArticlesBadge={
                        !selectionMode && (knowledgeArticles || []).length > 0 && incident.status === 'new' ? (
                          <SimilarArticlesBadge
                            incident={incident}
                            articles={knowledgeArticles || []}
                            onArticleClick={handleArticleSelect}
                          />
                        ) : undefined
                      }
                    />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedIncidents.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No resolved incidents yet.
                  </AlertDescription>
                </Alert>
              ) : (
                resolvedIncidents.map(incident => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => !selectionMode && setSelectedIncident(incident)}
                    selected={selectedIncidents.includes(incident.id)}
                    onSelect={(selected) => handleSelectIncident(incident.id, selected)}
                    selectionMode={selectionMode}
                    metricCorrelationBadge={
                      !selectionMode && externalMetrics.length > 0 ? (
                        <MetricCorrelationBadge
                          incident={incident}
                          metrics={externalMetrics}
                          onClick={() => handleShowMetricCorrelation(incident)}
                        />
                      ) : undefined
                    }
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={showNewIncident} onOpenChange={setShowNewIncident}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Incident</DialogTitle>
            <DialogDescription>
              Report a new incident for agent analysis and automated resolution
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {newIncident.templateId && (
              <Alert>
                <Sparkle size={20} className="text-primary" />
                <AlertDescription>
                  Using workflow template: <strong>{newIncident.title}</strong>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Incident Title</Label>
              <Input
                id="title"
                placeholder="e.g., API Service High Latency"
                value={newIncident.title}
                onChange={e => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident symptoms and impact..."
                value={newIncident.description}
                onChange={e => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={newIncident.severity}
                onValueChange={(value) => 
                  setNewIncident(prev => ({ ...prev, severity: value as IncidentSeverity }))
                }
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewIncident(false)}>
              Cancel
            </Button>
            <Button onClick={createIncident}>Create Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Templates</DialogTitle>
            <DialogDescription>
              Select a pre-configured workflow template for common incident types
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <FunnelSimple size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredTemplates.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No templates found matching your criteria.
                  </AlertDescription>
                </Alert>
              ) : (
                filteredTemplates.map(template => (
                  <WorkflowTemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                  />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedTemplate !== null} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>Workflow Template Details</DialogTitle>
              </DialogHeader>
              
              <WorkflowTemplateDetail template={selectedTemplate} />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={applyTemplateToIncident}>
                  <Sparkle size={18} className="mr-2" weight="bold" />
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={selectedIncident !== null} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedIncident.title}</span>
                  <div className="flex items-center gap-2">
                    {totalAttachmentsCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAttachmentGallery(true)}
                      >
                        <ImageIcon size={18} className="mr-2" weight="duotone" />
                        Attachments
                        <Badge variant="secondary" className="ml-2">
                          {totalAttachmentsCount}
                        </Badge>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCollaboration(!showCollaboration)}
                    >
                      <ChatCircleDots size={18} className="mr-2" weight="duotone" />
                      {showCollaboration ? 'Hide' : 'Show'} Discussion
                      {incidentComments.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {incidentComments.length}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedIncident.description}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details & Analysis</TabsTrigger>
                  <TabsTrigger value="discussion">
                    Team Discussion
                    {incidentComments.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {incidentComments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    Activity Timeline
                    {incidentActivities.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {incidentActivities.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 py-4">
                  {(knowledgeArticles || []).length > 0 && (
                    <RelatedKnowledge
                      incident={selectedIncident}
                      articles={knowledgeArticles || []}
                      onArticleClick={handleArticleSelect}
                      maxArticles={3}
                    />
                  )}

                  {externalMetrics.length > 0 && (
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => handleShowMetricCorrelation(selectedIncident)}
                        className="w-full"
                      >
                        <ChartLine size={18} className="mr-2" weight="duotone" />
                        Analyze External Metric Correlations
                      </Button>
                    </div>
                  )}

                  {selectedIncident.reasoningSteps.length > 0 && (
                    <ReasoningLog steps={selectedIncident.reasoningSteps} maxHeight="500px" />
                  )}

                  {selectedIncident.proposedSolution && (
                    <Alert className="border-accent">
                      <GitBranch size={20} className="text-accent" />
                      <AlertDescription>
                        <div className="font-semibold mb-2">Proposed Solution:</div>
                        <div className="text-sm">{selectedIncident.proposedSolution}</div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {isProcessing && workflowProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{currentWorkflowStep}</span>
                        <span className="font-mono font-semibold">{Math.round(workflowProgress)}%</span>
                      </div>
                      <Progress value={workflowProgress} />
                    </div>
                  )}

                  {selectedIncident.resolution && (
                    <Alert className="border-success">
                      <CheckCircle size={20} className="text-success" />
                      <AlertDescription>
                        <div className="font-semibold mb-2">Resolution:</div>
                        <div className="text-sm">{selectedIncident.resolution}</div>
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="discussion" className="py-4">
                  {currentUser && (
                    <CommentThread
                      incidentId={selectedIncident.id}
                      comments={incidentComments}
                      currentUser={currentUser}
                      onAddComment={(content, mentions, parentId, isInternal) =>
                        handleAddComment(selectedIncident.id, content, mentions, parentId, isInternal)
                      }
                      onUpdateComment={handleUpdateComment}
                      onDeleteComment={handleDeleteComment}
                      onAddReaction={handleAddReaction}
                      teamMembers={teamMembers}
                      allowInternal={true}
                    />
                  )}
                </TabsContent>

                <TabsContent value="activity" className="py-4">
                  <ActivityFeed activities={incidentActivities} />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                {selectedIncident.status === 'new' && (
                  <Button
                    onClick={() => processIncident(selectedIncident)}
                    disabled={isProcessing}
                  >
                    <Lightning size={18} className="mr-2" weight="bold" />
                    Start Agent Analysis
                  </Button>
                )}

                {selectedIncident.status === 'in-progress' && 
                 selectedIncident.proposedSolution && 
                 !selectedIncident.requiresApproval &&
                 !isProcessing && (
                  <Button
                    onClick={() => executeResolution(selectedIncident)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <CheckCircle size={18} className="mr-2" weight="bold" />
                    Execute Resolution
                  </Button>
                )}

                {selectedIncident.status === 'pending-approval' && (
                  <Button
                    onClick={() => {
                      setIncidentPendingApproval(selectedIncident)
                      setShowApprovalDialog(true)
                    }}
                    className="bg-warning hover:bg-warning/90 text-warning-foreground"
                  >
                    <ShieldCheck size={18} className="mr-2" weight="bold" />
                    Review & Approve
                  </Button>
                )}

                {selectedIncident.status === 'resolved' && (
                  <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gear size={24} weight="duotone" className="text-primary" />
              System Settings
            </DialogTitle>
            <DialogDescription>
              Configure agent behavior, confidence thresholds, notification preferences, and visual effects
            </DialogDescription>
          </DialogHeader>

          <Tabs value={settingsTab} onValueChange={(value) => setSettingsTab(value as 'confidence' | 'notifications' | 'background' | 'priority' | 'anomaly' | 'mode')} className="py-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="mode" className="flex items-center gap-2">
                <Database size={18} weight="duotone" />
                Data Source
              </TabsTrigger>
              <TabsTrigger value="confidence" className="flex items-center gap-2">
                <ShieldCheck size={18} weight="duotone" />
                Agent Settings
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell size={18} weight="duotone" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="priority" className="flex items-center gap-2">
                <ListBullets size={18} weight="duotone" />
                Priority Queue
              </TabsTrigger>
              <TabsTrigger value="anomaly" className="flex items-center gap-2">
                <Sliders size={18} weight="duotone" />
                Anomaly Detection
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Microphone size={18} weight="duotone" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="background" className="flex items-center gap-2">
                <PaintBrush size={18} weight="duotone" />
                Background
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mode" className="space-y-4 mt-6">
              <ModeSwitcher
                currentMode={authState?.mode || 'demo'}
                apiConfig={apiConfig || null}
                onSwitchToDemo={() => handleSwitchMode('demo')}
                onConfigureAPI={() => setShowAPIConfig(true)}
              />
            </TabsContent>

            <TabsContent value="confidence" className="space-y-4 mt-6">
              {confidenceSettings && (
                <ConfidenceSettingsComponent
                  settings={confidenceSettings}
                  onChange={(newSettings) => setConfidenceSettings(newSettings)}
                />
              )}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-6">
              {notificationSettings && (
                <NotificationSettingsComponent
                  settings={notificationSettings}
                  onChange={(newSettings) => setNotificationSettings(newSettings)}
                />
              )}
            </TabsContent>

            <TabsContent value="priority" className="space-y-4 mt-6">
              {prioritySettings && (
                <PriorityQueueSettingsComponent
                  settings={prioritySettings}
                  onChange={(newSettings) => setPrioritySettings(newSettings)}
                />
              )}
            </TabsContent>

            <TabsContent value="anomaly" className="space-y-4 mt-6">
              {anomalyThresholds && (
                <AnomalyThresholdSettings
                  thresholds={anomalyThresholds}
                  onChange={(newThresholds) => setAnomalyThresholds(newThresholds)}
                />
              )}
            </TabsContent>

            <TabsContent value="voice" className="space-y-4 mt-6">
              {voiceSettings && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Voice Command Configuration</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure voice recognition settings
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowVoiceSettings(true)}
                    >
                      <Sliders size={18} className="mr-2" weight="duotone" />
                      Advanced Settings
                    </Button>
                  </div>
                  <VoiceCommandPanel
                    settings={voiceSettings}
                    onCommand={handleVoiceCommand}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="background" className="space-y-4 mt-6">
              {backgroundSettings && (
                <BackgroundSettingsComponent
                  settings={backgroundSettings}
                  onChange={(newSettings) => setBackgroundSettings(newSettings)}
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <APIConfigurationDialog
        isOpen={showAPIConfig}
        onClose={() => setShowAPIConfig(false)}
        onSave={handleSaveAPIConfig}
        initialConfig={apiConfig || null}
      />

      <ApprovalDialog
        incident={incidentPendingApproval}
        isOpen={showApprovalDialog}
        onClose={() => {
          setShowApprovalDialog(false)
          setIncidentPendingApproval(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />

      <BulkActions
        selectedIncidents={selectedIncidents}
        incidents={incidents || []}
        onClearSelection={handleClearSelection}
        onUpdateIncidents={setIncidents}
      />

      <CollaborationVisualization
        isOpen={showCollaborationViz}
        onClose={() => setShowCollaborationViz(false)}
        agents={agents}
        incident={selectedIncident}
      />

      <PredictiveInsightDetail
        insight={selectedInsight}
        pattern={selectedPattern || undefined}
        relatedIncidents={relatedIncidentsForInsight}
        isOpen={selectedInsight !== null}
        onClose={() => {
          setSelectedInsight(null)
          setSelectedPattern(null)
        }}
        onCreatePreventiveAction={handleCreatePreventiveAction}
      />

      <EscalationAlerts
        notifications={escalationNotifications}
        onDismiss={dismissEscalationNotification}
        onProcessIncident={handleProcessFromQueue}
      />

      <MetricCorrelationDashboard
        isOpen={showMetricCorrelation}
        onClose={() => {
          setShowMetricCorrelation(false)
          setSelectedIncidentForMetrics(null)
          setMetricCorrelationAnalysis(null)
        }}
        incident={selectedIncidentForMetrics}
        metrics={externalMetrics}
        analysis={metricCorrelationAnalysis}
      />

      <LiveCorrelationDashboard
        isOpen={showLiveStreaming}
        onClose={() => setShowLiveStreaming(false)}
        incident={selectedIncident}
        metrics={externalMetrics}
      />

      <ElasticsearchDashboard
        isOpen={showElasticsearchDashboard}
        onClose={() => setShowElasticsearchDashboard(false)}
        elasticsearch={elasticsearch}
      />

      <ESQLDashboard
        isOpen={showESQLDashboard}
        onClose={() => setShowESQLDashboard(false)}
        elasticsearch={elasticsearch}
      />

      <Chatbot
        incidents={incidents || []}
        onRecommendationAction={handleChatbotRecommendationAction}
      />

      <Dialog open={showVoiceCommands} onOpenChange={setShowVoiceCommands}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microphone size={24} weight="duotone" className="text-primary" />
              Voice Commands Reference
            </DialogTitle>
            <DialogDescription>
              Complete guide to available voice commands and settings
            </DialogDescription>
          </DialogHeader>
          <VoiceCommandPanel
            settings={voiceSettings || defaultVoiceSettings}
            onCommand={handleVoiceCommand}
          />
        </DialogContent>
      </Dialog>

      {voiceSettings && (
        <VoiceSettingsDialog
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          settings={voiceSettings}
          onChange={setVoiceSettings}
        />
      )}

      <Dialog open={showBiometrics} onOpenChange={setShowBiometrics}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <VoiceBiometricManager />
        </DialogContent>
      </Dialog>

      <VoiceBiometricVerification
        isOpen={showBiometricVerification}
        onClose={() => setShowBiometricVerification(false)}
        profiles={voiceProfiles || []}
        onVerificationComplete={handleBiometricVerification}
        settings={biometricSettings || defaultBiometricSettings}
      />

      <Dialog open={showAgentHierarchy} onOpenChange={setShowAgentHierarchy}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon size={24} weight="duotone" className="text-primary" />
              Agent Team Management & Collaboration
            </DialogTitle>
            <DialogDescription>
              Manage agent teams, monitor collaboration, and optimize performance
            </DialogDescription>
          </DialogHeader>
          <AgentHierarchyDashboard 
            teams={agentTeams || []}
            activeIncident={selectedIncident || undefined}
            onTeamUpdate={(updatedTeams) => setAgentTeams(updatedTeams)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showIntegrationHub} onOpenChange={setShowIntegrationHub}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plugs size={24} weight="duotone" className="text-primary" />
              Integration Hub
            </DialogTitle>
            <DialogDescription>
              Connect and manage external tools and services for automated workflows
            </DialogDescription>
          </DialogHeader>
          <IntegrationHub
            integrations={integrations || []}
            onIntegrationUpdate={setIntegrations}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showSecurityDashboard} onOpenChange={setShowSecurityDashboard}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={24} weight="duotone" className="text-primary" />
              Security & Compliance Dashboard
            </DialogTitle>
            <DialogDescription>
              Monitor compliance, security policies, audit logs, and permissions
            </DialogDescription>
          </DialogHeader>
          <SecurityComplianceDashboard
            userRole={userRole}
            auditLogs={auditLogs || []}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showKnowledgeBase && !showArticleViewer} onOpenChange={setShowKnowledgeBase}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book size={24} weight="duotone" className="text-primary" />
              Knowledge Base
            </DialogTitle>
            <DialogDescription>
              Browse AI-generated articles from resolved incidents
            </DialogDescription>
          </DialogHeader>
          <KnowledgeBase
            articles={knowledgeArticles || []}
            onArticleSelect={handleArticleSelect}
            onViewArticle={handleViewArticle}
            onRateArticle={handleRateArticle}
            onGenerateFromIncident={() => {
              if (resolvedIncidents.length === 0) {
                toast.warning('No resolved incidents available', {
                  description: 'Resolve incidents first to generate knowledge articles'
                })
                return
              }
              setShowKnowledgeBase(false)
              setShowGenerateArticle(true)
            }}
            isGenerating={isGeneratingArticle}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showArticleViewer} onOpenChange={(open) => {
        if (!open) {
          handleBackToKnowledgeBase()
        }
      }}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <KnowledgeArticleViewer
            article={selectedArticle}
            allArticles={knowledgeArticles || []}
            relatedIncidents={relatedIncidentsForArticle}
            onBack={handleBackToKnowledgeBase}
            onRateArticle={handleRateArticle}
            onSelectArticle={handleArticleSelect}
            onViewIncident={(incidentId) => {
              const incident = (incidents || []).find(inc => inc.id === incidentId)
              if (incident) {
                setSelectedIncident(incident)
                setShowArticleViewer(false)
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <GenerateArticleDialog
        isOpen={showGenerateArticle}
        onClose={() => setShowGenerateArticle(false)}
        resolvedIncidents={resolvedIncidents}
        onGenerate={handleGenerateArticle}
        isGenerating={isGeneratingArticle}
      />

      {showArticlePrompt && incidentForArticle && (
        <ArticleGenerationPrompt
          incident={incidentForArticle}
          onGenerate={() => handleGenerateArticle(incidentForArticle)}
          onDismiss={handleDismissArticlePrompt}
          isGenerating={isGeneratingArticle}
        />
      )}

      <Dialog open={showSLADashboard} onOpenChange={setShowSLADashboard}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target size={24} weight="duotone" className="text-primary" />
              SLA Management & Compliance
            </DialogTitle>
            <DialogDescription>
              Monitor service level agreements, track compliance, and manage breach alerts
            </DialogDescription>
          </DialogHeader>
          <SLADashboard 
            incidents={incidents || []}
            policies={slaPolicies || defaultSLAPolicies}
            escalationRules={escalationRules || defaultEscalationRules}
            onBreachDetected={handleSLABreachDetected}
            onIncidentUpdate={(incidentId, updates) => {
              setIncidents(current =>
                (current || []).map(inc =>
                  inc.id === incidentId ? { ...inc, ...updates } : inc
                )
              )
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCollaborationStats} onOpenChange={setShowCollaborationStats}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={24} weight="duotone" className="text-primary" />
              Team Collaboration Analytics
            </DialogTitle>
            <DialogDescription>
              Track team engagement, active contributors, and collaboration patterns
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CollaborationStats comments={comments || []} />
          </div>
        </DialogContent>
      </Dialog>

      {selectedIncident && (
        <AttachmentGallery
          comments={incidentComments}
          isOpen={showAttachmentGallery}
          onClose={() => setShowAttachmentGallery(false)}
        />
      )}
    </div>
  )
}

export default App
