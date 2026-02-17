import type { Incident, IncidentSeverity, IncidentStatus } from './types'

export interface SearchQuery {
  text: string
  filters: SearchFilters
  sort: SearchSort
}

export interface SearchFilters {
  severity?: IncidentSeverity[]
  status?: IncidentStatus[]
  dateRange?: { start: number; end: number }
  agents?: string[]
  tags?: string[]
  hasResolution?: boolean
  requiresApproval?: boolean
}

export interface SearchSort {
  field: 'createdAt' | 'updatedAt' | 'severity' | 'status'
  direction: 'asc' | 'desc'
}

export interface SearchResult {
  incident: Incident
  relevanceScore: number
  matchedFields: string[]
  snippet: string
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'filter' | 'term'
  description: string
  count?: number
}

export function performAdvancedSearch(
  incidents: Incident[],
  query: SearchQuery
): SearchResult[] {
  let filtered = [...incidents]

  if (query.filters.severity && query.filters.severity.length > 0) {
    filtered = filtered.filter(i => query.filters.severity!.includes(i.severity))
  }

  if (query.filters.status && query.filters.status.length > 0) {
    filtered = filtered.filter(i => query.filters.status!.includes(i.status))
  }

  if (query.filters.dateRange) {
    filtered = filtered.filter(
      i =>
        i.createdAt >= query.filters.dateRange!.start &&
        i.createdAt <= query.filters.dateRange!.end
    )
  }

  if (query.filters.agents && query.filters.agents.length > 0) {
    filtered = filtered.filter(i =>
      query.filters.agents!.some(agent => i.assignedAgents.includes(agent as any))
    )
  }

  if (query.filters.hasResolution !== undefined) {
    filtered = filtered.filter(i =>
      query.filters.hasResolution ? !!i.resolution : !i.resolution
    )
  }

  if (query.filters.requiresApproval !== undefined) {
    filtered = filtered.filter(i =>
      query.filters.requiresApproval ? !!i.requiresApproval : !i.requiresApproval
    )
  }

  const searchText = query.text.toLowerCase()
  const results: SearchResult[] = filtered
    .map(incident => {
      const matchedFields: string[] = []
      let relevanceScore = 0

      if (incident.title.toLowerCase().includes(searchText)) {
        matchedFields.push('title')
        relevanceScore += 10
      }

      if (incident.description.toLowerCase().includes(searchText)) {
        matchedFields.push('description')
        relevanceScore += 5
      }

      if (incident.proposedSolution?.toLowerCase().includes(searchText)) {
        matchedFields.push('proposedSolution')
        relevanceScore += 7
      }

      if (incident.resolution?.toLowerCase().includes(searchText)) {
        matchedFields.push('resolution')
        relevanceScore += 8
      }

      const reasoningMatch = incident.reasoningSteps.some(step =>
        step.thought.toLowerCase().includes(searchText)
      )
      if (reasoningMatch) {
        matchedFields.push('reasoning')
        relevanceScore += 6
      }

      if (matchedFields.length === 0 && searchText.trim() === '') {
        relevanceScore = 1
        matchedFields.push('all')
      }

      const snippet = generateSnippet(incident, searchText)

      return {
        incident,
        relevanceScore,
        matchedFields,
        snippet
      }
    })
    .filter(r => r.relevanceScore > 0)

  results.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore
    }

    const fieldMap: Record<string, number> = {
      createdAt: 1,
      updatedAt: 1,
      severity: 2,
      status: 3
    }

    const aValue = fieldMap[query.sort.field]
      ? a.incident[query.sort.field as keyof Incident]
      : a.incident.createdAt
    const bValue = fieldMap[query.sort.field]
      ? b.incident[query.sort.field as keyof Incident]
      : b.incident.createdAt

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return query.sort.direction === 'desc' ? bValue - aValue : aValue - bValue
    }

    return 0
  })

  return results
}

function generateSnippet(incident: Incident, searchText: string): string {
  const content = [
    incident.title,
    incident.description,
    incident.proposedSolution,
    incident.resolution
  ]
    .filter(Boolean)
    .join(' ')

  if (!searchText.trim()) {
    return incident.description.substring(0, 150) + '...'
  }

  const lowerContent = content.toLowerCase()
  const index = lowerContent.indexOf(searchText.toLowerCase())

  if (index === -1) {
    return content.substring(0, 150) + '...'
  }

  const start = Math.max(0, index - 50)
  const end = Math.min(content.length, index + searchText.length + 50)

  let snippet = content.substring(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  return snippet
}

export async function generateSearchSuggestions(
  query: string,
  incidents: Incident[]
): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []

  if (query.trim().length < 2) {
    return [
      {
        text: 'critical incidents',
        type: 'filter',
        description: 'Show critical severity incidents',
        count: incidents.filter(i => i.severity === 'critical').length
      },
      {
        text: 'pending approval',
        type: 'filter',
        description: 'Show incidents requiring approval',
        count: incidents.filter(i => i.requiresApproval).length
      },
      {
        text: 'unresolved',
        type: 'filter',
        description: 'Show unresolved incidents',
        count: incidents.filter(i => i.status !== 'resolved').length
      }
    ]
  }

  const lowerQuery = query.toLowerCase()

  const titleMatches = new Set<string>()
  incidents.forEach(incident => {
    const words = incident.title.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.startsWith(lowerQuery) && word.length > lowerQuery.length) {
        titleMatches.add(word)
      }
    })
  })

  Array.from(titleMatches)
    .slice(0, 3)
    .forEach(term => {
      suggestions.push({
        text: term,
        type: 'term',
        description: 'Search term from incident titles'
      })
    })

  if (lowerQuery.includes('critical') || lowerQuery.includes('high')) {
    suggestions.push({
      text: 'severity:critical',
      type: 'filter',
      description: 'Filter by critical severity',
      count: incidents.filter(i => i.severity === 'critical').length
    })
  }

  if (lowerQuery.includes('resolve') || lowerQuery.includes('fix')) {
    suggestions.push({
      text: 'status:resolved',
      type: 'filter',
      description: 'Show resolved incidents',
      count: incidents.filter(i => i.status === 'resolved').length
    })
  }

  return suggestions
}

export function parseSearchQuery(input: string): SearchQuery {
  const filters: SearchFilters = {}
  let text = input

  const severityMatch = input.match(/severity:(critical|high|medium|low)/i)
  if (severityMatch) {
    filters.severity = [severityMatch[1].toLowerCase() as IncidentSeverity]
    text = text.replace(severityMatch[0], '').trim()
  }

  const statusMatch = input.match(/status:(new|in-progress|resolved|failed|pending-approval)/i)
  if (statusMatch) {
    filters.status = [statusMatch[1].toLowerCase() as IncidentStatus]
    text = text.replace(statusMatch[0], '').trim()
  }

  return {
    text: text.trim(),
    filters,
    sort: { field: 'createdAt', direction: 'desc' }
  }
}
