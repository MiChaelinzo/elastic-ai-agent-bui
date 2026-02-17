import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Book, Sparkle, ArrowRight } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import type { KnowledgeArticle } from '@/lib/knowledge-base'
import { findSimilarArticles } from '@/lib/knowledge-base'

interface SimilarArticlesBadgeProps {
  incident: Incident
  articles: KnowledgeArticle[]
  onArticleClick: (article: KnowledgeArticle) => void
}

export function SimilarArticlesBadge({ incident, articles, onArticleClick }: SimilarArticlesBadgeProps) {
  const [similarArticles, setSimilarArticles] = useState<Array<KnowledgeArticle & { relevanceScore: number }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (articles.length > 0 && !hasSearched) {
      setIsLoading(true)
      findSimilarArticles(incident, articles)
        .then(results => {
          setSimilarArticles(results.filter(a => a.relevanceScore >= 60))
          setHasSearched(true)
        })
        .catch(err => {
          console.error('Failed to find similar articles:', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [incident, articles, hasSearched])

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse bg-muted">
        <Sparkle size={14} className="mr-1 animate-spin" />
        Searching KB...
      </Badge>
    )
  }

  if (similarArticles.length === 0) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20"
        >
          <Book size={16} weight="duotone" className="text-primary" />
          <span className="text-primary font-semibold">
            {similarArticles.length} Similar Solution{similarArticles.length !== 1 ? 's' : ''}
          </span>
          <Badge variant="secondary" className="ml-1 bg-primary/20">
            {Math.round(similarArticles[0].relevanceScore)}% match
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4 border-b border-border bg-muted/30">
          <h4 className="font-semibold flex items-center gap-2 text-sm">
            <Book size={18} weight="duotone" className="text-primary" />
            Similar Knowledge Articles
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            These solutions may help resolve this incident faster
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {similarArticles.map((article) => (
            <div
              key={article.id}
              className="p-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onArticleClick(article)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h5 className="font-semibold text-sm line-clamp-2 flex-1">
                  {article.title}
                </h5>
                <Badge 
                  variant="secondary"
                  className="shrink-0 bg-primary/20 text-primary"
                >
                  {Math.round(article.relevanceScore)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {article.summary}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                  {article.severity && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        article.severity === 'critical' ? 'border-destructive text-destructive' :
                        article.severity === 'high' ? 'border-warning text-warning' :
                        article.severity === 'medium' ? 'border-primary text-primary' :
                        'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {article.severity}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onArticleClick(article)
                  }}
                >
                  View Solution
                  <ArrowRight size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
