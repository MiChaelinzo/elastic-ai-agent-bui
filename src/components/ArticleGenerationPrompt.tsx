import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, Book, X } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface ArticleGenerationPromptProps {
  incident: Incident
  onGenerate: () => void
  onDismiss: () => void
  isGenerating?: boolean
}

export function ArticleGenerationPrompt({ 
  incident, 
  onGenerate, 
  onDismiss,
  isGenerating = false 
}: ArticleGenerationPromptProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-8 right-8 z-50 max-w-md"
      >
        <Card className="border-2 border-primary/50 shadow-2xl bg-card/95 backdrop-blur">
          <CardHeader className="pb-3 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="absolute top-2 right-2 h-6 w-6 p-0"
              disabled={isGenerating}
            >
              <X size={16} />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Sparkle size={20} weight="duotone" className="text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Generate Knowledge Article</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs mt-2">
              Incident "{incident.title}" was successfully resolved. Generate a knowledge article to help solve similar issues faster in the future.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-3 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Book size={14} />
              <span>AI will analyze the incident and create a comprehensive solution guide</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                Auto-tagged
              </Badge>
              <Badge variant="outline" className="text-xs">
                Searchable
              </Badge>
              <Badge variant="outline" className="text-xs">
                AI-powered
              </Badge>
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              disabled={isGenerating}
              className="flex-1"
            >
              Later
            </Button>
            <Button
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Sparkle size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkle size={16} className="mr-2" weight="duotone" />
                  Generate Now
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
