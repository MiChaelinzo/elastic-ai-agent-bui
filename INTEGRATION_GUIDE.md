# Implementation Guide - Enterprise Feature Upgrades

This guide helps you integrate the newly created enterprise features into the existing DevOps Incident Response Platform.

## Overview of New Features

We've implemented 6 major enterprise-grade features:

1. **SLA Management & Tracking** - Track compliance with configurable policies
2. **Knowledge Base with AI** - Auto-generate documentation from incidents
3. **Incident Timeline** - Complete audit trail with event correlation
4. **Team Collaboration** - Comments, mentions, and reactions
5. **Advanced Search** - AI-powered search with filters
6. **Dependency Mapping** - Service impact and cascade analysis

## Quick Start Integration

### Step 1: Add Required Imports to App.tsx

```typescript
// New components
import { SLADashboard } from '@/components/SLADashboard'
import { KnowledgeBase } from '@/components/KnowledgeBase'
import { IncidentTimeline } from '@/components/IncidentTimeline'
import { CollaborationPanel } from '@/components/CollaborationPanel'
import { DependencyImpactView } from '@/components/DependencyImpactView'

// New libraries
import type { KnowledgeArticle } from '@/lib/knowledge-base'
import { generateKnowledgeArticle, rateArticle, incrementArticleView } from '@/lib/knowledge-base'
import type { Comment } from '@/lib/collaboration'
import { createComment, addReaction } from '@/lib/collaboration'
import { defaultSLAPolicies } from '@/lib/sla-management'

// New icons
import { Target, Book, Clock, ChatCircle, Graph } from '@phosphor-icons/react'
```

### Step 2: Add State Management

Add these state variables to your App component:

```typescript
// Knowledge Base
const [knowledgeArticles, setKnowledgeArticles] = useKV<KnowledgeArticle[]>('knowledge-articles', [])
const [showKnowledgeBase, setShowKnowledgeBase] = useState(false)

// SLA Management
const [showSLADashboard, setShowSLADashboard] = useState(false)

// Collaboration
const [comments, setComments] = useKV<Comment[]>('incident-comments', [])

// Current user (from spark.user())
const [currentUser, setCurrentUser] = useState<any>(null)

// Load current user
useEffect(() => {
  spark.user().then(setCurrentUser)
}, [])
```

### Step 3: Add Header Buttons

Add these buttons to your header toolbar:

```typescript
<Button 
  onClick={() => setShowSLADashboard(true)}
  variant="outline"
  size="lg"
>
  <Target size={20} className="mr-2" weight="duotone" />
  SLA Management
  {incidents.filter(i => i.status !== 'resolved').length > 0 && (
    <Badge variant="secondary" className="ml-2">
      {incidents.filter(i => i.status !== 'resolved').length} active
    </Badge>
  )}
</Button>

<Button 
  onClick={() => setShowKnowledgeBase(true)}
  variant="outline"
  size="lg"
>
  <Book size={20} className="mr-2" weight="duotone" />
  Knowledge Base
  {knowledgeArticles.length > 0 && (
    <Badge variant="secondary" className="ml-2">
      {knowledgeArticles.length}
    </Badge>
  )}
</Button>
```

### Step 4: Add Dialog Components

Add these dialogs before the closing `</div>` of your App component:

```typescript
{/* SLA Management Dashboard */}
<Dialog open={showSLADashboard} onOpenChange={setShowSLADashboard}>
  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Target size={24} weight="duotone" className="text-primary" />
        SLA Management & Compliance
      </DialogTitle>
      <DialogDescription>
        Monitor service level agreements and track compliance metrics
      </DialogDescription>
    </DialogHeader>
    <SLADashboard incidents={incidents || []} policies={defaultSLAPolicies} />
  </DialogContent>
</Dialog>

{/* Knowledge Base */}
<Dialog open={showKnowledgeBase} onOpenChange={setShowKnowledgeBase}>
  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Book size={24} weight="duotone" className="text-primary" />
        Knowledge Base
      </DialogTitle>
      <DialogDescription>
        Searchable repository of incident solutions and best practices
      </DialogDescription>
    </DialogHeader>
    <KnowledgeBase
      articles={knowledgeArticles}
      onArticleRate={(articleId, helpful) => {
        setKnowledgeArticles(current =>
          rateArticle(current || [], articleId, helpful)
        )
      }}
      onArticleView={(articleId) => {
        setKnowledgeArticles(current =>
          incrementArticleView(current || [], articleId)
        )
      }}
    />
  </DialogContent>
</Dialog>
```

### Step 5: Enhance Incident Detail Modal

Update your incident detail dialog to include new tabs:

