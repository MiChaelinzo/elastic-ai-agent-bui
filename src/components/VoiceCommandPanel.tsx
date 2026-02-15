import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Microphone, 
  MicrophoneSlash, 
  SpeakerHigh,
  SpeakerSimpleSlash,
  List,
  MagnifyingGlass,
  Info
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { useVoiceRecognition } from '@/hooks/use-voice-recognition'
import type { VoiceRecognitionSettings } from '@/lib/voice-commands'
import { 
  voiceCommands, 
  voiceCommandCategories,
  searchCommands,
  type VoiceCommandCategory 
} from '@/lib/voice-commands'

interface VoiceCommandPanelProps {
  settings: VoiceRecognitionSettings
  onCommand: (action: string, params?: Record<string, string>) => void
  className?: string
}

export function VoiceCommandPanel({ 
  settings, 
  onCommand,
  className = ''
}: VoiceCommandPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<VoiceCommandCategory | 'all'>('all')
  
  const voice = useVoiceRecognition(settings, onCommand)

  const filteredCommands = searchQuery
    ? searchCommands(searchQuery)
    : selectedCategory === 'all'
    ? voiceCommands
    : voiceCommands.filter(cmd => cmd.category === selectedCategory)

  const categories: Array<VoiceCommandCategory | 'all'> = [
    'all',
    'incident',
    'agent',
    'analytics',
    'navigation',
    'settings',
    'system'
  ]

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${voice.isListening ? 'bg-destructive/20 animate-pulse' : 'bg-primary/20'}`}>
              {voice.isListening ? (
                <Microphone size={24} weight="duotone" className="text-destructive" />
              ) : (
                <MicrophoneSlash size={24} weight="duotone" className="text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Voice Commands</CardTitle>
              <CardDescription>
                {voice.isListening ? 'Listening for commands...' : 'Hands-free operation'}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {voice.isSupported ? (
              <>
                <Button
                  variant={voice.isListening ? "destructive" : "default"}
                  size="lg"
                  onClick={voice.toggleListening}
                  className="relative"
                >
                  {voice.isListening ? (
                    <>
                      <MicrophoneSlash size={20} className="mr-2" weight="bold" />
                      Stop Listening
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse" />
                    </>
                  ) : (
                    <>
                      <Microphone size={20} className="mr-2" weight="bold" />
                      Start Listening
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => voice.speak('Voice feedback test')}
                >
                  {settings.voiceFeedback ? (
                    <SpeakerHigh size={20} weight="duotone" />
                  ) : (
                    <SpeakerSimpleSlash size={20} weight="duotone" />
                  )}
                </Button>
              </>
            ) : (
              <Badge variant="destructive">Not Supported</Badge>
            )}
          </div>
        </div>

        {voice.isListening && (voice.transcript || voice.interimTranscript) && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Microphone size={16} weight="duotone" />
              <span>Recognized:</span>
            </div>
            <p className="text-lg font-mono">
              {voice.transcript || voice.interimTranscript}
              {voice.interimTranscript && (
                <span className="text-muted-foreground"> (interim)</span>
              )}
            </p>
            {voice.lastResult && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  Confidence: {Math.round(voice.lastResult.confidence * 100)}%
                </Badge>
              </div>
            )}
          </div>
        )}

        {voice.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{voice.error}</p>
          </div>
        )}

        {!voice.isSupported && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-warning">Browser Not Supported</p>
                <p className="text-sm text-muted-foreground">
                  Voice commands require Chrome, Edge, or Safari. Please use a supported browser to enable voice control.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as VoiceCommandCategory | 'all')}>
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-7">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {cat === 'all' ? 'All' : voiceCommandCategories[cat as VoiceCommandCategory]?.split(' ')[0] || cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredCommands.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <List size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No commands found</p>
                  </div>
                ) : (
                  filteredCommands.map((command, index) => (
                    <div key={command.id}>
                      <div className="space-y-3 py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{command.description}</h4>
                              {command.requiresConfirmation && (
                                <Badge variant="outline" className="text-xs">
                                  Requires Confirmation
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {command.phrases.slice(0, 3).map((phrase, i) => (
                                <Badge 
                                  key={i} 
                                  variant="secondary"
                                  className="font-mono text-xs"
                                >
                                  "{phrase}"
                                </Badge>
                              ))}
                              {command.phrases.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{command.phrases.length - 3} more
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Category: {voiceCommandCategories[command.category]}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              voice.speak(command.phrases[0])
                              setTimeout(() => {
                                onCommand(command.action)
                              }, 1500)
                            }}
                            disabled={!voice.isSupported}
                          >
                            Test
                          </Button>
                        </div>
                      </div>
                      {index < filteredCommands.length - 1 && <Separator />}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {voice.isSupported && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Info size={16} />
              Quick Tips
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
              <li>Speak clearly and naturally</li>
              <li>Wait for the command to be recognized before speaking again</li>
              {settings.wakeWord && (
                <li>Start commands with "{settings.wakeWord}" for better accuracy</li>
              )}
              <li>Say "help" to see all available commands</li>
              <li>Say "stop listening" to deactivate voice commands</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
