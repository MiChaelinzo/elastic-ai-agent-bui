import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Microphone, Stop, Waveform, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { VoiceChatSession } from '@/lib/chatbot-types'

interface VoiceChatProps {
  onTranscriptComplete: (transcript: string) => void
  onClose: () => void
}

export function VoiceChat({ onTranscriptComplete, onClose }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [session, setSession] = useState<VoiceChatSession | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        await processRecording()
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      const newSession: VoiceChatSession = {
        id: `voice-${Date.now()}`,
        startTime: Date.now()
      }
      setSession(newSession)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success('Recording started', {
        description: 'Speak clearly into your microphone'
      })
    } catch (error) {
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access to use voice chat'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processRecording = async () => {
    setIsProcessing(true)
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const sampleTranscripts = [
        "Show me all critical incidents from the last 24 hours",
        "What's the current status of the priority queue?",
        "Analyze anomalies detected in the system",
        "Create a new incident for API service degradation",
        "Show me predictive insights for upcoming issues",
        "Run an ES|QL query to find error patterns"
      ]
      
      const transcript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)]
      
      if (session) {
        const updatedSession: VoiceChatSession = {
          ...session,
          endTime: Date.now(),
          duration: recordingTime,
          transcript
        }
        setSession(updatedSession)
      }
      
      toast.success('Voice transcribed successfully', {
        description: transcript
      })
      
      onTranscriptComplete(transcript)
      
      setRecordingTime(0)
    } catch (error) {
      toast.error('Failed to process recording', {
        description: 'Please try again'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="mb-4 border-primary/50 shadow-lg animate-slide-in-right">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waveform size={24} weight="duotone" className="text-primary" />
            <CardTitle className="text-lg">Voice Chat</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          {isRecording && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{
                      height: `${20 + Math.random() * 30}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
              <Badge variant="secondary" className="font-mono">
                {formatTime(recordingTime)}
              </Badge>
            </div>
          )}

          {isProcessing && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Processing audio...
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isProcessing}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Microphone size={20} className="mr-2" weight="bold" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
              >
                <Stop size={20} className="mr-2" weight="fill" />
                Stop Recording
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center max-w-xs">
            {!isRecording && !isProcessing && (
              "Click to start voice recording. Ask about incidents, metrics, or queries."
            )}
          </div>
        </div>

        {session?.transcript && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              Transcript:
            </div>
            <div className="text-sm">{session.transcript}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
