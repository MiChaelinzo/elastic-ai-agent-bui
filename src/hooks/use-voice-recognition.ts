import { useState, useEffect, useCallback, useRef } from 'react'
import type { VoiceRecognitionSettings } from '@/lib/voice-commands'
import { findMatchingCommand, extractParameters } from '@/lib/voice-commands'
import { toast } from 'sonner'

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

export interface VoiceRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  lastResult: VoiceRecognitionResult | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function useVoiceRecognition(
  settings: VoiceRecognitionSettings,
  onCommand?: (action: string, params?: Record<string, string>) => void
) {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    lastResult: null
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      setState(prev => ({ ...prev, isSupported: true }))
    } else {
      setState(prev => ({ 
        ...prev, 
        isSupported: false,
        error: 'Speech recognition not supported in this browser'
      }))
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!settings.voiceFeedback) return
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.1
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [settings.voiceFeedback])

  const processTranscript = useCallback((
    transcript: string, 
    confidence: number
  ) => {
    const command = findMatchingCommand(
      transcript, 
      confidence, 
      settings.confidenceThreshold
    )

    if (command) {
      const params = extractParameters(transcript, command)
      
      if (settings.voiceFeedback) {
        speak(`Executing ${command.description}`)
      }

      toast.success(`Voice command: ${command.description}`, {
        description: transcript
      })

      if (onCommand) {
        onCommand(command.action, params)
      }

      return true
    }

    return false
  }, [settings.confidenceThreshold, settings.voiceFeedback, speak, onCommand])

  const startListening = useCallback(() => {
    if (!state.isSupported || state.isListening) return

    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognitionAPI) return

    try {
      const recognition = new SpeechRecognitionAPI()
      
      recognition.continuous = settings.continuous
      recognition.interimResults = settings.interimResults
      recognition.lang = settings.language
      recognition.maxAlternatives = settings.maxAlternatives

      recognition.onstart = () => {
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: null,
          transcript: '',
          interimTranscript: ''
        }))
        
        if (settings.voiceFeedback) {
          speak('Voice commands active')
        }
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript
          const confidence = result[0].confidence

          if (result.isFinal) {
            finalTranscript += transcript
            
            const voiceResult: VoiceRecognitionResult = {
              transcript,
              confidence,
              isFinal: true,
              timestamp: Date.now()
            }

            setState(prev => ({
              ...prev,
              transcript: finalTranscript,
              interimTranscript: '',
              lastResult: voiceResult
            }))

            processTranscript(transcript, confidence)
          } else {
            interimTranscript += transcript
            
            setState(prev => ({
              ...prev,
              interimTranscript
            }))
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = 'Voice recognition error'
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected'
            break
          case 'audio-capture':
            errorMessage = 'No microphone found'
            break
          case 'not-allowed':
            errorMessage = 'Microphone permission denied'
            break
          case 'network':
            errorMessage = 'Network error'
            break
          default:
            errorMessage = `Error: ${event.error}`
        }

        setState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isListening: false
        }))

        if (event.error !== 'no-speech') {
          toast.error('Voice recognition error', {
            description: errorMessage
          })
        }
      }

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }))
        
        if (settings.continuous && settings.enabled) {
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current)
          }
          
          restartTimeoutRef.current = setTimeout(() => {
            try {
              recognition.start()
            } catch (error) {
              console.error('Failed to restart recognition:', error)
            }
          }, 1000)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start voice recognition',
        isListening: false
      }))
      toast.error('Failed to start voice recognition')
    }
  }, [
    state.isSupported, 
    state.isListening, 
    settings, 
    speak, 
    processTranscript
  ])

  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setState(prev => ({ 
      ...prev, 
      isListening: false,
      transcript: '',
      interimTranscript: ''
    }))

    if (settings.voiceFeedback) {
      speak('Voice commands deactivated')
    }
  }, [settings.voiceFeedback, speak])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    speak
  }
}
