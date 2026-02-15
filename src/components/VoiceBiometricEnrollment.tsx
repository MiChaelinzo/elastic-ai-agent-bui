import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Microphone, Check, Warning, X, UserSound, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  type VoiceProfile,
  type BiometricEnrollmentSession,
  type BiometricSettings,
  extractVoiceFeatures,
  createEnrollmentSession,
  addEnrollmentSample,
  createVoiceProfile,
  defaultBiometricSettings,
  detectLiveness,
  detectSpoofing
} from '@/lib/voice-biometrics'

interface VoiceBiometricEnrollmentProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (profile: VoiceProfile) => void
  settings?: BiometricSettings
}

export function VoiceBiometricEnrollment({
  isOpen,
  onClose,
  onComplete,
  settings = defaultBiometricSettings
}: VoiceBiometricEnrollmentProps) {
  const [session, setSession] = useState<BiometricEnrollmentSession | null>(null)
  const [userName, setUserName] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (isOpen && !hasStarted) {
      initializeSession()
    }
  }, [isOpen, hasStarted])

  const initializeSession = async () => {
    try {
      const user = await window.spark.user()
      const userId = user?.id?.toString() || `user-${Date.now()}`
      setUserName(user?.login || '')
      
      const newSession = createEnrollmentSession(userId, settings)
      setSession(newSession)
      setHasStarted(true)
      
      toast.success('Voice enrollment started', {
        description: `Please record ${settings.enrollmentSamples} voice samples`
      })
    } catch (error) {
      toast.error('Failed to initialize enrollment session')
      console.error(error)
    }
  }

  const startRecording = async () => {
    if (!session) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      source.connect(analyserRef.current)

      visualizeAudioLevel()

      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false)
        setRecordingStatus('processing')
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processRecording(audioBlob)
        
        stream.getTracks().forEach(track => track.stop())
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingStatus('recording')
      setErrorMessage('')

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 3000)

    } catch (error) {
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access to enroll voice biometrics'
      })
      setRecordingStatus('error')
      setErrorMessage('Microphone access denied')
      console.error(error)
    }
  }

  const visualizeAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateLevel = () => {
      if (!analyserRef.current) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setAudioLevel(average / 255)
      
      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }
    
    updateLevel()
  }

  const processRecording = async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      const audioData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate

      if (settings.livenessDetection) {
        const isLive = detectLiveness(audioData, sampleRate)
        if (!isLive) {
          setRecordingStatus('error')
          setErrorMessage('Liveness detection failed. Please speak naturally.')
          toast.error('Liveness detection failed', {
            description: 'Please speak naturally and try again'
          })
          return
        }
      }

      const features = extractVoiceFeatures(audioData, sampleRate)

      if (settings.antiSpoofing) {
        const isSpoofed = detectSpoofing(features)
        if (isSpoofed) {
          setRecordingStatus('error')
          setErrorMessage('Spoofing detected. Please use your natural voice.')
          toast.error('Spoofing detected', {
            description: 'Please use your natural voice and try again'
          })
          return
        }
      }

      if (session) {
        const updatedSession = addEnrollmentSample(session, features)
        setSession(updatedSession)
        setRecordingStatus('success')

        toast.success(`Sample ${updatedSession.samples.length} of ${updatedSession.requiredSamples} recorded`, {
          description: 'Voice sample captured successfully'
        })

        if (updatedSession.isComplete) {
          completeEnrollment(updatedSession)
        } else {
          setTimeout(() => {
            setRecordingStatus('idle')
          }, 1000)
        }
      }

    } catch (error) {
      setRecordingStatus('error')
      setErrorMessage('Failed to process audio recording')
      toast.error('Processing failed', {
        description: 'Failed to extract voice features from recording'
      })
      console.error(error)
    }
  }

  const completeEnrollment = (completedSession: BiometricEnrollmentSession) => {
    const profile = createVoiceProfile(completedSession, userName)
    
    toast.success('Voice enrollment complete!', {
      description: 'Your voice biometric profile has been created'
    })
    
    onComplete(profile)
    onClose()
    resetEnrollment()
  }

  const resetEnrollment = () => {
    setSession(null)
    setHasStarted(false)
    setIsRecording(false)
    setRecordingStatus('idle')
    setErrorMessage('')
    setAudioLevel(0)
  }

  const handleClose = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    resetEnrollment()
    onClose()
  }

  const currentPhrase = session?.phrases[session.currentPhraseIndex] || ''

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserSound size={24} weight="duotone" className="text-primary" />
            Voice Biometric Enrollment
          </DialogTitle>
          <DialogDescription>
            Create your voice profile by recording {settings.enrollmentSamples} voice samples
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!session && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Initializing enrollment session...</p>
              </div>
            </div>
          )}

          {session && (
            <>
              <div>
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={session.samples.length > 0}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Enrollment Progress</Label>
                  <span className="text-sm font-mono">
                    {session.samples.length} / {session.requiredSamples}
                  </span>
                </div>
                <Progress value={session.progress} className="h-2" />
              </div>

              <Alert className={
                recordingStatus === 'success' ? 'border-success' :
                recordingStatus === 'error' ? 'border-destructive' :
                recordingStatus === 'recording' ? 'border-primary' :
                'border-muted'
              }>
                {recordingStatus === 'success' && <Check size={20} className="text-success" />}
                {recordingStatus === 'error' && <Warning size={20} className="text-destructive" />}
                {recordingStatus === 'recording' && <Microphone size={20} className="text-primary animate-pulse" />}
                {recordingStatus === 'idle' && <UserSound size={20} className="text-muted-foreground" />}
                
                <AlertDescription>
                  {recordingStatus === 'idle' && (
                    <div>
                      <p className="font-semibold mb-2">Sample {session.samples.length + 1}</p>
                      <p className="text-sm">Please read the following phrase clearly:</p>
                      <p className="text-lg font-semibold mt-2 text-primary">{currentPhrase}</p>
                    </div>
                  )}
                  {recordingStatus === 'recording' && (
                    <div>
                      <p className="font-semibold">Recording...</p>
                      <p className="text-sm">Speak clearly and naturally</p>
                    </div>
                  )}
                  {recordingStatus === 'processing' && (
                    <div>
                      <p className="font-semibold">Processing voice sample...</p>
                      <p className="text-sm">Analyzing biometric features</p>
                    </div>
                  )}
                  {recordingStatus === 'success' && (
                    <div>
                      <p className="font-semibold">Sample recorded successfully!</p>
                      <p className="text-sm">Voice features extracted and verified</p>
                    </div>
                  )}
                  {recordingStatus === 'error' && (
                    <div>
                      <p className="font-semibold">Recording failed</p>
                      <p className="text-sm">{errorMessage}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {isRecording && (
                <div className="space-y-2">
                  <Label>Audio Level</Label>
                  <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {settings.livenessDetection && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck size={16} weight="duotone" />
                  Liveness detection enabled
                </div>
              )}

              {settings.antiSpoofing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck size={16} weight="duotone" />
                  Anti-spoofing protection enabled
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRecording}>
            Cancel
          </Button>
          {session && !session.isComplete && (
            <Button
              onClick={startRecording}
              disabled={isRecording || recordingStatus === 'processing' || !userName.trim()}
            >
              <Microphone size={18} className="mr-2" weight="bold" />
              {isRecording ? 'Recording...' : `Record Sample ${session.samples.length + 1}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
