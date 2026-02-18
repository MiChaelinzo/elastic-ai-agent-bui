import type { Incident } from './types'

export interface SearchSuggestion {
  id: string
  type: 'recent' | 'popular' | 'ai-generated' | 'filter'
  text: string
  icon: string
  category?: string
  matchCount?: number
}

export interface SearchResult {
  incident: Incident
  relevanceScore: number
  matchedFields: string[]
  highlights: { field: string; text: string }[]
}

export interface SearchFilter {
  field: 'status' | 'severity' | 'dateRange' | 'agent' | 'tag'
  value: string | [number, number]
  label: string
}

export interface AISearchQuery {
  naturalLanguage: string
  parsedFilters: SearchFilter[]
  searchTerms: string[]
  intent: 'find' | 'analyze' | 'compare' | 'report'
}

export function generateSearchSuggestions(
  currentQuery: string,
  incidents: Incident[],
  recentSearches: string[]
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = []

  if (!currentQuery) {
    recentSearches.slice(0, 3).forEach((search, idx) => {
      suggestions.push({
        id: `recent-${idx}`,
        type: 'recent',
        text: search,
        icon: 'clock'
      })
    })

    suggestions.push(
      {
        id: 'pop-1',
        type: 'popular',
        text: 'critical incidents',
        icon: 'fire',
        category: 'severity'
      },
      {
        id: 'pop-2',
        type: 'popular',
        text: 'unresolved incidents',
        icon: 'warning',
        category: 'status'
      },
      {
        id: 'pop-3',
        type: 'popular',
        text: 'recent incidents',
        icon: 'calendar',
        category: 'date'
      }
    )

    return suggestions
  }

  const query = currentQuery.toLowerCase()

  const matchingIncidents = incidents.filter(inc =>
    inc.title.toLowerCase().includes(query) ||
    inc.description.toLowerCase().includes(query)
  )

  if (matchingIncidents.length > 0) {
    suggestions.push({
      id: 'match-1',
      type: 'filter',
      text: `Show ${matchingIncidents.length} matching incidents`,
      icon: 'list',
      matchCount: matchingIncidents.length
    })
  }

  const severities = ['critical', 'high', 'medium', 'low']
  severities.forEach(sev => {
    if (sev.includes(query)) {
      const count = incidents.filter(i => i.severity === sev).length
      suggestions.push({
        id: `sev-${sev}`,
        type: 'filter',
        text: `${sev} severity incidents`,
        icon: 'filter',
        category: 'severity',
        matchCount: count
      })
    }
  })

  const statuses = ['new', 'in-progress', 'pending-approval', 'resolved', 'failed']
  statuses.forEach(status => {
    if (status.includes(query)) {
      const count = incidents.filter(i => i.status === status).length
      suggestions.push({
        id: `status-${status}`,
        type: 'filter',
        text: `${status} incidents`,
        icon: 'filter',
        category: 'status',
        matchCount: count
      })
    }
  })

  const commonKeywords = ['api', 'database', 'cpu', 'memory', 'latency', 'error', 'timeout']
  commonKeywords.forEach(keyword => {
    if (keyword.includes(query) || query.includes(keyword)) {
      const count = incidents.filter(i =>
        i.title.toLowerCase().includes(keyword) ||
        i.description.toLowerCase().includes(keyword)
      ).length
      if (count > 0) {
        suggestions.push({
          id: `kw-${keyword}`,
          type: 'ai-generated',
          text: `${keyword} related incidents`,
          icon: 'sparkle',
          matchCount: count
        })
      }
    }
  })

  return suggestions.slice(0, 8)
}

