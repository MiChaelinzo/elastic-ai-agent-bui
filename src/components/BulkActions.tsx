import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { CheckCircle, Trash, Archive, FunnelSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Incident } from '@/lib/types'

interface BulkActionsProps {
  selectedIncidents: string[]
  incidents: Incident[]
  onClearSelection: () => void
  onUpdateIncidents: (updater: (incidents: Incident[]) => Incident[]) => void
}

export function BulkActions({ selectedIncidents, incidents, onClearSelection, onUpdateIncidents }: BulkActionsProps) {
  if (selectedIncidents.length === 0) return null

  const handleMarkAsResolved = () => {
    onUpdateIncidents(current =>
      current.map(incident =>
        selectedIncidents.includes(incident.id)
          ? {
              ...incident,
              status: 'resolved' as const,
              resolution: 'Manually marked as resolved via bulk action',
              updatedAt: Date.now()
            }
          : incident
      )
    )
    toast.success(`${selectedIncidents.length} incidents marked as resolved`)
    onClearSelection()
  }

  const handleDelete = () => {
    onUpdateIncidents(current =>
      current.filter(incident => !selectedIncidents.includes(incident.id))
    )
    toast.success(`${selectedIncidents.length} incidents deleted`)
    onClearSelection()
  }

  const handleArchive = () => {
    toast.info('Archive feature coming soon')
    onClearSelection()
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in-right">
      <div className="bg-card border border-primary shadow-lg rounded-lg px-6 py-4 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedIncidents.length} incident{selectedIncidents.length !== 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleMarkAsResolved}>
            <CheckCircle size={16} className="mr-2" weight="duotone" />
            Mark Resolved
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <FunnelSimple size={16} className="mr-2" weight="duotone" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleArchive}>
                <Archive size={16} className="mr-2" weight="duotone" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash size={16} className="mr-2" weight="duotone" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
