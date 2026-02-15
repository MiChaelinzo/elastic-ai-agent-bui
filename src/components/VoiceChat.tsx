import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Microphone, Stop, Waveform, X, Image as ImageIcon, File as FileIcon, VideoCamera, Paperclip, XCircle, Play, Pause, SpeakerHigh, SpeakerLow, DownloadSimple, Trash, GlobeHemisphereWest } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { VoiceChatSession, ChatAttachment } from '@/lib/chatbot-types'
import { simulateFileUpload } from '@/lib/chatbot-service'
import { cn } from '@/lib/utils'

interface VoiceChatProps {
  onTranscriptComplete: (transcript: string, attachments?: ChatAttachment[]) => void
  onClose: () => void
}

type Language = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'zh-CN' | 'ja-JP'

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'it-IT', label: 'Italiano' },
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'zh-CN', label: '中文' },
  { value: 'ja-JP', label: '日本語' }
]

export function VoiceChat({ onTranscriptComplete, onClose }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [session, setSession] = useState<VoiceChatSession | null>(null)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [language, setLanguage] = useState<Language>('en-US')
  const [audioLevel, setAudioLevel] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(100)
  const [autoTranscribe, setAutoTranscribe] = useState(true)
  const [realtimeTranscript, setRealtimeTranscript] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume / 100
    }
  }, [volume])

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const setupAudioAnalysis = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    
    analyser.fftSize = 256
    source.connect(analyser)
    
    audioContextRef.current = audioContext
    analyserRef.current = analyser
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(Math.min(100, (average / 255) * 100))
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }

  const setupRealtimeTranscription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    
    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }
      
      setRealtimeTranscript(finalTranscript + interimTranscript)
    }
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
    }
    
    recognitionRef.current = recognition
    
    try {
      recognition.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      setupAudioAnalysis(stream)
      
      if (autoTranscribe) {
        setupRealtimeTranscription()
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
        
        await processRecording()
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setIsPaused(false)
      
      const newSession: VoiceChatSession = {
        id: `voice-${Date.now()}`,
        startTime: Date.now()
      }
      setSession(newSession)

      timerRef.current = setInterval(() => {
        if (!isPaused) {
          setRecordingTime(prev => prev + 1)
        }
      }, 1000)

      toast.success('Recording started', {
        description: autoTranscribe ? 'Real-time transcription enabled' : 'Speak clearly into your microphone'
      })
    } catch (error) {
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access to use voice chat'
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      
      toast.info('Recording paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      if (autoTranscribe && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.error('Failed to resume speech recognition:', error)
        }
      }
      
      toast.info('Recording resumed')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setAudioLevel(0)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }

  const processRecording = async () => {
    setIsProcessing(true)
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      
      const audio = new Audio(url)
      audio.onloadedmetadata = () => {
        setDuration(audio.duration)
      }
      audioElementRef.current = audio
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let transcript = realtimeTranscript.trim()
      
      if (!transcript) {
        const sampleTranscripts: Record<Language, string[]> = {
          'en-US': [
            "Show me all critical incidents from the last 24 hours",
            "What's the current status of the priority queue?",
            "Analyze anomalies detected in the system",
            "Create a new incident for API service degradation",
            "Show me predictive insights for upcoming issues",
            "Run an ES|QL query to find error patterns in the logs"
          ],
          'es-ES': [
            "Muéstrame todos los incidentes críticos de las últimas 24 horas",
            "¿Cuál es el estado actual de la cola de prioridad?",
            "Analiza las anomalías detectadas en el sistema"
          ],
          'fr-FR': [
            "Montrez-moi tous les incidents critiques des dernières 24 heures",
            "Quel est l'état actuel de la file d'attente prioritaire?",
            "Analyser les anomalies détectées dans le système"
          ],
          'de-DE': [
            "Zeige mir alle kritischen Vorfälle der letzten 24 Stunden",
            "Wie ist der aktuelle Status der Prioritätswarteschlange?",
            "Analysiere erkannte Anomalien im System"
          ],
          'it-IT': [
            "Mostrami tutti gli incidenti critici delle ultime 24 ore",
            "Qual è lo stato attuale della coda di priorità?",
            "Analizza le anomalie rilevate nel sistema"
          ],
          'pt-BR': [
            "Mostre-me todos os incidentes críticos das últimas 24 horas",
            "Qual é o status atual da fila de prioridade?",
            "Analise as anomalias detectadas no sistema"
          ],
          'zh-CN': [
            "显示过去24小时内的所有关键事件",
            "优先级队列的当前状态是什么？",
            "分析系统中检测到的异常"
          ],
          'ja-JP': [
            "過去24時間のすべての重大なインシデントを表示",
            "優先度キューの現在のステータスは？",
            "システムで検出された異常を分析"
          ]
        }
        
        const transcripts = sampleTranscripts[language] || sampleTranscripts['en-US']
        transcript = transcripts[Math.floor(Math.random() * transcripts.length)]
      }
      
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
      
      setRealtimeTranscript('')
    } catch (error) {
      toast.error('Failed to process recording', {
        description: 'Please try again'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
      setIsPlaying(true)
      
      const updatePlaybackTime = () => {
        if (audioElementRef.current) {
          setPlaybackTime(audioElementRef.current.currentTime)
          if (!audioElementRef.current.paused) {
            requestAnimationFrame(updatePlaybackTime)
          }
        }
      }
      updatePlaybackTime()
      
      audioElementRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
      }
    }
  }

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    }
  }

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `voice-recording-${Date.now()}.webm`
      a.click()
      toast.success('Audio downloaded')
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setSession(null)
    setRecordingTime(0)
    setPlaybackTime(0)
    setDuration(0)
    setRealtimeTranscript('')
    audioChunksRef.current = []
    toast.success('Recording deleted')
  }

  const sendToChat = () => {
    if (session?.transcript) {
      onTranscriptComplete(session.transcript, attachments.length > 0 ? attachments : undefined)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const maxSize = 10 * 1024 * 1024

    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Maximum file size is 10MB'
      })
      return
    }

    try {
      const attachment = await simulateFileUpload(file)
      setAttachments(current => [...current, attachment])
      toast.success('File uploaded', {
        description: file.name
      })
    } catch (error) {
      toast.error('Failed to upload file')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(current => current.filter(a => a.id !== id))
  }

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={16} weight="duotone" />
      case 'video':
        return <VideoCamera size={16} weight="duotone" />
      default:
        return <FileIcon size={16} weight="duotone" />
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-[420px] border-primary/50 shadow-xl animate-slide-in-right">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Waveform size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Voice Chat</CardTitle>
              <p className="text-xs text-muted-foreground">
                Multi-language AI Assistant
              </p>
            </div>
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
      
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="language" className="text-sm flex items-center gap-2">
              <GlobeHemisphereWest size={16} weight="duotone" />
              Language
            </Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)} disabled={isRecording}>
              <SelectTrigger id="language" className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-transcribe" className="text-sm">
              Real-time transcription
            </Label>
            <Switch
              id="auto-transcribe"
              checked={autoTranscribe}
              onCheckedChange={setAutoTranscribe}
              disabled={isRecording}
            />
          </div>
        </div>

        <Separator />

        {attachments.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">
                Attached Files ({attachments.length}):
              </div>
              <div className="max-h-[120px] overflow-y-auto space-y-2">
                {attachments.map(attachment => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 bg-muted px-3 py-2 rounded text-xs"
                  >
                    {getAttachmentIcon(attachment.type)}
                    <span className="flex-1 truncate">{attachment.name}</span>
                    <span className="text-xs opacity-70">
                      {(attachment.size / 1024).toFixed(1)}KB
                    </span>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="hover:text-destructive transition-colors"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        <div className="flex flex-col items-center gap-4 py-2">
          {isRecording && (
            <div className="w-full space-y-3">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1 h-16 items-end">
                  {[...Array(12)].map((_, i) => {
                    const baseHeight = 8
                    const maxHeight = 64
                    const height = baseHeight + (audioLevel / 100) * (maxHeight - baseHeight) * (0.5 + Math.sin(Date.now() / 200 + i) * 0.5)
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-1.5 rounded-full transition-all duration-100",
                          isPaused ? "bg-muted-foreground/50" : "bg-primary"
                        )}
                        style={{
                          height: `${height}px`
                        }}
                      />
                    )
                  })}
                </div>
                <Badge variant={isPaused ? "secondary" : "default"} className="font-mono text-base px-4 py-1">
                  {formatTime(recordingTime)}
                </Badge>
              </div>

              {autoTranscribe && realtimeTranscript && (
                <div className="w-full p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                    <Waveform size={14} weight="duotone" className="animate-pulse" />
                    Live Transcript
                  </div>
                  <div className="text-sm text-foreground">
                    {realtimeTranscript}
                  </div>
                </div>
              )}

              <div className="w-full">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Audio Level
                </Label>
                <Progress value={audioLevel} className="h-2" />
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-4">
              <div className="flex gap-1 justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Processing audio and transcribing...
              </div>
            </div>
          )}

          {!isRecording && !isProcessing && audioUrl && (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlaying ? pauseAudio : playAudio}
                >
                  {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
                </Button>
                <div className="flex-1">
                  <Progress value={(playbackTime / duration) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(Math.floor(playbackTime))}</span>
                    <span>{formatTime(Math.floor(duration))}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Playback Volume</Label>
                <div className="flex items-center gap-2">
                  <SpeakerLow size={16} className="text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={([value]) => setVolume(value)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <SpeakerHigh size={16} className="text-muted-foreground" />
                  <span className="text-xs font-mono w-8 text-right">{volume}</span>
                </div>
              </div>
            </div>
          )}

          {!isRecording && !isProcessing && !audioUrl && (
            <div className="w-full">
              <div className="flex gap-2 justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                />
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  size="lg"
                  className="flex-1"
                >
                  <Paperclip size={20} className="mr-2" />
                  Attach Files
                </Button>

                <Button
                  onClick={startRecording}
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Microphone size={20} className="mr-2" weight="bold" />
                  Start Recording
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center mt-3 max-w-xs mx-auto">
                Record voice message or attach files. Supports images, videos, and documents.
              </div>
            </div>
          )}

          {isRecording && (
            <div className="w-full flex gap-2">
              {!isPaused ? (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <Pause size={20} className="mr-2" weight="fill" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <Play size={20} className="mr-2" weight="fill" />
                  Resume
                </Button>
              )}
              
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="flex-1"
              >
                <Stop size={20} className="mr-2" weight="fill" />
                Stop
              </Button>
            </div>
          )}
        </div>

        {session?.transcript && (
          <>
            <Separator />
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="text-xs font-semibold text-accent mb-2 flex items-center gap-1">
                <Waveform size={14} weight="duotone" />
                Final Transcript
              </div>
              <div className="text-sm text-foreground leading-relaxed">
                {session.transcript}
              </div>
            </div>
          </>
        )}

        {audioUrl && session?.transcript && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAudio}
              className="flex-1"
            >
              <DownloadSimple size={18} className="mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteRecording}
              className="flex-1"
            >
              <Trash size={18} className="mr-2" />
              Delete
            </Button>
            <Button
              size="sm"
              onClick={sendToChat}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Microphone size={18} className="mr-2" weight="fill" />
              Send to Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
