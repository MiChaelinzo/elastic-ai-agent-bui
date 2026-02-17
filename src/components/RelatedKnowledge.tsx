import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Book, Sparkle, ThumbsUp, Eye, ArrowRight, CheckCircle } from '@phosphor-icons/react'
import type { Incident } from '@/lib/types'
import type { KnowledgeArticle } from '@/lib/knowledge-base'
import { findSimilarArticles } from '@/lib/knowledge-base'

interface RelatedKnowledgeProps {
  incident: Incident
  articles: KnowledgeArticle[]
  onArticleClick: (article: KnowledgeArticle) => void
  maxArticles?: number
}

export function RelatedKnowledge({ 
  incident, 
  articles, 
  onArticleClick,
  maxArticles = 3 
}: RelatedKnowledgeProps) {
  const [similarArticles, setSimilarArticles] = useState<Array<KnowledgeArticle & { relevanceScore: number }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (articles.length === 0) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    findSimilarArticles(incident, articles)
      .then(results => {
        setSimilarArticles(results.filter(a => a.relevanceScore >= 60).slice(0, maxArticles))
      })
      .catch(err => {
        console.error('Failed to find similar articles:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [incident, articles, maxArticles])

  if (isLoading) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Book size={20} weight="duotone" className="text-primary" />
            Related Knowledge
          </CardTitle>
          <CardDescription className="text-xs">
            Searching knowledge base for similar solutions...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (similarArticles.length === 0) {
    return (
      <Alert className="border-muted">
        <Book size={18} className="text-muted-foreground" />
        <AlertDescription className="text-xs">
          No similar knowledge articles found. This may be a new type of incident. Consider generating a knowledge article after resolution.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/20 rounded">
              <Book size={18} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Related Knowledge</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {similarArticles.length} similar solution{similarArticles.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            <Sparkle size={12} className="mr-1" />
            AI Matched
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {similarArticles.map((article) => {
          const helpfulPercentage = article.helpful + article.notHelpful > 0
            ? Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)
            : 0

          return (
            <Card
              key={article.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors border-border"
              onClick={() => onArticleClick(article)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm line-clamp-2 flex-1">
                    {article.title}
                  </CardTitle>
                  <Badge 
                    variant="secondary"
                    className="shrink-0 bg-primary/20 text-primary font-semibold"
                  >
                    {Math.round(article.relevanceScore)}% match
                  </Badge>
                </div>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {article.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{article.views}</span>
                    </div>
                    {article.helpful + article.notHelpful > 0 && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={14} className={helpfulPercentage >= 70 ? 'text-success' : ''} />
                        <span>{helpfulPercentage}%</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs py-0">
                      {article.category}
                    </Badge>
                    {article.autoGenerated && (
                      <Badge variant="outline" className="text-xs py-0 border-primary/30 text-primary">
                        <Sparkle size={10} className="mr-1" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      onArticleClick(article)
                    }}
                  >
                    View
                    <ArrowRight size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        
        {similarArticles.length >= maxArticles && (
          <Alert className="border-primary/30 bg-primary/5">
            <CheckCircle size={18} className="text-primary" />
            <AlertDescription className="text-xs">
              Showing top {maxArticles} matches. Open Knowledge Base to see all related articles.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
