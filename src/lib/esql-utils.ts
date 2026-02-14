export interface ESQLQueryHistoryItem {
  id: string
  query: string
  timestamp: number
  executionTime?: number
  rowCount?: number
  success: boolean
  error?: string
}

export const ESQL_KEYWORDS = [
  'FROM', 'WHERE', 'LIMIT', 'SORT', 'STATS', 'KEEP', 'DROP', 'RENAME', 
  'EVAL', 'DISSECT', 'GROK', 'ENRICH', 'MV_EXPAND', 'ROW',
  'BY', 'AS', 'ASC', 'DESC', 'NULLS', 'FIRST', 'LAST',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'RLIKE', 'IS', 'NULL'
]

export const ESQL_FUNCTIONS = [
  'AVG', 'COUNT', 'MAX', 'MIN', 'SUM', 'MEDIAN', 'PERCENTILE',
  'ABS', 'CEIL', 'FLOOR', 'ROUND', 'POW', 'SQRT', 'LOG', 'EXP',
  'LENGTH', 'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'REPLACE',
  'TO_STRING', 'TO_INTEGER', 'TO_LONG', 'TO_DOUBLE', 'TO_BOOLEAN', 'TO_DATETIME',
  'DATE_EXTRACT', 'DATE_FORMAT', 'DATE_PARSE', 'DATE_TRUNC', 'NOW',
  'COALESCE', 'GREATEST', 'LEAST', 'CASE', 'CIDR_MATCH', 'IP_PREFIX',
  'MV_COUNT', 'MV_AVG', 'MV_MAX', 'MV_MIN', 'MV_SUM', 'MV_CONCAT', 'MV_DEDUPE'
]

export const ESQL_OPERATORS = [
  '==', '!=', '>', '>=', '<', '<=', '+', '-', '*', '/', '%', '='
]

export const ESQL_SAMPLE_QUERIES = [
  {
    name: 'Basic log search',
    description: 'Search logs with filters',
    query: 'FROM logs-*\n| WHERE @timestamp >= NOW() - 1 hour\n| KEEP @timestamp, message, level\n| LIMIT 100'
  },
  {
    name: 'Aggregation by status',
    description: 'Count events by status code',
    query: 'FROM logs-*\n| STATS count = COUNT(*) BY status_code\n| SORT count DESC'
  },
  {
    name: 'Error rate analysis',
    description: 'Calculate error percentage',
    query: 'FROM logs-*\n| WHERE @timestamp >= NOW() - 1 hour\n| STATS total = COUNT(*), errors = COUNT(*) WHERE level == "error"\n| EVAL error_rate = errors / total * 100'
  },
  {
    name: 'Top users by requests',
    description: 'Find most active users',
    query: 'FROM logs-*\n| STATS request_count = COUNT(*) BY user_id\n| SORT request_count DESC\n| LIMIT 10'
  },
  {
    name: 'Performance metrics',
    description: 'Analyze response times',
    query: 'FROM logs-*\n| WHERE @timestamp >= NOW() - 1 hour\n| STATS avg_duration = AVG(duration), p95 = PERCENTILE(duration, 95), p99 = PERCENTILE(duration, 99)\n| EVAL avg_duration_ms = ROUND(avg_duration)'
  },
  {
    name: 'Network traffic analysis',
    description: 'Analyze network data by destination',
    query: 'FROM network-*\n| STATS total_bytes = SUM(bytes), packet_count = COUNT(*) BY destination_ip\n| EVAL total_mb = ROUND(total_bytes / 1024 / 1024, 2)\n| SORT total_bytes DESC\n| LIMIT 20'
  }
]

export interface ESQLToken {
  type: 'keyword' | 'function' | 'operator' | 'string' | 'number' | 'comment' | 'identifier' | 'pipe' | 'whitespace'
  value: string
  start: number
  end: number
}