export function parseNaturalLanguageQuery(query: string): AISearchQuery {
  const lowerQuery = query.toLowerCase()
  const parsedFilters: SearchFilter[] = []
  const searchTerms: string[] = []
  let intent: AISearchQuery['intent'] = 'find'

  if (lowerQuery.includes('critical')) {
    parsedFilters.push({
      field: 'severity',
      value: 'critical',
      label: 'Critical severity'
    })
  }
  if (lowerQuery.includes('high')) {
    parsedFilters.push({
      field: 'severity',
      value: 'high',
      label: 'High severity'
    })
  }

  if (lowerQuery.includes('unresolved') || lowerQuery.includes('open')) {
    parsedFilters.push({
      field: 'status',
      value: 'new',
      label: 'Unresolved'
    })
  }
  if (lowerQuery.includes('resolved') || lowerQuery.includes('closed')) {
    parsedFilters.push({
      field: 'status',
      value: 'resolved',
      label: 'Resolved'
    })
  }

  if (lowerQuery.includes('today')) {
    const now = Date.now()
    const startOfDay = now - (now % 86400000)
    parsedFilters.push({
      field: 'dateRange',
      value: [startOfDay, now],
      label: 'Today'
    })
  }
  if (lowerQuery.includes('this week')) {
    const now = Date.now()
    const weekAgo = now - 7 * 86400000
    parsedFilters.push({
      field: 'dateRange',
      value: [weekAgo, now],
      label: 'This week'
    })
  }

  if (lowerQuery.includes('analyze') || lowerQuery.includes('analysis')) {
    intent = 'analyze'
  } else if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
    intent = 'compare'
  } else if (lowerQuery.includes('report') || lowerQuery.includes('summary')) {
    intent = 'report'
  }

  const words = query.split(' ').filter(w => w.length > 2)
  const stopWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
  words.forEach(word => {
    if (!stopWords.includes(word.toLowerCase())) {
      searchTerms.push(word)
    }
  })

  return {
    naturalLanguage: query,
    parsedFilters,
    searchTerms,
    intent
  }
}

export function performAdvancedSearch(
  query: string,
  incidents: Incident[]
): SearchResult[] {
  const parsed = parseNaturalLanguageQuery(query)
  const results: SearchResult[] = []

  for (const incident of incidents) {
    let relevanceScore = 0
    const matchedFields: string[] = []
    const highlights: { field: string; text: string }[] = []

    parsed.searchTerms.forEach(term => {
      const termLower = term.toLowerCase()
      
      if (incident.title.toLowerCase().includes(termLower)) {
        relevanceScore += 10
        matchedFields.push('title')
        highlights.push({
          field: 'title',
          text: highlightText(incident.title, term)
        })
      }
      
      if (incident.description.toLowerCase().includes(termLower)) {
        relevanceScore += 5
        matchedFields.push('description')
        highlights.push({
          field: 'description',
          text: highlightText(incident.description, term)
        })
      }
    })

    parsed.parsedFilters.forEach(filter => {
      if (filter.field === 'severity' && incident.severity === filter.value) {
        relevanceScore += 15
        matchedFields.push('severity')
      }
      if (filter.field === 'status' && incident.status === filter.value) {
        relevanceScore += 15
        matchedFields.push('status')
      }
      if (filter.field === 'dateRange' && Array.isArray(filter.value)) {
        if (incident.createdAt >= filter.value[0] && incident.createdAt <= filter.value[1]) {
          relevanceScore += 10
          matchedFields.push('date')
        }
      }
    })

    if (relevanceScore > 0) {
      results.push({
        incident,
        relevanceScore,
        matchedFields: [...new Set(matchedFields)],
        highlights
      })
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

function highlightText(text: string, term: string): string {
  const regex = new RegExp(`(${term})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

export async function generateAISearchSummary(
  query: string,
  results: SearchResult[]
): Promise<string> {
  if (results.length === 0) {
    return `No incidents found matching "${query}". Try adjusting your search terms or filters.`
  }

  const totalIncidents = results.length
  const criticalCount = results.filter(r => r.incident.severity === 'critical').length
  const resolvedCount = results.filter(r => r.incident.status === 'resolved').length

  let summary = `Found ${totalIncidents} incident${totalIncidents !== 1 ? 's' : ''} matching "${query}". `

  if (criticalCount > 0) {
    summary += `${criticalCount} critical. `
  }
  
  if (resolvedCount > 0) {
    summary += `${resolvedCount} resolved. `
  }

  const topResult = results[0]
  if (topResult) {
    summary += `Most relevant: "${topResult.incident.title}"`
  }

  return summary
}
