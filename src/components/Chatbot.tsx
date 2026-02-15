import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { VoiceChat } from '@/components/VoiceChat'
import { 
  ChatCircle, 
  PaperPlaneRight, 
  Image as ImageIcon, 
  File as FileIcon, 
  VideoCamera,
  Microphone,
  X,
  Sparkle,
  Paperclip,
  XCircle,
  ArrowUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { ChatMessage, ChatAttachment, ChatRecommendation } from '@/lib/chatbot-types'
import type { Incident } from '@/lib/types'
import { sendChatMessage, generateRecommendations, simulateFileUpload } from '@/lib/chatbot-service'
import { cn } from '@/lib/utils'

interface ChatbotProps {
  incidents: Incident[]
  onRecommendationAction?: (action: string) => void
}

export function Chatbot({ incidents, onRecommendationAction }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [messages, setMessages] = useKV<ChatMessage[]>('chatbot-messages', [])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [recommendations, setRecommendations] = useState<ChatRecommendation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      scrollToBottom()
    }
  }, [isOpen, messages])

  useEffect(() => {
    const recs = generateRecommendations(incidents, messages || [])
    setRecommendations(recs)
  }, [incidents, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    }

    setMessages(current => [...(current || []), userMessage])
    setInputValue('')
    setAttachments([])
    setIsLoading(true)

    try {
      const response = await sendChatMessage(
        userMessage.content,
        messages || [],
        userMessage.attachments
      )

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      }

      setMessages(current => [...(current || []), assistantMessage])
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1)
      }
    } catch (error) {
      toast.error('Failed to send message', {
        description: 'Please try again'
      })
    } finally {
      setIsLoading(false)
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

  const handleVoiceTranscript = (transcript: string) => {
    setInputValue(transcript)
    setShowVoiceChat(false)
  }

  const handleRecommendationClick = (action: string) => {
    if (onRecommendationAction) {
      onRecommendationAction(action)
    }
    toast.success('Action triggered', {
      description: 'Opening requested view'
    })
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Chat history cleared')
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg relative"
        >
          <ChatCircle size={28} weight="duotone" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {showVoiceChat && (
        <VoiceChat
          onTranscriptComplete={handleVoiceTranscript}
          onClose={() => setShowVoiceChat(false)}
        />
      )}

      <Card className="w-[420px] h-[600px] flex flex-col shadow-xl border-primary/20">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ChatCircle size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Elastic Agent Orchestrator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceChat(!showVoiceChat)}
                className={cn(
                  "relative",
                  showVoiceChat && "bg-primary/10"
                )}
              >
                <Microphone size={18} weight={showVoiceChat ? "fill" : "regular"} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {recommendations.length > 0 && (
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkle size={16} weight="duotone" className="text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">
                Recommendations
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.slice(0, 3).map(rec => (
                <Button
                  key={rec.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecommendationClick(rec.action)}
                  className="text-xs h-7"
                >
                  {rec.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {(messages || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ChatCircle size={48} weight="duotone" className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">Welcome to AI Assistant</p>
                <p className="text-xs">
                  Ask me about incidents, metrics, or system status
                </p>
              </div>
            )}

            {(messages || []).map(message => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg p-3",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {message.attachments.map(attachment => (
                        <div
                          key={attachment.id}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded text-xs",
                            message.role === 'user'
                              ? "bg-primary-foreground/10"
                              : "bg-background"
                          )}
                        >
                          {getAttachmentIcon(attachment.type)}
                          <span className="flex-1 truncate">{attachment.name}</span>
                          <span className="text-xs opacity-70">
                            {(attachment.size / 1024).toFixed(1)}KB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.isVoice && (
                    <Badge 
                      variant="secondary" 
                      className="mt-2 text-xs"
                    >
                      <Microphone size={12} className="mr-1" />
                      Voice
                    </Badge>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-xs"
                >
                  {getAttachmentIcon(attachment.type)}
                  <span className="max-w-[150px] truncate">{attachment.name}</span>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="hover:text-destructive"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip size={18} />
            </Button>

            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="pr-10"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
              size="sm"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </Button>
          </div>

          {(messages || []).length > 0 && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-xs"
              >
                Clear chat
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