export function tokenizeESQL(query: string): ESQLToken[] {
  const tokens: ESQLToken[] = []
  let position = 0

  while (position < query.length) {
    const char = query[position]
    
    if (/\s/.test(char)) {
      const start = position
      while (position < query.length && /\s/.test(query[position])) {
        position++
      }
      tokens.push({
        type: 'whitespace',
        value: query.slice(start, position),
        start,
        end: position
      })
      continue
    }

    if (char === '|') {
      tokens.push({
        type: 'pipe',
        value: '|',
        start: position,
        end: position + 1
      })
      position++
      continue
    }

    if (char === '"' || char === "'") {
      const start = position
      const quote = char
      position++
      while (position < query.length && query[position] !== quote) {
        if (query[position] === '\\') position++
        position++
      }
      position++
      tokens.push({
        type: 'string',
        value: query.slice(start, position),
        start,
        end: position
      })
      continue
    }

    if (/[0-9]/.test(char)) {
      const start = position
      while (position < query.length && /[0-9.]/.test(query[position])) {
        position++
      }
      tokens.push({
        type: 'number',
        value: query.slice(start, position),
        start,
        end: position
      })
      continue
    }

    if (/[a-zA-Z_@]/.test(char)) {
      const start = position
      while (position < query.length && /[a-zA-Z0-9_.*@-]/.test(query[position])) {
        position++
      }
      const value = query.slice(start, position)
      const upperValue = value.toUpperCase()
      
      let type: ESQLToken['type'] = 'identifier'
      if (ESQL_KEYWORDS.includes(upperValue)) {
        type = 'keyword'
      } else if (ESQL_FUNCTIONS.includes(upperValue)) {
        type = 'function'
      }
      
      tokens.push({
        type,
        value,
        start,
        end: position
      })
      continue
    }

    const twoCharOp = query.slice(position, position + 2)
    if (ESQL_OPERATORS.includes(twoCharOp)) {
      tokens.push({
        type: 'operator',
        value: twoCharOp,
        start: position,
        end: position + 2
      })
      position += 2
      continue
    }

    if (ESQL_OPERATORS.includes(char)) {
      tokens.push({
        type: 'operator',
        value: char,
        start: position,
        end: position + 1
      })
      position++
      continue
    }

    position++
  }

  return tokens
}

export function validateESQLQuery(query: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const trimmed = query.trim()

  if (!trimmed) {
    errors.push('Query cannot be empty')
    return { valid: false, errors }
  }

  if (!trimmed.toUpperCase().startsWith('FROM') && !trimmed.toUpperCase().startsWith('ROW')) {
    errors.push('Query must start with FROM or ROW command')
  }

  const pipes = (trimmed.match(/\|/g) || []).length
  const commands = trimmed.split('|').length - 1
  
  if (pipes !== commands) {
    errors.push('Mismatched pipe operators')
  }

  const openParens = (trimmed.match(/\(/g) || []).length
  const closeParens = (trimmed.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push('Mismatched parentheses')
  }

  const doubleQuotes = (trimmed.match(/"/g) || []).length
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unclosed double quote')
  }

  const singleQuotes = (trimmed.match(/'/g) || []).length
  if (singleQuotes % 2 !== 0) {
    errors.push('Unclosed single quote')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function getESQLAutocomplete(query: string, cursorPosition: number): string[] {
  const beforeCursor = query.slice(0, cursorPosition)
  const lastWord = beforeCursor.split(/\s+/).pop()?.toUpperCase() || ''
  
  if (!lastWord) {
    return ['FROM', 'ROW']
  }

  const suggestions: string[] = []

  ESQL_KEYWORDS.forEach(keyword => {
    if (keyword.startsWith(lastWord)) {
      suggestions.push(keyword)
    }
  })

  ESQL_FUNCTIONS.forEach(func => {
    if (func.startsWith(lastWord)) {
      suggestions.push(func + '()')
    }
  })

  return suggestions.slice(0, 10)
}

export function formatESQLQuery(query: string): string {
  const lines = query.split('\n')
  const formatted: string[] = []
  let indent = 0

  lines.forEach(line => {
    const trimmed = line.trim()
    if (!trimmed) {
      formatted.push('')
      return
    }

    if (trimmed.startsWith('|')) {
      formatted.push('  '.repeat(indent) + trimmed)
    } else if (trimmed.toUpperCase().startsWith('FROM') || trimmed.toUpperCase().startsWith('ROW')) {
      indent = 0
      formatted.push(trimmed)
      indent = 1
    } else {
      formatted.push('  '.repeat(indent) + trimmed)
    }
  })

  return formatted.join('\n')
}

export function saveQueryToHistory(query: string, result: { success: boolean; executionTime?: number; rowCount?: number; error?: string }): ESQLQueryHistoryItem {
  return {
    id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    query: query.trim(),
    timestamp: Date.now(),
    executionTime: result.executionTime,
    rowCount: result.rowCount,
    success: result.success,
    error: result.error
  }
}
