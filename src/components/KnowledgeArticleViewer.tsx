import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Book, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Sparkle,
  Calendar,
  Tag,
  ArrowLeft,
  Link as LinkIcon,
  Download,
  Share,
  FileText
} from '@phosphor-icons/react'
import { formatDate } from '@/lib/utils'
import { type KnowledgeArticle, findSimilarArticles } from '@/lib/knowledge-base'
import type { Incident } from '@/lib/types'
import { Marked } from 'marked'
import { toast } from 'sonner'

interface KnowledgeArticleViewerProps {
  article: KnowledgeArticle | null
  allArticles: KnowledgeArticle[]
  relatedIncidents?: Incident[]
  onBack: () => void
  onRateArticle: (articleId: string, helpful: boolean) => void
  onSelectArticle: (article: KnowledgeArticle) => void
  onViewIncident?: (incidentId: string) => void
}

const marked = new Marked()

export function KnowledgeArticleViewer({
  article,
  allArticles,
  relatedIncidents = [],
  onBack,
  onRateArticle,
  onSelectArticle,
  onViewIncident
}: KnowledgeArticleViewerProps) {
  const [similarArticles, setSimilarArticles] = useState<Array<KnowledgeArticle & { relevanceScore: number }>>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)

  useEffect(() => {
    if (!article || !relatedIncidents.length) {
      setSimilarArticles([])
      return
    }

    const loadSimilarArticles = async () => {
      setLoadingSimilar(true)
      try {
        const incident = relatedIncidents[0]
        if (incident) {
          const similar = await findSimilarArticles(
            incident,
            allArticles.filter(a => a.id !== article.id)
          )
          setSimilarArticles(similar)
        }
      } catch (error) {
        console.error('Failed to load similar articles:', error)
      } finally {
        setLoadingSimilar(false)
      }
    }

    loadSimilarArticles()
  }, [article, allArticles, relatedIncidents])

  if (!article) {
    return (
      <Alert>
        <Book size={20} />
        <AlertDescription>
          No article selected. Please select an article to view.
        </AlertDescription>
      </Alert>
    )
  }

  const helpfulnessRating = article.helpful + article.notHelpful > 0
    ? Math.round((article.helpful / (article.helpful + article.notHelpful)) * 100)
    : null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'incident': return 'bg-destructive text-destructive-foreground'
      case 'solution': return 'bg-success text-success-foreground'
      case 'procedure': return 'bg-primary text-primary-foreground'
      case 'troubleshooting': return 'bg-warning text-warning-foreground'
      case 'best-practice': return 'bg-accent text-accent-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-warning text-warning-foreground'
      case 'medium': return 'bg-primary text-primary-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?article=${article.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  const handleExport = () => {
    const content = `# ${article.title}\n\n${article.summary}\n\n${article.content}\n\n---\nGenerated: ${formatDate(article.createdAt)}\nCreated by: ${article.createdBy}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Article exported successfully')
  }

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.summary,
      url: `${window.location.origin}${window.location.pathname}?article=${article.id}`
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        toast.success('Article shared successfully')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink()
        }
      }
    } else {
      handleCopyLink()
    }
  }

  const contentHtml = marked.parse(article.content) as string

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={18} className="mr-2" />
            Back to Knowledge Base
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <LinkIcon size={16} className="mr-2" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={16} className="mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryColor(article.category)}>
                  {article.category.replace('-', ' ')}
                </Badge>
                {article.severity && (
                  <Badge variant="outline" className={getSeverityColor(article.severity)}>
                    {article.severity}
                  </Badge>
                )}
                {article.autoGenerated && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkle size={14} />
                    AI-Generated
                  </Badge>
                )}
              </div>
            </div>
            <CardTitle className="text-3xl">{article.title}</CardTitle>
            <CardDescription className="text-base mt-3">
              {article.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye size={16} />
                <span>{article.views} views</span>
              </div>
              {helpfulnessRating !== null && (
                <div className="flex items-center gap-1.5">
                  <ThumbsUp size={16} />
                  <span>{helpfulnessRating}% found helpful ({article.helpful + article.notHelpful} ratings)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>{formatDate(article.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={16} />
                <span>{article.createdBy}</span>
              </div>
            </div>

            <Separator />

            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Tag size={16} />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Was this article helpful?
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onRateArticle(article.id, true)
                  toast.success('Thank you for your feedback!')
                }}
              >
                <ThumbsUp size={18} className="mr-2" />
                Yes ({article.helpful})
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onRateArticle(article.id, false)
                  toast.info('Thank you for your feedback!')
                }}
              >
                <ThumbsDown size={18} className="mr-2" />
                No ({article.notHelpful})
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-6">
        {relatedIncidents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Incidents</CardTitle>
              <CardDescription>
                Incidents that this article was generated from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {relatedIncidents.map((incident) => (
                    <Card 
                      key={incident.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewIncident?.(incident.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline">
                              {incident.status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm line-clamp-2">
                            {incident.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {incident.description}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(incident.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {similarArticles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Similar Articles</CardTitle>
              <CardDescription>
                You might also find these helpful
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {similarArticles.map((similarArticle) => (
                    <Card 
                      key={similarArticle.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onSelectArticle(similarArticle)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge className={getCategoryColor(similarArticle.category)}>
                              {similarArticle.category.replace('-', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {similarArticle.relevanceScore}% match
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm line-clamp-2">
                            {similarArticle.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {similarArticle.summary}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              {similarArticle.views}
                            </div>
                            {similarArticle.helpful + similarArticle.notHelpful > 0 && (
                              <div className="flex items-center gap-1">
                                <ThumbsUp size={12} />
                                {Math.round((similarArticle.helpful / (similarArticle.helpful + similarArticle.notHelpful)) * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {loadingSimilar && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                Finding similar articles...
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
