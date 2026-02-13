import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, Funnel, X } from '@phosphor-icons/react'
import type { IncidentSeverity, IncidentStatus } from '@/lib/types'

interface IncidentFiltersProps {
  onSearch: (query: string) => void
  onFilterStatus: (status: IncidentStatus | 'all') => void
  onFilterSeverity: (severity: IncidentSeverity | 'all') => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function IncidentFilters({ 
  onSearch, 
  onFilterStatus, 
  onFilterSeverity, 
  onClearFilters,
  hasActiveFilters 
}: IncidentFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <MagnifyingGlass 
          size={18} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
        />
        <Input
          placeholder="Search incidents by title, description..."
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select onValueChange={(value) => onFilterStatus(value as IncidentStatus | 'all')}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Funnel size={16} className="mr-2" />
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="pending-approval">Pending Approval</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={(value) => onFilterSeverity(value as IncidentSeverity | 'all')}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Funnel size={16} className="mr-2" />
          <SelectValue placeholder="All Severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchQuery('')
            onClearFilters()
          }}
          className="w-full sm:w-auto"
        >
          <X size={16} className="mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}