```typescript
<Dialog open={selectedIncident !== null} onOpenChange={() => setSelectedIncident(null)}>
  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
    {selectedIncident && (
      <>
        <DialogHeader>
          <DialogTitle>{selectedIncident.title}</DialogTitle>
          <DialogDescription>{selectedIncident.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="reasoning" className="py-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reasoning">Reasoning Log</TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock size={16} className="mr-2" weight="duotone" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="impact">
              <Graph size={16} className="mr-2" weight="duotone" />
              Impact Analysis
            </TabsTrigger>
            <TabsTrigger value="collaboration">
              <ChatCircle size={16} className="mr-2" weight="duotone" />
              Collaboration
              <Badge variant="secondary" className="ml-2">
                {comments.filter(c => c.incidentId === selectedIncident.id).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reasoning">
            {selectedIncident.reasoningSteps.length > 0 && (
              <ReasoningLog steps={selectedIncident.reasoningSteps} />
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <IncidentTimeline incident={selectedIncident} />
          </TabsContent>

          <TabsContent value="impact">
            <DependencyImpactView incident={selectedIncident} />
          </TabsContent>

          <TabsContent value="collaboration">
            {currentUser && (
              <CollaborationPanel
                incidentId={selectedIncident.id}
                comments={comments}
                onAddComment={(comment) => {
                  setComments(current => [...(current || []), comment])
                }}
                onAddReaction={(commentId, emoji) => {
                  setComments(current =>
                    addReaction(current || [], commentId, emoji, currentUser.id, currentUser.login)
                  )
                }}
                currentUser={{
                  id: currentUser.id?.toString() || 'unknown',
                  name: currentUser.login || 'User',
                  avatar: currentUser.avatarUrl
                }}
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {/* Your existing action buttons */}
        </DialogFooter>
      </>
    )}
  </DialogContent>
</Dialog>
```

### Step 6: Add Auto-Generate Knowledge Articles

When an incident is resolved, automatically generate a knowledge article:

```typescript
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
    
    setIncidents(current =>
      (current || []).map(inc =>
        inc.id === incident.id ? resolvedIncident : inc
      )
    )

    // NEW: Auto-generate knowledge article
    try {
      const article = await generateKnowledgeArticle(resolvedIncident)
      setKnowledgeArticles(current => [article, ...(current || [])])
      
      toast.success('Incident resolved successfully!', {
        description: 'Knowledge article generated automatically'
      })
    } catch (error) {
      console.error('Failed to generate knowledge article:', error)
      toast.success('Incident resolved successfully!', {
        description: result.message
      })
    }
  } else {
    toast.error('Workflow execution failed')
  }

  setIsProcessing(false)
  setWorkflowProgress(0)
  setCurrentWorkflowStep('')
}
```

## Feature-Specific Integration

### SLA Management

**Configuration:**
The default SLA policies are:
- Critical: 15min response, 4hr resolution
- High: 30min response, 8hr resolution  
- Medium: 2hr response, 24hr resolution
- Low: 4hr response, 48hr resolution

**Customization:**
```typescript
import { defaultSLAPolicies, type SLAPolicy } from '@/lib/sla-management'

// Store custom policies
const [slaPolicies, setSLAPolicies] = useKV<SLAPolicy[]>('sla-policies', defaultSLAPolicies)

// Pass to SLA Dashboard
<SLADashboard incidents={incidents} policies={slaPolicies} />
```

**Display SLA on Incident Cards:**
```typescript
import { calculateSLAStatus, getSLAPolicy } from '@/lib/sla-management'

// Inside incident card rendering
const slaPolicy = getSLAPolicy(incident.severity, slaPolicies)
const slaStatus = slaPolicy ? calculateSLAStatus(incident, slaPolicy) : null

{slaStatus && (
  <Badge variant={slaStatus.status === 'breached' ? 'destructive' : 'secondary'}>
    SLA: {slaStatus.status}
  </Badge>
)}
```

### Knowledge Base

**Search Integration:**
```typescript
import { searchKnowledgeBase, findSimilarArticles } from '@/lib/knowledge-base'

// Search articles
const results = searchKnowledgeBase(knowledgeArticles, 'database connection', {
  category: 'solution',
  severity: 'critical'
})

// Find similar articles for an incident
const similarArticles = await findSimilarArticles(incident, knowledgeArticles)
```

**Manual Article Creation:**
```typescript
const createManualArticle = () => {
  const article: KnowledgeArticle = {
    id: `kb-${Date.now()}`,
    title: 'How to Debug Memory Leaks',
    content: '...',
    summary: 'Step-by-step guide...',
    tags: ['memory', 'debugging', 'performance'],
    category: 'procedure',
    relatedIncidentIds: [],
    views: 0,
    helpful: 0,
    notHelpful: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: currentUser.login,
    autoGenerated: false
  }
  
  setKnowledgeArticles(current => [article, ...(current || [])])
}
```

### Team Collaboration

**Mention Notifications:**
When a comment mentions a user (@username), you can trigger notifications:

