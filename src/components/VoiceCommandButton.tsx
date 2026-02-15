import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import { useVoiceRecognition } from '@/hooks/use-voice-recognition'
import type { VoiceRecognitionSettings } from '@/lib/voice-commands'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceCommandButtonProps {
  settings: VoiceRecognitionSettings
  onCommand: (action: string, params?: Record<string, string>) => void
  className?: string
  showTranscript?: boolean
}

export function VoiceCommandButton({ 
  settings, 
  onCommand,
  className = '',
  showTranscript = true
}: VoiceCommandButtonProps) {
  const voice = useVoiceRecognition(settings, onCommand)

  if (!voice.isSupported) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant={voice.isListening ? "destructive" : "outline"}
        size="lg"
        onClick={voice.toggleListening}
        className="relative group"
      >
        {voice.isListening ? (
          <>
            <MicrophoneSlash size={20} className="mr-2" weight="bold" />
            Listening...
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full">
              <span className="absolute inset-0 rounded-full bg-destructive animate-ping" />
            </span>
          </>
        ) : (
          <>
            <Microphone size={20} className="mr-2" weight="duotone" />
            Voice Commands
          </>
        )}
      </Button>

      <AnimatePresence>
        {showTranscript && voice.isListening && (voice.transcript || voice.interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 z-50 min-w-[300px] max-w-md"
          >
            <div className="p-4 bg-card border border-border rounded-lg shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                <span>Listening...</span>
              </div>
              <p className="text-base font-mono">
                {voice.transcript || voice.interimTranscript}
              </p>
              {voice.lastResult && voice.lastResult.confidence > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(voice.lastResult.confidence * 100)}% confident
                </Badge>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voice.error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-full mt-2 right-0 z-50 min-w-[300px]"
          >
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{voice.error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
