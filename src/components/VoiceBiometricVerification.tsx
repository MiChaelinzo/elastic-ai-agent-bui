import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Microphone, ShieldCheck, CheckCircle, Warning, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  type VoiceProfile,
  type BiometricVerificationResult,
  type BiometricSettings,
  extractVoiceFeatures,
  verifyVoiceProfile,
  updateVoiceProfileWithVerification,
  detectLiveness,
  detectSpoofing,
  defaultBiometricSettings,
  enrollmentPhrases
} from '@/lib/voice-biometrics'

interface VoiceBiometricVerificationProps {
  isOpen: boolean
  onClose: () => void
  profiles: VoiceProfile[]
  onVerificationComplete: (result: BiometricVerificationResult, profile?: VoiceProfile) => void
  settings?: BiometricSettings
  requirePassphrase?: boolean
}

export function VoiceBiometricVerification({
  isOpen,
  onClose,
  profiles,
  onVerificationComplete,
  settings = defaultBiometricSettings,
  requirePassphrase = false
}: VoiceBiometricVerificationProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'success' | 'failed'>('idle')
  const [verificationResult, setVerificationResult] = useState<BiometricVerificationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [passphrase] = useState(enrollmentPhrases[0])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    if (profiles.length === 0) {
      toast.error('No voice profiles available', {
        description: 'Please enroll a voice profile first'
      })
      return
    }

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
        setStatus('processing')

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processVerification(audioBlob)

        stream.getTracks().forEach(track => track.stop())

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setStatus('recording')
      setErrorMessage('')
      setVerificationResult(null)

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, 3000)

    } catch (error) {
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access for voice verification'
      })
      setStatus('failed')
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

  const processVerification = async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      const audioData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate

      if (settings.livenessDetection) {
        const isLive = detectLiveness(audioData, sampleRate)
        if (!isLive) {
          setStatus('failed')
          setErrorMessage('Liveness detection failed')
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
          setStatus('failed')
          setErrorMessage('Spoofing detected')
          toast.error('Spoofing detected', {
            description: 'Please use your natural voice'
          })
          return
        }
      }

      let bestMatch: BiometricVerificationResult | null = null
      let bestProfile: VoiceProfile | null = null

      for (const profile of profiles) {
        const result = verifyVoiceProfile(features, profile, settings)

        if (!bestMatch || result.confidence > bestMatch.confidence) {
          bestMatch = result
          bestProfile = profile
        }

        if (result.verified) {
          break
        }
      }

      if (bestMatch) {
        setVerificationResult(bestMatch)

        if (bestMatch.verified && bestProfile) {
          setStatus('success')
          
          const updatedProfile = updateVoiceProfileWithVerification(
            bestProfile,
            bestMatch,
            settings
          )

          toast.success('Voice verification successful', {
            description: `Welcome, ${bestMatch.userName}!`
          })

          onVerificationComplete(bestMatch, updatedProfile)
        } else {
          setStatus('failed')
          setErrorMessage(bestMatch.reason || 'Voice verification failed')
          
          toast.error('Voice verification failed', {
            description: `Match score: ${Math.round(bestMatch.matchScore * 100)}% (Required: ${Math.round(bestMatch.threshold * 100)}%)`
          })

          onVerificationComplete(bestMatch)
        }
      } else {
        setStatus('failed')
        setErrorMessage('No voice profiles found')
        toast.error('Verification failed', {
          description: 'No enrolled voice profiles available'
        })
      }

    } catch (error) {
      setStatus('failed')
      setErrorMessage('Failed to process audio')
      toast.error('Processing failed', {
        description: 'Failed to extract voice features'
      })
      console.error(error)
    }
  }

  const handleClose = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    setStatus('idle')
    setVerificationResult(null)
    setErrorMessage('')
    setAudioLevel(0)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={24} weight="duotone" className="text-primary" />
            Voice Biometric Verification
          </DialogTitle>
          <DialogDescription>
            Verify your identity using voice biometrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert className={
            status === 'success' ? 'border-success' :
            status === 'failed' ? 'border-destructive' :
            status === 'recording' ? 'border-primary' :
            'border-muted'
          }>
            {status === 'success' && <CheckCircle size={20} className="text-success" />}
            {status === 'failed' && <Warning size={20} className="text-destructive" />}
            {status === 'recording' && <Microphone size={20} className="text-primary animate-pulse" />}
            {status === 'idle' && <ShieldCheck size={20} className="text-muted-foreground" />}

            <AlertDescription>
              {status === 'idle' && (
                <div>
                  {requirePassphrase ? (
                    <>
                      <p className="font-semibold mb-2">Voice Verification with Passphrase</p>
                      <p className="text-sm mb-2">Please read the following phrase clearly:</p>
                      <p className="text-lg font-semibold text-primary">{passphrase}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">Ready for Voice Verification</p>
                      <p className="text-sm">Speak naturally for 3 seconds to verify your identity</p>
                    </>
                  )}
                </div>
              )}
              {status === 'recording' && (
                <div>
                  <p className="font-semibold">Recording voice sample...</p>
                  <p className="text-sm">Speak clearly and naturally</p>
                </div>
              )}
              {status === 'processing' && (
                <div>
                  <p className="font-semibold">Analyzing voice biometrics...</p>
                  <p className="text-sm">Comparing with enrolled profiles</p>
                </div>
              )}
              {status === 'success' && verificationResult && (
                <div>
                  <p className="font-semibold">Verification Successful!</p>
                  <p className="text-sm">Welcome, {verificationResult.userName}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Match Confidence:</span>
                      <Badge variant="default">
                        {Math.round(verificationResult.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Security Level:</span>
                      <Badge variant="secondary">
                        {verificationResult.securityLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              {status === 'failed' && (
                <div>
                  <p className="font-semibold">Verification Failed</p>
                  <p className="text-sm">{errorMessage}</p>
                  {verificationResult && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Match Score:</span>
                        <span className="font-mono">
                          {Math.round(verificationResult.matchScore * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Required Threshold:</span>
                        <span className="font-mono">
                          {Math.round(verificationResult.threshold * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(verificationResult.matchScore / verificationResult.threshold) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audio Level</span>
                <span className="font-mono">{Math.round(audioLevel * 100)}%</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          )}

          {profiles.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p>Enrolled profiles: {profiles.length}</p>
              <p>Security level: {settings.securityLevel.toUpperCase()}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isRecording || status === 'processing'}>
            {status === 'success' || status === 'failed' ? 'Close' : 'Cancel'}
          </Button>
          {(status === 'idle' || status === 'failed') && (
            <Button
              onClick={startRecording}
              disabled={isRecording || profiles.length === 0}
            >
              <Microphone size={18} className="mr-2" weight="bold" />
              {status === 'failed' ? 'Try Again' : 'Start Verification'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
