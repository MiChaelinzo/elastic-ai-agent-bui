import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, X, Lightning } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Incident, IncidentSeverity } from '@/lib/types'

interface EscalationNotification {
  id: string
  incident: Incident
  escalationCount: number
  severityUpgraded: boolean
  newSeverity?: IncidentSeverity
  timestamp: number
}

interface EscalationAlertsProps {
  notifications: EscalationNotification[]
  onDismiss: (id: string) => void
  onProcessIncident: (incidentId: string) => void
}

export function EscalationAlerts({ notifications, onDismiss, onProcessIncident }: EscalationAlertsProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Alert className={`border-2 shadow-lg backdrop-blur ${
              notification.severityUpgraded 
                ? 'border-destructive bg-destructive/10' 
                : 'border-warning bg-warning/10'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUp 
                      size={20} 
                      weight="bold" 
                      className={notification.severityUpgraded ? 'text-destructive' : 'text-warning'}
                    />
                    <span className="font-semibold text-sm">
                      {notification.severityUpgraded ? 'Severity Upgraded!' : 'Auto-Escalation Alert'}
                    </span>
                  </div>
                  
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">{notification.incident.title}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="destructive" 
                        className="flex items-center gap-1"
                      >
                        <ArrowUp size={12} weight="bold" />
                        Escalated {notification.escalationCount}x
                      </Badge>
                      
                      {notification.severityUpgraded && notification.newSeverity && (
                        <Badge variant="destructive">
                          {notification.incident.severity.toUpperCase()} → {notification.newSeverity.toUpperCase()}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Incident has been waiting too long and requires immediate attention
                    </p>
                  </AlertDescription>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onProcessIncident(notification.incident.id)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Lightning size={14} className="mr-1" weight="bold" />
                      Process Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDismiss(notification.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(notification.id)}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useEscalationNotifications() {
  const [notifications, setNotifications] = useState<EscalationNotification[]>([])

  const addNotification = (notification: Omit<EscalationNotification, 'id' | 'timestamp'>) => {
    const newNotification: EscalationNotification = {
      ...notification,
      id: `escalation-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 3))
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(n => Date.now() - n.timestamp < 30000)
      )
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return {
    notifications,
    addNotification,
    dismissNotification
  }
}