```typescript
import { extractMentions } from '@/lib/collaboration'

const handleAddComment = (comment: Comment) => {
  setComments(current => [...(current || []), comment])
  
  // Send notifications to mentioned users
  const mentions = extractMentions(comment.content)
  mentions.forEach(async (username) => {
    // Implement your notification logic
    console.log(`Notify ${username} about new mention in incident`)
  })
}
```

**Thread Organization:**
```typescript
import { organizeCommentThreads, getCommentCount } from '@/lib/collaboration'

const threads = organizeCommentThreads(comments)
const totalComments = getCommentCount(comments)
```

### Service Dependency Mapping

**Custom Services:**
```typescript
import { sampleServiceDependencies, type ServiceDependency } from '@/lib/dependency-mapping'

// Add custom service
const customServices: ServiceDependency[] = [
  ...sampleServiceDependencies,
  {
    id: 'payment-service',
    name: 'Payment Processing Service',
    type: 'service',
    status: 'healthy',
    dependencies: ['api-gateway', 'database'],
    dependents: ['web-app'],
    criticality: 'critical'
  }
]

<DependencyImpactView incident={incident} services={customServices} />
```

**Get Impact Metrics:**
```typescript
import { analyzeIncidentImpact } from '@/lib/dependency-mapping'

const impact = analyzeIncidentImpact(incident, services)
console.log(`Estimated users affected: ${impact.estimatedUsersAffected}`)
console.log(`Business impact: ${impact.businessImpact}`)
console.log(`Cascade risk: ${(impact.cascadeRisk * 100).toFixed(0)}%`)
```

### Advanced Search

**Implement Search Bar:**
```typescript
import { performAdvancedSearch, parseSearchQuery, generateSearchSuggestions } from '@/lib/advanced-search'
import { useState, useMemo } from 'react'

const [searchQuery, setSearchQuery] = useState('')
const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

// Parse and search
const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery])
const searchResults = useMemo(() => 
  performAdvancedSearch(incidents, parsedQuery),
  [incidents, parsedQuery]
)

// Generate suggestions as user types
useEffect(() => {
  if (searchQuery.length >= 2) {
    generateSearchSuggestions(searchQuery, incidents).then(setSuggestions)
  }
}, [searchQuery, incidents])
```

## Performance Optimization

### Memoization
All major computations use `useMemo` to prevent unnecessary recalculation:

```typescript
const slaStatuses = useMemo(() => {
  return activeIncidents.map(incident => {
    const policy = getSLAPolicy(incident.severity, policies)
    if (!policy) return null
    return calculateSLAStatus(incident, policy)
  }).filter(Boolean)
}, [activeIncidents, policies])
```

### Incremental Updates
Use functional updates to avoid stale closure issues:

```typescript
// ❌ DON'T
setComments([...comments, newComment])

// ✅ DO
setComments(current => [...(current || []), newComment])
```

## Testing Your Integration

### Test SLA Management
1. Create a critical incident
2. Wait 5 minutes
3. Check SLA Dashboard - should show "at-risk" status
4. Verify countdown timer is accurate

### Test Knowledge Base
1. Resolve an incident
2. Check if knowledge article was generated
3. Search for keywords from the incident
4. Rate the article as helpful

### Test Collaboration
1. Open an incident
2. Add a comment with @mention
3. Add emoji reaction to a comment
4. Reply to a comment (nested thread)
5. Verify comment count badge updates

### Test Dependency Mapping
1. Create incident with "API Gateway" in title
2. Open Impact Analysis tab
3. Verify affected services list includes dependents
4. Check user impact estimate and recommendations

## Troubleshooting

### Knowledge Base AI Generation Fails
- Ensure `spark.llm` API is available
- Check that incident has resolution text
- Verify internet connectivity for AI API

### Comments Not Persisting
- Ensure `useKV` hook is used for comments state
- Check that incidentId matches between comment and incident
- Verify user object has required fields (id, login)

### SLA Calculations Incorrect
- Check system time matches expected date range (2025-2026)
- Verify incident timestamps are using `getCurrentTimestamp()`
- Ensure SLA policies are loaded before calculation

### Dependency Analysis Shows No Services
- Check incident title/description contains service keywords
- Verify service dependency list is passed to component
- Add custom keyword mappings for your services

## Next Steps

After integrating these features, consider:

1. **Custom Dashboards** - Create role-specific views
2. **Webhooks** - Trigger external systems on events
3. **Advanced Analytics** - Export data for BI tools
4. **Mobile Optimization** - Responsive layouts for tablets
5. **Real-time Sync** - WebSocket updates for team collaboration

## Support

For issues or questions about these features, check:
- `FEATURE_UPGRADES.md` - Technical architecture details
- `PRD.md` - Complete feature specifications
- Component source files for inline documentation
