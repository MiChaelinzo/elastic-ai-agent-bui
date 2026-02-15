import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Microphone } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface VoiceCommandHintProps {
  command: string
  description: string
  className?: string
}

export function VoiceCommandHint({ command, description, className = '' }: VoiceCommandHintProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/20 rounded">
              <Microphone size={16} weight="duotone" className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Say:</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  "{command}"
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface VoiceCommandTooltipProps {
  commands: Array<{ command: string; description: string }>
  className?: string
}

export function VoiceCommandTooltip({ commands, className = '' }: VoiceCommandTooltipProps) {
  if (commands.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Microphone size={16} weight="duotone" />
        <span className="font-semibold">Voice Commands Available:</span>
      </div>
      {commands.map((cmd, index) => (
        <VoiceCommandHint
          key={index}
          command={cmd.command}
          description={cmd.description}
        />
      ))}
    </div>
  )
}
